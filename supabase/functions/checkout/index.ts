// Tarih Ajanı — Ödeme başlatma (Shopier). Tutar KATALOGDAN gelir; istemci fiyat göndermez.
// Deploy: Edge Functions > checkout > bu kodu yapıştır > Deploy
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (otomatik), SHOPIER_API_KEY, SHOPIER_API_SECRET
// Güvenlik: istemci yalnız product_code gönderir. "69₺ öde, Başmüfettiş al" saldırısı imkânsız.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (s: number, b: unknown) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const SHOPIER_PAY_URL = "https://www.shopier.com/ShowProduct/api_pay4.php";

async function hmacB64(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const SB_URL = Deno.env.get("SUPABASE_URL");
  const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const API_KEY = Deno.env.get("SHOPIER_API_KEY");
  const API_SECRET = Deno.env.get("SHOPIER_API_SECRET");
  if (!SB_URL || !SVC || !API_KEY || !API_SECRET) return json(500, { error: "server_misconfigured" });
  const admin = createClient(SB_URL, SVC);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { error: "unauthenticated" });
  const { data: ud } = await admin.auth.getUser(token);
  if (!ud?.user) return json(401, { error: "unauthenticated" });
  const user = ud.user;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json(400, { error: "bad_json" }); }
  const code = String(body.product_code || "").trim();
  if (!code) return json(400, { error: "product_code_required" });

  // Fiyat KATALOGDAN
  const { data: product } = await admin.from("products").select("*").eq("code", code).eq("active", true).maybeSingle();
  if (!product) return json(404, { error: "product_not_found" });

  // pending sipariş — tutar buradan doğrulanır (callback'ten DEĞİL)
  const { data: order, error: oErr } = await admin.from("orders").insert({
    user_id: user.id, product_code: product.code, amount_try: product.price,
    currency: "TRY", provider: "shopier", status: "pending",
  }).select().single();
  if (oErr) return json(500, { error: "order_create_failed", detail: oErr.message });

  const randomNr = String(Math.floor(Math.random() * 900000) + 100000);
  const total = Number(product.price).toFixed(2);
  const currency = 0; // 0 = TRY

  const args: Record<string, unknown> = {
    API_key: API_KEY, website_index: 1, platform_order_id: order.id,
    product_name: product.title || product.code, product_type: 1,
    buyer_name: body.name || "Ajan", buyer_surname: body.surname || "Kullanici",
    buyer_email: user.email, buyer_account_age: 0, buyer_id_nr: String(user.id).slice(0, 8),
    buyer_phone: body.phone || "", billing_address: body.address || "-", billing_city: body.city || "-",
    billing_country: "Türkiye", billing_postcode: body.postcode || "-",
    shipping_address: body.address || "-", shipping_city: body.city || "-",
    shipping_country: "Türkiye", shipping_postcode: body.postcode || "-",
    total_order_value: total, currency, platform: 0, is_in_frame: 0,
    current_language: 0, modul_version: "1.0.4", random_nr: randomNr,
  };
  // ⚠️ DOĞRULA: giden imza bileşen sırası Shopier modül sürümüne göre değişebilir.
  // İlk canlı denemede "API Anahtarı hatalı" alırsan sorun %90 burada — panel örneğiyle karşılaştır.
  // (Gelen callback imzası farklıdır ve shopier-webhook'ta doğru uygulanmıştır.)
  args.signature = await hmacB64(API_SECRET, randomNr + order.id + total + String(currency));

  return json(200, { action: SHOPIER_PAY_URL, fields: args, order_id: order.id });
});
