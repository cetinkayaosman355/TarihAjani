// ============================================================
// STORIA — "storia-admin" edge function (yönetici paneli sunucu yarısı)
// Tek istemcisi storia/admin.html'dir. Tüm eylemler password ile korunur.
//   list                       → profiles + son credit_log + tier_defs
//   grant   {id, amount, reason?}   → kullanıcıya kredi yükle (IBAN ödemesi sonrası)
//   setTier {id, tier, billing?}    → paket ata (kota + süre + kredi)
//   setQuota {id, quota}            → aylık kotayı elle ayarla
// Secret: STORIA_ADMIN_PASSWORD (yoksa ADMIN_PASSWORD'a düşer).
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY otomatik gelir.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Geçersiz istek gövdesi" }, 400); }

  const pass = Deno.env.get("STORIA_ADMIN_PASSWORD") || Deno.env.get("ADMIN_PASSWORD");
  if (!pass || body.password !== pass) return json({ ok: false, error: "Şifre hatalı" }, 401);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const action = String(body.action || "");

  if (action === "list") {
    const [profiles, log, tiers] = await Promise.all([
      db.from("profiles").select("id,email,tier,credits,monthly_quota,expires_at,created_at").order("created_at", { ascending: false }).limit(500),
      db.from("credit_log").select("user_id,delta,reason,created_at").order("created_at", { ascending: false }).limit(100),
      db.from("tier_defs").select("*").order("price_monthly", { ascending: true }),
    ]);
    return json({ ok: true, profiles: profiles.data || [], log: log.data || [], tiers: tiers.data || [] });
  }

  if (action === "grant") {
    const amount = Math.floor(Number(body.amount));
    const id = String(body.id || "");
    if (!id || !amount) return json({ ok: false, error: "id ve amount gerekli" }, 400);
    const { data, error } = await db.rpc("grant_credits", { p_user: id, p_amount: amount, p_reason: String(body.reason || "admin_yukleme") });
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, credits: data });
  }

  if (action === "setTier") {
    const id = String(body.id || "");
    const tier = String(body.tier || "");
    const billing = body.billing === "yil" ? "yil" : "ay";
    const { data: def, error: defErr } = await db.from("tier_defs").select("quota").eq("id", tier).single();
    if (defErr || !def) return json({ ok: false, error: "Geçersiz seviye: " + tier }, 400);
    // Ücretsiz 'kesif' süresizdir; paralı paketler süreye bağlıdır (dolunca kesif'e düşer).
    const expires = tier === "kesif" ? null
      : new Date(Date.now() + (billing === "yil" ? 365 : 30) * 86400_000).toISOString();
    // Paket alımı mevcut bakiyeyi EZMEZ, üstüne ekler.
    const { data: cur } = await db.from("profiles").select("credits").eq("id", id).single();
    const newCredits = Math.max(0, Number(cur?.credits) || 0) + (tier === "kesif" ? 0 : def.quota);
    const { error } = await db.from("profiles").update({
      tier, monthly_quota: def.quota, billing, expires_at: expires,
      credits: newCredits, credits_reset_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return json({ ok: false, error: error.message }, 500);
    if (tier !== "kesif") await db.from("credit_log").insert({ user_id: id, delta: def.quota, reason: "seviye_degisikligi:" + tier });
    return json({ ok: true, tier, monthly_quota: def.quota, expires_at: expires });
  }

  if (action === "setQuota") {
    const id = String(body.id || "");
    const quota = Math.max(0, Math.floor(Number(body.quota) || 0));
    const { error } = await db.from("profiles").update({ monthly_quota: quota }).eq("id", id);
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, monthly_quota: quota });
  }

  return json({ ok: false, error: "Bilinmeyen eylem: " + action }, 400);
});
