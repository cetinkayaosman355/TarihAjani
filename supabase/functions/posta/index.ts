// ============================================================
// TARİH AJANI — "posta" edge function (e-posta otomasyonu)
// Eylemler:
//   welcome   {email}   → yeni üyeye hoş geldin maili. Sunucu doğrular:
//                         profil var + son 24 saatte açılmış + daha önce
//                         gönderilmemiş (profiles.welcomed_at) — kötüye
//                         kullanılamaz, tek seferliktir.
//   reminders {secret}  → süresi 3 gün içinde dolacak üyelere hatırlatma.
//                         Günlük pg_cron çağırır; secret = ADMIN_PASSWORD.
// Sağlayıcı otomatik seçilir (hangisi tanımlıysa):
//   RESEND_API_KEY → api.resend.com
//   BREVO_API_KEY  → api.brevo.com
//   SENDGRID_API_KEY → api.sendgrid.com
// Gönderen: MAIL_FROM secret'ı; yoksa "Tarih Ajanı <iletisim@tarihajani.com>"
// Gerekli kolonlar (migration 20260712_posta_otomasyon.sql):
//   profiles.welcomed_at, profiles.last_reminder_at
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

/* ── sağlayıcı-bağımsız gönderim ── */
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
      body: JSON.stringify({
        sender: { name: from.name, email: from.email },
        to: [{ email: to }], subject, htmlContent: html,
      }),
    });
    return r.ok;
  }
  const sg = Deno.env.get("SENDGRID_API_KEY");
  if (sg) {
    const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${sg}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from.email, name: from.name },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });
    return r.ok;
  }
  return false;   // hiçbir sağlayıcı anahtarı yok
}

