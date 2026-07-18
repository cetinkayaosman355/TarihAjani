// Tarih Ajanı — Shopier ödeme bildirim (webhook). Kredi/tier YALNIZ orders.product_code'dan verilir.
// Deploy: Edge Functions > shopier-webhook > bu kodu yapıştır > Deploy
//   ⚠️ Bu fonksiyon "verify_jwt = false" ile deploy edilmeli (Shopier JWT göndermez).
//      Supabase Dashboard > Edge Functions > shopier-webhook > Details > "Verify JWT" KAPALI.
// Shopier paneli > Ödeme Bildirim URL:
//   https://<PROJE>.supabase.co/functions/v1/shopier-webhook
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (otomatik), SHOPIER_API_SECRET
// Kurallar: imza doğrula · callback tek başına kanıt değil (tutar orders'tan) · idempotent · HER ZAMAN 200.
import { createClient } from "npm:@supabase/supabase-js@2";

const ok = (m: string) => new Response(m, { status: 200 });

async function hmacB64(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
// Sabit zamanlı karşılaştırma (string == zamanlama sızdırır)
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return ok("ignored");

  const SB_URL = Deno.env.get("SUPABASE_URL");
  const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const SECRET = Deno.env.get("SHOPIER_API_SECRET");
  if (!SB_URL || !SVC || !SECRET) { console.error("[shopier] server_misconfigured"); return ok("misconfigured"); }
  const admin = createClient(SB_URL, SVC);

  // Shopier form-urlencoded POST eder
  const raw = await req.text();
  const p = Object.fromEntries(new URLSearchParams(raw)) as Record<string, string>;
  const orderId = p.platform_order_id, status = p.status, paymentId = p.payment_id,
        randomNr = p.random_nr, signature = p.signature;

  if (!orderId || !signature || !randomNr) { console.warn("[shopier] eksik parametre", Object.keys(p)); return ok("bad_request"); }

  // 1) İMZA: base64(HMAC-SHA256(random_nr + platform_order_id, secret))
  const expected = await hmacB64(SECRET, String(randomNr) + String(orderId));
  if (!safeEqual(expected, signature)) { console.error("[shopier] İMZA GEÇERSİZ", orderId); return ok("invalid_signature"); }

  // 2) Başarısız ödeme
  if (status !== "success") {
    await admin.from("orders").update({ status: "failed", raw_callback: p }).eq("id", orderId).eq("status", "pending");
    return ok("noted");
  }

  // 3) Uygula — ne verileceği orders.product_code'dan; callback tutarı YOK SAYILIR. İdempotent.
  const { error } = await admin.rpc("apply_paid_order", { p_order: orderId, p_payment_id: paymentId || null, p_raw: p });
  if (error) { console.error("[shopier] apply_paid_order HATASI", orderId, error.message); return ok("deferred"); }

  console.info("[shopier] tamam", orderId);
  return ok("OK");
});
