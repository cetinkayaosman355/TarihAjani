// ============================================================
// TARİH AJANI — "sosyal-kanit" edge function
// Gerçek sosyal kanıt: canlı sayaçlar + moderasyonlu kullanıcı yorumları.
// Ziyaretçi eylemleri (anon):
//   stats                          → {members, productions, reviews, avgRating}
//   list  {limit?}                 → onaylı yorumlar (öne çıkanlar önce)
//   submit {name?, tier?, rating, text}  → yorum bırakır (approved=false)
// Yönetici eylemleri (password = ADMIN_PASSWORD):
//   pending                        → tüm yorumlar (önce onay bekleyenler)
//   moderate {id, approve}         → approve=true onayla · false sil
//   feature  {id, on}              → öne çıkar / kaldır
// Sayaçlar GERÇEK veriden: profiles (üye), credit_log (üretim = delta<0).
// Tablo: public.reviews — RLS açık, anon politika YOK (yalnız bu fonksiyon).
// Secrets: ADMIN_PASSWORD
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

function clean(s: unknown, max: number): string {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

/* ── e-posta bildirimi (sağlayıcı-bağımsız: Resend / Brevo / SendGrid) ── */
function fromParts(): { name: string; email: string; full: string } {
  const raw = Deno.env.get("MAIL_FROM") || "Tarih Ajanı <iletisim@tarihajani.com>";
  const m = raw.match(/^(.*)<(.+)>\s*$/);
  if (m) return { name: m[1].trim() || "Tarih Ajanı", email: m[2].trim(), full: raw };
  return { name: "Tarih Ajanı", email: raw.trim(), full: `Tarih Ajanı <${raw.trim()}>` };
}
async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const from = fromParts();
  const resend = Deno.env.get("RESEND_API_KEY");
  if (resend) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: from.full, to: [to], subject, html }),
    });
    return r.ok;
  }
  const brevo = Deno.env.get("BREVO_API_KEY");
  if (brevo) {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevo, "Content-Type": "application/json" },
      body: JSON.stringify({ sender: { name: from.name, email: from.email }, to: [{ email: to }], subject, htmlContent: html }),
    });
    return r.ok;
  }
  const sg = Deno.env.get("SENDGRID_API_KEY");
  if (sg) {
    const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${sg}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: from.email, name: from.name }, subject, content: [{ type: "text/html", value: html }] }),
    });
    return r.ok;
  }
  return false;
}
async function notifyNewReview(name: string, tier: string, rating: number, body: string): Promise<void> {
  const to = Deno.env.get("ADMIN_EMAIL") || Deno.env.get("MAIL_TO") || "iletisim@tarihajani.com";
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  const stars = "★★★★★☆☆☆☆☆".slice(5 - rating, 10 - rating);
  const html =
    `<div style="font-family:system-ui,sans-serif;max-width:520px;color:#222;">` +
    `<h2 style="margin:0 0 8px;">Yeni yorum · onay bekliyor</h2>` +
    `<p style="margin:0 0 4px;"><b>${esc(name)}</b>${tier ? " · " + esc(tier) : ""}</p>` +
    `<p style="margin:0 0 8px;color:#b8860b;font-size:18px;">${stars} <span style="color:#666;font-size:13px;">(${rating}/5)</span></p>` +
    `<blockquote style="margin:0 0 14px;padding:10px 14px;border-left:3px solid #c19a52;background:#faf7ef;">${esc(body)}</blockquote>` +
    `<p style="margin:0;"><a href="https://tarihajani.com/admin" style="color:#a77d35;">Admin panelinden onayla veya sil →</a></p>` +
    `</div>`;
  try { await sendMail(to, "Tarih Ajanı · Yeni yorum onay bekliyor", html); } catch { /* bildirim hatası submit'i etkilemesin */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch {
    return json({ ok: false, error: "Geçersiz istek gövdesi" }, 400);
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const action = String(b.action || "");

  /* ── ziyaretçi eylemleri ── */

  if (action === "stats") {
    const [mem, prod, rev] = await Promise.all([
      db.from("profiles").select("id", { count: "exact", head: true }),
      db.from("credit_log").select("id", { count: "exact", head: true }).lt("delta", 0),
      db.from("reviews").select("rating").eq("approved", true),
    ]);
    const ratings = (rev.data || []).map((r: { rating: number }) => r.rating || 0);
    const avg = ratings.length
      ? Math.round((ratings.reduce((a, c) => a + c, 0) / ratings.length) * 10) / 10
      : 0;
    return json({
      ok: true,
      members: mem.count || 0,
      productions: prod.count || 0,
      reviews: ratings.length,
      avgRating: avg,
    });
  }

  if (action === "list") {
    const lim = Math.min(48, Math.max(1, Number(b.limit) || 24));
    const q = await db.from("reviews")
      .select("id,name,tier,rating,body,created_at")
      .eq("approved", true)
      .order("featured", { ascending: false })
      .order("id", { ascending: false })
      .limit(lim);
    if (q.error) return json({ ok: false, error: q.error.message }, 500);
    return json({ ok: true, reviews: q.data || [] });
  }

  if (action === "submit") {
    const rating = Math.min(5, Math.max(1, Math.round(Number(b.rating) || 0)));
    const body = clean(b.text, 600);
    const name = clean(b.name, 60) || "Ajan";
    const tier = clean(b.tier, 40);
    if (!rating) return json({ ok: false, error: "Puan seç (1-5)." }, 400);
    if (body.length < 8) return json({ ok: false, error: "Yorum çok kısa." }, 400);
    // taşkın koruması: son 10 dk'da onay bekleyen 40+ yorum varsa dur
    const cnt = await db.from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("approved", false)
      .gt("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());
    if ((cnt.count || 0) >= 40) return json({ ok: false, error: "Şu an yoğunuz, biraz sonra dene." }, 429);
    const ins = await db.from("reviews")
      .insert({ name, tier, rating, body, approved: false })
      .select("id").single();
    if (ins.error) return json({ ok: false, error: ins.error.message }, 500);
    // yorum gelince yöneticiye e-posta bildirimi (hata olsa da submit başarılı)
    await notifyNewReview(name, tier, rating, body);
    return json({ ok: true, id: ins.data.id });
  }

  /* ── yönetici eylemleri ── */

  const pass = Deno.env.get("ADMIN_PASSWORD");
  if (!pass || b.password !== pass) {
    return json({ ok: false, error: "Şifre hatalı" }, 401);
  }

  if (action === "pending") {
    const q = await db.from("reviews")
      .select("id,name,tier,rating,body,approved,featured,created_at")
      .order("approved", { ascending: true })
      .order("id", { ascending: false })
      .limit(200);
    if (q.error) return json({ ok: false, error: q.error.message }, 500);
    return json({ ok: true, reviews: q.data || [] });
  }

  if (action === "moderate") {
    const id = Number(b.id) || 0;
    if (!id) return json({ ok: false, error: "id yok" }, 400);
    if (b.approve) {
      const u = await db.from("reviews").update({ approved: true }).eq("id", id);
      if (u.error) return json({ ok: false, error: u.error.message }, 500);
    } else {
      const d = await db.from("reviews").delete().eq("id", id);
      if (d.error) return json({ ok: false, error: d.error.message }, 500);
    }
    return json({ ok: true });
  }

  if (action === "feature") {
    const id = Number(b.id) || 0;
    if (!id) return json({ ok: false, error: "id yok" }, 400);
    const u = await db.from("reviews").update({ featured: !!b.on }).eq("id", id);
    if (u.error) return json({ ok: false, error: u.error.message }, 500);
    return json({ ok: true });
  }

  return json({ ok: false, error: "Bilinmeyen eylem: " + action }, 400);
});
