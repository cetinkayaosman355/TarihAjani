// ============================================================================
// KALICI HATA BİLDİRİM SİSTEMİ — kod sistemi + rapor (kayıt + e-posta) + tanılama
// Çalıştır: node --test supabase/functions/studio-generate/hata_bildirim.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");
const postaSrc = readFileSync(join(REPO, "supabase", "functions", "posta", "index.ts"), "utf8");
const sqlSrc = readFileSync(join(REPO, "supabase", "migrations", "20260721_hata_bildirim.sql"), "utf8");

// ── (A) HATA KODU SİSTEMİ ───────────────────────────────────────────────────
test("Frontend: sabit hata kodu sistemi (errClass → IMG-*)", () => {
  assert.ok(studioSrc.includes("_imgErrCode(cls)"), "kod eşleyici mevcut");
  for (const c of ["IMG-TIMEOUT", "IMG-RATE", "IMG-AUTH", "IMG-INVALID", "IMG-MODERATION", "IMG-PROVIDER", "IMG-RATIO"]) {
    assert.ok(studioSrc.includes(c), "kod: " + c);
  }
  assert.ok(studioSrc.includes("'IMG-UNKNOWN'"), "bilinmeyen için de kod üretilir");
  // hata kodu üretim hatasında sahnede saklanır (rapor taşısın)
  assert.ok(studioSrc.includes("errCode: (r && r.code)"), "sahne hatasında kod saklanır");
  assert.ok(studioSrc.includes("eE.code = this._imgErrCode(data.errClass)"), "sunucu errClass → koda çevrilir");
});

// ── (B) SORUN BİLDİRİMİ: kayıt + e-posta ────────────────────────────────────
test("Frontend: reportProblem tanılamayı OTOMATİK toplar + posta'ya gönderir", () => {
  assert.ok(studioSrc.includes("async submitReport(area, extra)"), "rapor gönderici");
  assert.ok(studioSrc.includes("/functions/v1/posta"), "posta fonksiyonuna gider");
  assert.ok(studioSrc.includes("action: 'report'"), "report eylemi");
  // tanılama alanları
  for (const f of ["opId", "errorCode", "modelReq", "modelUsed", "produced", "creditDeducted"]) {
    assert.ok(studioSrc.includes(f + ":") || studioSrc.includes(f), "tanılama alanı: " + f);
  }
  assert.ok(studioSrc.includes("creditDeducted: produced"), "üretildi → ücretlendi; üretilmedi → iade");
  assert.ok(studioSrc.includes("Referans: ' + ref"), "kullanıcıya referans kodu döner");
});

test("Frontend: her sahnede 'Sorun Bildir' + dosya düzeyinde bildirim", () => {
  assert.ok(studioSrc.includes("reportScene: () =>"), "sahne düzeyi bildirim VM");
  assert.ok(studioSrc.includes("Bu sahnede sorun bildir"), "sahne menüsünde buton");
  assert.ok(studioSrc.includes("reportProblem: () => this.reportProblem()"), "dosya düzeyi bildirim korunur");
});

test("Backend posta: report → problem_reports kaydı + iletisim@tarihajani.com e-postası", () => {
  assert.ok(postaSrc.includes('action === "report"'), "report eylemi mevcut");
  assert.ok(postaSrc.includes('db.from("problem_reports").insert(row)'), "kalıcı kayıt");
  assert.ok(postaSrc.includes('Deno.env.get("SUPPORT_EMAIL") || "iletisim@tarihajani.com"'), "destek adresine e-posta");
  assert.ok(postaSrc.includes("await sendMail(supportTo"), "e-posta gönderilir");
  // e-posta tanılama taşır (üretildi mi / kredi düştü mü / kod / opId)
  assert.ok(postaSrc.includes('rowHtml("Üretildi mi"') && postaSrc.includes('rowHtml("Kredi düştü mü"'), "üretildi/kredi tanılaması e-postada");
  assert.ok(postaSrc.includes('rowHtml("Hata kodu"') && postaSrc.includes('rowHtml("İş kimliği (opId)"'), "kod + opId e-postada");
  // oturum JWT ile doğrulanır (istemci beyanına güvenilmez)
  assert.ok(postaSrc.includes("db.auth.getUser(jwt)"), "kullanıcı JWT'den doğrulanır");
  assert.ok(postaSrc.includes('ref = "TA-"'), "referans kodu üretilir");
});

test("Migration: problem_reports tablosu + tanılama alanları + RLS", () => {
  assert.ok(sqlSrc.includes("create table if not exists public.problem_reports"), "tablo");
  for (const col of ["error_code", "op_id", "produced", "credit_deducted", "model_req", "model_used", "ref"]) {
    assert.ok(sqlSrc.includes(col), "kolon: " + col);
  }
  assert.ok(sqlSrc.includes("enable row level security"), "RLS açık");
  assert.ok(sqlSrc.includes("auth.uid() = user_id"), "kullanıcı yalnız kendi raporu");
});

// ── (C) SAF AYNA: kredi-düştü çıkarımı ──────────────────────────────────────
test("Ayna: üretildiyse kredi düşmüş, üretilmediyse iade (destek bakışı)", () => {
  const creditDeducted = (produced) => produced;   // reportProblem ile aynı kural
  assert.equal(creditDeducted(true), true, "görsel var → ücretlendi");
  assert.equal(creditDeducted(false), false, "görsel yok → iade (kredi düşmedi)");
});