/* ── tema uyumlu şablon ── */
function shell(kicker: string, title: string, bodyHtml: string, ctaText: string, ctaUrl: string): string {
  return `<!DOCTYPE html><html lang="tr"><body style="margin:0;padding:0;background:#06070d;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#06070d;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0a0d15;border:1px solid rgba(193,154,82,.45);">
  <tr><td style="padding:30px 34px 0;text-align:center;">
    <div style="font-family:Courier,monospace;font-size:11px;letter-spacing:4px;color:#c19a52;">TARİH AJANI</div>
    <div style="font-family:Courier,monospace;font-size:10px;letter-spacing:3px;color:#676d7c;margin-top:6px;">${kicker}</div>
  </td></tr>
  <tr><td style="padding:18px 34px 0;text-align:center;">
    <div style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#f2ecd9;line-height:1.25;">${title}</div>
  </td></tr>
  <tr><td style="padding:18px 34px 8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#c9cdd8;">
    ${bodyHtml}
  </td></tr>
  <tr><td style="padding:22px 34px 30px;text-align:center;">
    <a href="${ctaUrl}" style="display:inline-block;background:#d8b26a;color:#171207;font-family:Courier,monospace;font-weight:bold;font-size:13px;letter-spacing:2px;text-decoration:none;padding:15px 30px;">${ctaText}</a>
  </td></tr>
  <tr><td style="padding:0 34px 26px;text-align:center;font-family:Courier,monospace;font-size:10px;letter-spacing:2px;color:#565b69;">
    TARİH SAKLAR, AJAN BULUR · <a href="https://tarihajani.com" style="color:#8f8a7d;">tarihajani.com</a>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {
    return json({ ok: false, error: "Geçersiz istek gövdesi" }, 400);
  }
  const action = String(body.action || "");

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  /* ── hoş geldin (kayıt sonrası, tek seferlik) ── */
  if (action === "welcome") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return json({ ok: false, error: "Geçersiz e-posta" }, 400);
    const { data: prof } = await db.from("profiles")
      .select("id, full_name, created_at, welcomed_at")
      .ilike("email", email).limit(1).maybeSingle();
    if (!prof) return json({ ok: false, error: "Profil yok" }, 404);
    if (prof.welcomed_at) return json({ ok: true, skipped: "zaten gönderildi" });
    const age = Date.now() - new Date(prof.created_at).getTime();
    if (age > 24 * 60 * 60 * 1000) return json({ ok: true, skipped: "eski hesap" });

    const name = (prof.full_name || "Ajan").split(" ")[0];
    const html = shell(
      "GÖREV DOSYASI AÇILDI",
      `Aramıza hoş geldin, ${name}.`,
      `<p>Tarih Ajanı kadrosuna katıldın — hesabına <strong style="color:#e6c478;">30 deneme kredisi</strong> tanımlandı.</p>
       <p>Bu krediyle <strong style="color:#e6c478;">Studio</strong>'da ilk üretimini yapabilirsin: bir tarih fikri yaz; senaryo, seslendirme metni ve sahne promptları dosya halinde önüne gelsin.</p>
       <p>Ayrıca: <a href="https://tarihajani.com/arsiv/katalog/" style="color:#e6c478;">44 vaka dosyalık arşiv kataloğunu</a> incele, <a href="https://tarihajani.com/zaman-tuneli" style="color:#e6c478;">Zaman Tüneli</a>'nde Satranç 1402'yi dene.</p>`,
      "STUDIO'DA ÜRETİME BAŞLA →",
      "https://tarihajani.com/studio",
    );
    const sent = await sendMail(email, "Aramıza hoş geldin, Ajan — 30 deneme kredin hazır 🕵️", html);
    if (sent) await db.from("profiles").update({ welcomed_at: new Date().toISOString() }).eq("id", prof.id);
    return json({ ok: sent, error: sent ? undefined : "Gönderilemedi (sağlayıcı anahtarı eksik olabilir)" });
  }

  /* ── üyelik bitiş hatırlatması (günlük cron) ── */
  if (action === "reminders") {
    const pass = Deno.env.get("ADMIN_PASSWORD");
    if (!pass || body.secret !== pass) return json({ ok: false, error: "Yetkisiz" }, 401);

    const now = Date.now();
    const in3d = new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await db.from("profiles")
      .select("id, email, full_name, tier, expires_at, last_reminder_at")
      .not("expires_at", "is", null)
      .gt("expires_at", new Date(now).toISOString())
      .lt("expires_at", in3d)
      .limit(200);
    if (error) return json({ ok: false, error: error.message }, 500);

    const TIER = { gozlemci: "Gözlemci", ajan: "Ajan", basmufettis: "Başmüfettiş" } as Record<string, string>;
    let sent = 0, skipped = 0;
    for (const p of rows || []) {
      // aynı bitiş penceresi için ikinci kez gönderme
      if (p.last_reminder_at && now - new Date(p.last_reminder_at).getTime() < 4 * 24 * 60 * 60 * 1000) { skipped++; continue; }
      if (!p.email) { skipped++; continue; }
      const days = Math.max(1, Math.ceil((new Date(p.expires_at).getTime() - now) / 86400000));
      const name = (p.full_name || "Ajan").split(" ")[0];
      const tierAd = TIER[p.tier] || p.tier || "üyelik";
      const html = shell(
        "ÜYELİK DURUM RAPORU",
        `${name}, ${tierAd} üyeliğin ${days} gün sonra sona eriyor.`,
        `<p>Bitiş tarihi: <strong style="color:#e6c478;">${new Date(p.expires_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</strong></p>
         <p>Yenilemezsen hesabın ücretsiz seviyeye düşer: hazır hikâye arşivi kapanır, aylık Studio kredin durur. Kaldığın yerden devam etmek için üyeliğini yenile.</p>`,
        "ÜYELİĞİMİ YENİLE →",
        "https://tarihajani.com/uyelik",
      );
      const okSend = await sendMail(p.email, `${tierAd} üyeliğin ${days} gün sonra bitiyor — kaldığın yerden devam et`, html);
      if (okSend) {
        await db.from("profiles").update({ last_reminder_at: new Date().toISOString() }).eq("id", p.id);
        sent++;
      } else skipped++;
    }
    return json({ ok: true, sent, skipped, scanned: (rows || []).length });
  }

  /* ── SORUN BİLDİRİMİ ── kalıcı kayıt + iletisim@tarihajani.com'a e-posta ──
     Kullanıcı "Sorun Bildir"e basınca istemci tanılama toplar (kod, opId, üretildi
     mi, kredi düştü mü, istenen/gerçek model). Burada: problem_reports'a yaz +
     destek adresine e-posta. Kullanıcı oturumluysa user_id/e-posta JWT'den doğrulanır. */
  if (action === "report") {
    const str = (v: unknown, n = 400) => String(v ?? "").slice(0, n);
    const ref = "TA-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 900 + 100);
    // Oturum varsa kullanıcıyı JWT'den doğrula (istemci beyanına güvenme)
    let uid: string | null = null;
    let uemail = str(body.email, 160).trim().toLowerCase();
    try {
      const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (jwt) { const { data } = await db.auth.getUser(jwt); if (data?.user) { uid = data.user.id; uemail = (data.user.email || uemail).toLowerCase(); } }
    } catch { /* anon bildirim de kabul */ }
    const row = {
      ref,
      user_id: uid,
      email: uemail || null,
      area: str(body.area, 20) || "gorsel",
      op_id: str(body.opId, 80),
      scene_key: str(body.sceneKey, 40),
      error_code: str(body.errorCode, 40),
      model_req: str(body.modelReq, 40),
      model_used: str(body.modelUsed, 40),
      produced: body.produced === true,
      credit_deducted: body.creditDeducted === true,
      story_title: str(body.storyTitle, 200),
      message: str(body.message, 2000),
      ua: str(req.headers.get("user-agent"), 300),
    };
    // KALICI KAYIT (servis rolü RLS'i aşar) — hata olsa bile e-posta denenir
    try { await db.from("problem_reports").insert(row); } catch (_e) { /* tablo yoksa yine mail at */ }
    const supportTo = Deno.env.get("SUPPORT_EMAIL") || "iletisim@tarihajani.com";
    const yn = (b: boolean) => b ? "EVET" : "HAYIR";
    const rowHtml = (k: string, v: string) => `<tr><td style="padding:4px 10px;color:#818797;font-family:Courier,monospace;font-size:12px;">${k}</td><td style="padding:4px 10px;color:#e9dfc8;font-size:13px;">${v || "—"}</td></tr>`;
    const html = shell(
      "SORUN BİLDİRİMİ",
      "Yeni sorun bildirimi · " + ref,
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="text-align:left;border:1px solid rgba(193,154,82,.25);">
        ${rowHtml("Referans", ref)}
        ${rowHtml("Alan", row.area)}
        ${rowHtml("Hata kodu", row.error_code)}
        ${rowHtml("Üretildi mi", yn(row.produced))}
        ${rowHtml("Kredi düştü mü", yn(row.credit_deducted))}
        ${rowHtml("İstenen model", row.model_req)}
        ${rowHtml("Gerçek model", row.model_used)}
        ${rowHtml("İş kimliği (opId)", row.op_id)}
        ${rowHtml("Sahne", row.scene_key)}
        ${rowHtml("Dosya", row.story_title)}
        ${rowHtml("Kullanıcı", (uemail || "anonim") + (uid ? " · " + uid : ""))}
      </table>
      <p style="margin:16px 0 4px;color:#c19a52;font-family:Courier,monospace;font-size:11px;letter-spacing:2px;">KULLANICI NOTU</p>
      <p style="color:#cfc8b4;font-size:14px;line-height:1.6;white-space:pre-wrap;">${(row.message || "(not yazılmadı)").replace(/</g, "&lt;")}</p>`,
      "ADMİN'DE AÇ →",
      "https://tarihajani.com/admin",
    );
    const mailed = await sendMail(supportTo, `⚠ Sorun ${ref} · ${row.error_code || row.area}` + (row.credit_deducted ? " · KREDİ DÜŞTÜ" : ""), html);
    return json({ ok: true, ref, mailed });
  }

  return json({ ok: false, error: "Bilinmeyen eylem: " + action }, 400);
});
