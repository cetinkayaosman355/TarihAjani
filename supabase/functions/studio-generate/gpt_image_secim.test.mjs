// ============================================================================
// GPT IMAGE 1 SEÇENEĞİ + ŞEFFAF OTOMATİK YEDEK + ÜCRETSİZ TEKRAR
// Çalıştır: node --test supabase/functions/studio-generate/gpt_image_secim.test.mjs
// Kullanıcı isteği: (1) GPT Image 1 elle seçilebilir motor olsun. (2) GPT Image 2
// zaman aşımına uğrarsa şeffaf biçimde GPT Image 1'e düşülsün, kart bunu söylesin,
// "GPT Image 2 ile tekrar dene" sunulsun. (3) Zaman aşımı otomatik yedeğinde İKİNCİ
// KEZ kredi düşmesin; yalnız başarıyla dönen görselin maliyeti alınsın.
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");
const indexSrc = readFileSync(join(HERE, "index.ts"), "utf8");

// ── (A) GPT IMAGE 1: ELLE SEÇİLEBİLİR MOTOR ─────────────────────────────────
test("Frontend: GPT Image 1 motor seçeneği eklendi (opt-in)", () => {
  assert.ok(studioSrc.includes("{ id: 'gpt1', name: 'GPT Image 1'"), "motor seçeneği tanımı");
  assert.ok(studioSrc.includes("['gpt1', 'GPT Image 1', false]"), "imgProviders listesinde");
  assert.ok(studioSrc.includes("if (k === 'gpt1') return 'gpt1'"), "_provResolve gpt1'i tanır (sunucuya gerçek seçim gider)");
  assert.ok(studioSrc.includes("gpt1: 'GPT Image 1'"), "_provModelLabel etiketi");
});

test("Backend: imageProvider 'gpt1' → openai + gpt-image-1 modeline KİLİTLENİR (sessiz değişim yok)", () => {
  assert.ok(indexSrc.includes('ipRaw === "gpt1" || ipRaw === "gpt-image-1"'), "gpt1 allowlist'te");
  assert.ok(indexSrc.includes('modelForce = "gpt-image-1"'), "gpt1 → model gpt-image-1'e sabitlenir");
  assert.ok(indexSrc.includes("generateImage(String(b.prompt || \"\"), sizeReq, diag, opId, imgProv, styleKey, modelForce, String(b.refImage || \"\"))"), "modelForce + refImage generateImage'a geçer");
  // generateImage: elle model seçilince zincir TEK modele iner
  assert.ok(indexSrc.includes("const useChain = (forcedModel && OPENAI_IMG_MODELS.has(forcedModel)) ? [forcedModel] : chain"), "forced model → tek elemanlı zincir");
});

// ── (B) ŞEFFAF OTOMATİK YEDEK ───────────────────────────────────────────────
test("Backend: yedeğe düşülünce meta.fellBack=true + reqModel döner (şeffaflık)", () => {
  assert.ok(indexSrc.includes("if (diag) diag.reqModel = useChain[0]"), "istenen birincil model diag'a yazılır");
  assert.ok(indexSrc.includes("reqModel: diag.reqModel || \"\""), "meta reqModel taşır");
  assert.ok(indexSrc.includes("fellBack: !!(diag.provider !== \"gemini\" && diag.model && diag.reqModel && diag.model !== diag.reqModel)"), "gerçek model istenenden farklıysa fellBack=true");
});

