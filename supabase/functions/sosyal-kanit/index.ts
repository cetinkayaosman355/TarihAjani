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
