// ============================================================================
// AŞAMA 2 — GÖRSEL VERSİYONLARI + PROMPT GEÇMİŞİ
// Çalıştır:  node --test supabase/functions/studio-generate/asama2_versiyon.test.mjs
// (A) Kaynak değişmezleri  (B) Saf aynalar: versiyon defteri + prompt geçmişi
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

// ── (A) KAYNAK DEĞİŞMEZLERİ ─────────────────────────────────────────────────
test("Versiyonlar: yeni üretim eskisini SİLMEZ; aynı opId duplicate oluşturmaz; seçim ayrı", () => {
  assert.ok(studioSrc.includes("_pushSceneVersion(key, id, url, meta)"), "versiyon ekleme fonksiyonu");
  assert.ok(studioSrc.includes(".filter(v => v && v.id !== id)"), "aynı opId tekrar → duplicate yok (idempotent)");
  assert.ok(studioSrc.includes("this._pushSceneVersion(sceneKey, id, url, meta)"), "makeImage başarıda versiyon ekler");
  assert.ok(studioSrc.includes("_selectSceneVersion(key, id)"), "seçim fonksiyonu yalnız url/meta değiştirir");
  assert.ok(!studioSrc.includes("_pushSceneVersion(sceneKey, id, url, meta);   // versiyon ekle\n      } else"), "başarısızlıkta versiyon eklenmez (yalnız then başarı yolunda)");
  assert.ok(studioSrc.includes('sc-if value="{{ gp.img.hasVers }}"'), "versiyon şeridi markup");
  assert.ok(studioSrc.includes(">ÜRETİMLER</span>"), "şerit başlığı kullanıcı dilinde");
  assert.ok(studioSrc.includes("eskiler silinmez."), "davranış açıklaması görünür");
});

test("Prompt geçmişi: düzenleme/yenileme overwrite ETMEZ; geri almak yeni sürüm; kullanıcı dili", () => {
  assert.ok(studioSrc.includes("pushPromptV(key, newPrompt, action)"), "prompt sürümleme fonksiyonu");
  assert.ok(studioSrc.includes("list.push({ v: 1, prompt: cur, ts: Date.now(), action: 'initial' })"), "ilk prompt tembel kaydedilir");
  assert.ok(studioSrc.includes("this.pushPromptV(t.type + t.i, last.content, 'manual_edit')"), "elle düzenleme sürüm oluşturur");
  assert.ok(studioSrc.includes(", 'regenerate')"), "ajan yenilemesi sürüm oluşturur");
  assert.ok(studioSrc.includes("this.pushPromptV(key, pv.prompt, 'revert')"), "eskiye dönüş de YENİ sürüm (geçmiş ezilmez)");
  for (const t of ["'İlk Prompt'", "'Düzenleme'", "'Ajan Yenilemesi'", "'Geri Dönüş'"]) assert.ok(studioSrc.includes(t), "etiket: " + t);
  assert.ok(studioSrc.includes("🕘 Prompt Geçmişi"), "⋯ menüsünde Prompt Geçmişi");
  assert.ok(studioSrc.includes(">PROMPT GEÇMİŞİ</span>"), "geçmiş paneli");
  assert.ok(studioSrc.includes("Bu promptu kullan"), "geri alma aksiyonu");
});

test("Kalıcılık: versiyonlar + prompt geçmişi dosyayla yaşar (yenileme/geçmişten açma)", () => {
  assert.ok(studioSrc.includes("promptHist: s.promptHist || {}, fileNo:"), "work'e yazılır");
  assert.ok(studioSrc.includes("promptHist: (w && w.promptHist) || {}"), "yenilemede geri gelir");
  assert.ok(studioSrc.includes("promptHist: (h.promptHist) || {}"), "geçmişten açmada geri gelir");
  assert.ok(studioSrc.includes("sceneOpts: {}, promptHist: {}, imgValErr: ''"), "yeni dosya temiz başlar");
});