test("Frontend: kart fellBack'te NET mesaj + 'tekrar dene' gösterir (model adları DİNAMİK)", () => {
  assert.ok(studioSrc.includes("fellBack: !!(((si && si.meta) || {}).fellBack)"), "sceneImgView fellBack okur");
  // Mesaj artık gerçek modelden türetilir (GPT Image 2 hardcode DEĞİL): reqModel → model
  assert.ok(studioSrc.includes("zaman aşımına uğradı. Görseliniz ") && studioSrc.includes(".reqModel) + ' zaman aşımına uğradı"), "mesaj gerçek modeli yazar (dinamik)");
  assert.ok(studioSrc.includes("this._modelLabel(((si && si.meta) || {}).model)"), "üretilen model adı gerçek");
  assert.ok(studioSrc.includes('value="{{ gp.img.fellBack }}"'), "kartta koşullu bildirim");
  assert.ok(studioSrc.includes("retryLabel:") && studioSrc.includes("ile tekrar dene · ücretsiz"), "tekrar dene butonu (dinamik etiket)");
  assert.ok(studioSrc.includes("retryGpt2: () => this.retrySceneWithGpt2"), "buton retrySceneWithGpt2 çağırır");
});

// ── (C) KREDİ: OTOMATİK YEDEK ÇİFT DÜŞMEZ · TEKRAR ÜCRETSİZ ─────────────────
test("Kredi: otomatik yedek TEK rezervasyonla üretir (zaman aşımında ikinci düşüm yok)", () => {
  // generateImage tek çağrı = tek reserveOp/opId; içindeki model zinciri aynı op'ta döner
  const h = indexSrc.slice(indexSrc.indexOf('String(b.action || "") === "image"'), indexSrc.indexOf('String(b.action || "") === "image"') + 4000);
  assert.ok(/reserveOp\(admin, userId, cost, "gorsel", opId\)/.test(indexSrc), "sahne başına tek rezervasyon (opId)");
  // başarı → finalize; başarısız → refund (tek op, çift ücret imkânsız)
  assert.ok(indexSrc.includes("pendingRefund = null;   // başarı → beklenmeyen-hata iadesi devre dışı"), "başarıda finalize, çift değil");
});

test("Kredi: 'GPT Image 2 ile tekrar dene' bir kez ÜCRETSİZ (regen + prevJob, op_locks kilidi)", () => {
  // backend: image action da ücretsiz regen kapsamında
  assert.ok(indexSrc.includes('(String(b.action || "") === "generate" || String(b.action || "") === "image") && b.regen === true'), "image regen ücretsiz-hak kapsamında");
  assert.ok(indexSrc.includes('"regen:" + userId + ":" + regenPrevJob'), "op_locks ile tek sefer bedava (sonsuz bedava yok)");
  // frontend: retry regen+prevJob gönderir, bakiye kapısına takılmaz
  assert.ok(studioSrc.includes("regen: true, prevJob: regenOpt.prevJob"), "istemci regen+prevJob gönderir");
  assert.ok(studioSrc.includes("!(regenOpt && regenOpt.regen) && this.state.credits < cost"), "ücretsiz tekrar bakiye kapısına takılmaz");
  assert.ok(studioSrc.includes("undefined, 'gpt', undefined, prevJob ? { regen: true, prevJob }"), "tekrar GPT Image 2'yi zorlar + prevJob geçer");
});

// ── (D) SAF AYNA: fellBack mantığı ─────────────────────────────────────────
function fellBack(provider, reqModel, usedModel) {
  return !!(provider !== "gemini" && usedModel && reqModel && usedModel !== reqModel);
}
test("Ayna: GPT Image 2 istendi, gpt-image-1 üretti → fellBack", () => {
  assert.equal(fellBack("GPT", "gpt-image-2", "gpt-image-1"), true);
});
test("Ayna: GPT Image 2 istendi, gpt-image-2 üretti → fellBack YOK", () => {
  assert.equal(fellBack("GPT", "gpt-image-2", "gpt-image-2"), false);
});
test("Ayna: GPT Image 1 elle seçildi (req=used) → fellBack YOK (kullanıcının seçimi)", () => {
  assert.equal(fellBack("GPT", "gpt-image-1", "gpt-image-1"), false);
});
test("Ayna: Gemini → fellBack mantığı uygulanmaz (diag.provider küçük harf 'gemini')", () => {
  assert.equal(fellBack("gemini", "x", "y"), false);
});
