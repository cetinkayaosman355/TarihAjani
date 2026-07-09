// ============================================================
// TARİH AJANI — "credits" edge function (Adım 3 + 4'ün sunucu yarısı)
// Eylemler:
//   Kullanıcı (JWT ile):  balance | spend {amount, reason}
//   Yönetici (password):  grant {id, amount} | setTier {id, tier, billing?}
//                         | setQuota {id, quota} | updateTierDefs {defs}
// Kurulum: Dashboard → Edge Functions → Deploy new function → adı "credits"
// Secret:  ADMIN_PASSWORD  (admin panelinde kullandığınız şifrenin aynısı)
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "POST bekleniyor" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const action = String(body.action || "");

  // ---------- YÖNETİCİ EYLEMLERİ (admin paneli şifresiyle) ----------
  const adminActions = ["grant", "setTier", "setQuota", "updateTierDefs"];
  if (adminActions.includes(action)) {
    const pass = Deno.env.get("ADMIN_PASSWORD");
    if (!pass || body.password !== pass) return json({ ok: false, error: "Yetkisiz" }, 401);

    if (action === "grant") {
      const amount = Math.floor(Number(body.amount));
      const id = String(body.id || "");
      if (!id || !amount) return json({ ok: false, error: "id ve amount gerekli" }, 400);
      const { data, error } = await admin.rpc("grant_credits", {
        p_user: id, p_amount: amount, p_reason: String(body.reason || "admin_tanimlama"),
      });
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true, credits: data });
    }

    if (action === "setTier") {
      const id = String(body.id || "");
      const tier = String(body.tier || "");
      const billing = body.billing === "yil" ? "yil" : "ay";
      const { data: def, error: defErr } = await admin
        .from("tier_defs").select("quota").eq("id", tier).single();
      if (defErr || !def) return json({ ok: false, error: "Geçersiz seviye: " + tier }, 400);

      const expires = tier === "gozlemci"
        ? null
        : new Date(Date.now() + (billing === "yil" ? 365 : 30) * 86400_000).toISOString();
      const { error } = await admin.from("profiles").update({
        tier, monthly_quota: def.quota, billing,
        expires_at: expires, credits: def.quota,
        credits_reset_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) return json({ ok: false, error: error.message }, 500);
      await admin.from("credit_log").insert({
        user_id: id, delta: def.quota, reason: "seviye_degisikligi:" + tier,
      });
      return json({ ok: true, tier, monthly_quota: def.quota, expires_at: expires });
    }

    if (action === "setQuota") {
      const id = String(body.id || "");
      const quota = Math.floor(Number(body.quota));
      if (!id || !quota) return json({ ok: false, error: "id ve quota gerekli" }, 400);
      const { error } = await admin.from("profiles").update({ monthly_quota: quota }).eq("id", id);
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true, monthly_quota: quota });
    }

    if (action === "updateTierDefs") {
      const defs = Array.isArray(body.defs) ? body.defs : [];
      if (!defs.length) return json({ ok: false, error: "defs boş" }, 400);
      const { error } = await admin.from("tier_defs").upsert(defs);
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true });
    }
  }

  // ---------- KULLANICI EYLEMLERİ (giriş yapmış kullanıcı JWT'siyle) ----------
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: userData } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (!user) return json({ ok: false, error: "Giriş gerekli" }, 401);

  if (action === "balance") {
    const { data, error } = await admin.rpc("refresh_profile_credits", { p_user: user.id });
    if (error) return json({ ok: false, error: error.message }, 500);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return json({ ok: false, error: "Profil bulunamadı" }, 404);
    return json({ ok: true, ...row });
  }

  if (action === "spend") {
    const amount = Math.floor(Number(body.amount));
    if (!amount || amount <= 0) return json({ ok: false, error: "Geçersiz miktar" }, 400);
    // Önce vade/kota tazele, sonra atomik düş
    await admin.rpc("refresh_profile_credits", { p_user: user.id });
    const { data, error } = await admin.rpc("spend_credits", {
      p_user: user.id, p_amount: amount, p_reason: String(body.reason || "uretim"),
    });
    if (error) return json({ ok: false, error: error.message }, 500);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.ok) return json({ ok: false, error: "Yetersiz kredi", credits: row?.new_credits ?? 0 }, 402);
    return json({ ok: true, credits: row.new_credits });
  }

  return json({ ok: false, error: "Bilinmeyen eylem: " + action }, 400);
});