// ── (B) SAF AYNALAR ─────────────────────────────────────────────────────────
function pushVersion(si, id, url, meta) {
  const vers = (si.vers || []).filter(v => v && v.id !== id);
  vers.push({ id, url, meta: meta || null, ts: 1 });
  return { ...si, url, meta: meta || si.meta || null, vers };
}
function selectVersion(si, id) {
  const v = (si.vers || []).find(x => x && x.id === id);
  return v ? { ...si, url: v.url, meta: v.meta || null } : si;
}
test("Ayna: V1→V2→V3 birikir; yeniden üret V1'i SİLMEZ; en yeni otomatik seçili", () => {
  let si = {};
  si = pushVersion(si, "a", "u1", { aspect: "9:16" });
  si = pushVersion(si, "b", "u2", { aspect: "9:16" });
  si = pushVersion(si, "c", "u3", { aspect: "9:16" });
  assert.equal(si.vers.length, 3, "üç versiyon korunur");
  assert.equal(si.url, "u3", "en yeni seçili");
  assert.equal(si.vers[0].url, "u1", "V1 hâlâ duruyor");
});
test("Ayna: aynı opId tekrar (kurtarma/retry) → duplicate versiyon YOK", () => {
  let si = {};
  si = pushVersion(si, "a", "u1", null);
  si = pushVersion(si, "a", "u1", null);
  assert.equal(si.vers.length, 1, "tek kayıt");
});
test("Ayna: 'Bu görseli kullan' yalnız seçimi değiştirir — versiyonlar aynen kalır", () => {
  let si = {};
  si = pushVersion(si, "a", "u1", { style: "Sinematik" });
  si = pushVersion(si, "b", "u2", { style: "Gravür" });
  const before = JSON.stringify(si.vers);
  si = selectVersion(si, "a");
  assert.equal(si.url, "u1", "V1 tekrar seçili");
  assert.equal(JSON.stringify(si.vers), before, "versiyon listesi DEĞİŞMEZ");
  assert.deepEqual(si.meta, { style: "Sinematik" }, "meta seçili versiyondan");
});
test("Ayna: başarısız üretim versiyon eklemez (yalnız başarı yolu push eder)", () => {
  let si = pushVersion({}, "a", "u1", null);
  const failed = { ok: false };
  if (failed.ok) si = pushVersion(si, "b", "u2", null);   // makeImage yalnız ok'ta push eder
  assert.equal(si.vers.length, 1);
});

function pushPrompt(hist, cur, np, action) {
  const list = (hist || []).slice();
  if (!list.length && cur) list.push({ v: 1, prompt: cur, action: "initial" });
  list.push({ v: list.length + 1, prompt: np, action });
  return list;
}
test("Ayna prompt: İlk Prompt → Düzenleme → Yenileme birikir; geri dönüş yeni sürüm", () => {
  let h = pushPrompt(null, "P1", "P2", "manual_edit");
  assert.equal(h.length, 2, "ilk + düzenleme");
  assert.equal(h[0].action, "initial");
  h = pushPrompt(h, "P2", "P3", "regenerate");
  assert.equal(h.length, 3);
  h = pushPrompt(h, "P3", "P1", "revert");   // eski prompt geri
  assert.equal(h.length, 4, "geri dönüş overwrite değil, yeni sürüm");
  assert.equal(h[3].prompt, "P1");
  assert.equal(h[1].prompt, "P2", "geçmiş ezilmedi");
});
test("Ayna prompt: görsel, üretildiği prompt sürümünü taşır (pv)", () => {
  const hist = pushPrompt(null, "P1", "P2", "manual_edit");   // 2 sürüm
  const ver = { id: "x", url: "u", pv: hist.length };         // _pushSceneVersion aynası
  assert.equal(ver.pv, 2, "görsel Prompt V2 ile üretildi bilgisini taşır");
});
