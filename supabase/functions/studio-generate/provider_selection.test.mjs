// ============================================================================
// PROVIDER SELECTION UI — GÖRSEL & VİDEO SAĞLAYICI SEÇİMİ STATİK DOĞRULAMASI
// Çalıştır:  node supabase/functions/studio-generate/provider_selection.test.mjs
//
// (A) Karar mantığı aynaları: görsel imageProvider eşlemesi + video yönlendirmesi
//     (otomatik fallback YOK). ⚠ index.ts değişirse aynalar da güncellenmeli.
// (B) Gerçek kaynak (index.ts + Studio.dc.html) değişmezleri.
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const indexSrc = readFileSync(join(HERE, "index.ts"), "utf8");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

// ── (A1) Görsel sağlayıcı eşlemesi (image handler aynası) ───────────────────
function mapImageProvider(ipRaw) {
  const v = String(ipRaw || "").trim().toLowerCase();
  if (v === "gpt" || v === "openai") return { imgProv: "openai" };
  if (v === "gemini") return { imgProv: "gemini" };
  if (v === "higgs" || v === "higgsfield") return { err: "HIGGS_IMAGE_NOT_CONFIGURED", status: 501 };
  return { imgProv: "" }; // boş → env varsayılanı (openai)
}
function resolveGenProvider(providerOverride, envDefault = "openai") {
  return (providerOverride || envDefault || "openai").trim().toLowerCase();
}

test("Görsel: gpt → openai, gemini → gemini", () => {
  assert.equal(mapImageProvider("gpt").imgProv, "openai");
  assert.equal(mapImageProvider("openai").imgProv, "openai");
  assert.equal(mapImageProvider("gemini").imgProv, "gemini");
});
test("Görsel: higgs → 501 HIGGS_IMAGE_NOT_CONFIGURED (üretim/kredi yok, fallback yok)", () => {
  const r = mapImageProvider("higgs");
  assert.equal(r.err, "HIGGS_IMAGE_NOT_CONFIGURED");
  assert.equal(r.status, 501);
  assert.ok(!r.imgProv);
});
test("Görsel: boş/geçersiz → env varsayılanı (openai)", () => {
  assert.equal(resolveGenProvider(mapImageProvider("").imgProv), "openai");
  assert.equal(resolveGenProvider(mapImageProvider("banana").imgProv), "openai");
  assert.equal(resolveGenProvider(mapImageProvider("gemini").imgProv), "gemini");
});

// ── (A2) Video yönlendirmesi (submitVideo aynası — fallback YOK) ─────────────
function pickProvider(p, envDefault = "grok") {
  const v = String(p || "").toLowerCase();
  return (v === "kling" || v === "grok" || v === "fal" || v === "veo" || v === "higgs" || v === "higgsfield")
    ? (v === "higgsfield" ? "higgs" : v) : envDefault;
}
function routeVideo(provider, envDefault = "grok") {
  const use = pickProvider(provider, envDefault);
  if (use === "veo") return { called: null, err: "VEO_PROVIDER_NOT_CONFIGURED" };
  if (use === "higgs") return { called: null, err: "HIGGS_PROVIDER_NOT_CONFIGURED" };
  return { called: use };
}
function vidCost(sec, prov) { const s = Math.round(Math.min(15, Math.max(3, sec || 5))); const k = prov === "kling"; return Math.max(k ? 300 : 120, s * (k ? 60 : 24)); }

test("Video: grok→yalnız grok, kling→yalnız kling (fallback yok)", () => {
  assert.equal(routeVideo("grok").called, "grok");
  assert.equal(routeVideo("kling").called, "kling");
});
test("Video: veo → VEO_PROVIDER_NOT_CONFIGURED, higgs → HIGGS_PROVIDER_NOT_CONFIGURED (hiçbir sağlayıcı çağrılmaz)", () => {
  assert.equal(routeVideo("veo").called, null);
  assert.equal(routeVideo("veo").err, "VEO_PROVIDER_NOT_CONFIGURED");
  assert.equal(routeVideo("higgs").called, null);
  assert.equal(routeVideo("higgs").err, "HIGGS_PROVIDER_NOT_CONFIGURED");
  assert.equal(routeVideo("higgsfield").err, "HIGGS_PROVIDER_NOT_CONFIGURED");
});
test("Video: fal yalnız açıkça fal seçilince; boş → env varsayılanı", () => {
  assert.equal(routeVideo("fal").called, "fal");
  assert.equal(routeVideo("").called, "grok");
  assert.equal(routeVideo("", "kling").called, "kling");
});
test("Video maliyeti sağlayıcı+süreye göre (sunucu formülü): grok 5s=120, kling 5s=300, grok 10s=240, kling 10s=600", () => {
  assert.equal(vidCost(5, "grok"), 120);
  assert.equal(vidCost(5, "kling"), 300);
  assert.equal(vidCost(10, "grok"), 240);
  assert.equal(vidCost(10, "kling"), 600);
});

// ── (B1) GERÇEK index.ts DEĞİŞMEZLERİ ───────────────────────────────────────
test("index.ts: generateImage per-istek providerOverride (env'den önce)", () => {
  assert.ok(indexSrc.includes("providerOverride?: string"), "generateImage providerOverride parametresi olmalı");
  assert.ok(indexSrc.includes('(providerOverride || Deno.env.get("TA_IMAGE_PROVIDER") || "openai")'), "override env'den önce gelmeli");
});
test("index.ts: image handler imageProvider eşlemesi + higgs 501", () => {
  const blk = indexSrc.slice(indexSrc.indexOf('String(b.action || "") === "image"'), indexSrc.indexOf("GÖRSEL DÜZENLEME"));
  assert.ok(blk.includes("b.imageProvider"), "imageProvider okunmalı");
  assert.ok(blk.includes("HIGGS_IMAGE_NOT_CONFIGURED"), "higgs 501 hata kodu olmalı");
  assert.ok(blk.includes("generateImage(") && blk.includes("imgProv"), "seçilen sağlayıcı generateImage'a geçmeli");
});
test("index.ts: video otomatik fallback YOK; veo/higgs açık hata", () => {
  const sv = indexSrc.slice(indexSrc.indexOf("async function submitVideo("), indexSrc.indexOf("async function pollVideo("));
  assert.ok(!sv.includes("haveFal") && !sv.includes("haveGrok") && !sv.includes("haveKling"), "fallback anahtar kontrolü kalmamalı");
  assert.ok(sv.includes('if (use === "veo") return { err: "VEO_PROVIDER_NOT_CONFIGURED" };'), "veo açık hata");
  assert.ok(sv.includes('if (use === "higgs") return { err: "HIGGS_PROVIDER_NOT_CONFIGURED" };'), "higgs açık hata");
});
test("index.ts: video maliyeti sunucuda videoCost(vsec, vprovider) ile (istemci fiyatına güvenilmez)", () => {
  assert.ok(indexSrc.includes('videoCost(Number(b.vsec) || 5, String(b.vprovider || ""))'), "video cost sunucuda hesaplanmalı");
});
test("index.ts: kredi reserve/refund/opId/video_jobs korunur", () => {
  assert.ok(indexSrc.includes("reserve_credits") && indexSrc.includes("await doRefund()") && indexSrc.includes('.from("video_jobs")'), "kredi/iş değişmezleri korunmalı");
  assert.ok(indexSrc.includes("CREDIT_SYSTEM_UNAVAILABLE"), "ücretli görselde rezervasyon-yok koruması korunmalı");
});

// ── (B2) GERÇEK Studio.dc.html DEĞİŞMEZLERİ ─────────────────────────────────
test("Studio.dc.html: görsel sağlayıcı durumu + istemci imageProvider gönderimi", () => {
  assert.ok(studioSrc.includes("imgProvider: saved.imgProvider || 'gpt'"), "imgProvider state (vars. gpt) olmalı");
  assert.ok(studioSrc.includes("imageProvider: this.state.imgProvider || 'gpt'"), "istek gövdesinde imageProvider gönderilmeli");
  assert.ok(studioSrc.includes("imgProviders:"), "görsel sağlayıcı seçici listesi olmalı");
  assert.ok(studioSrc.includes("['higgs', 'Higgs', true]"), "higgs pasif (Yakında) olmalı");
});
test("Studio.dc.html: görsel buton metni sağlayıcıya göre + maliyet", () => {
  assert.ok(studioSrc.includes("{ gpt: 'GPT', gemini: 'Gemini' }[s.imgProvider || 'gpt']"), "buton metni sağlayıcıya göre");
  assert.ok(studioSrc.includes("' ile Görsel Üret · 12 KR'"), "buton metni maliyet göstermeli");
});
test("Studio.dc.html: video modalı (sağlayıcı+süre+maliyet), veo/higgs pasif", () => {
  assert.ok(studioSrc.includes("videoModalOpen"), "video modal bayrağı olmalı");
  assert.ok(studioSrc.includes("videoModalProviders"), "modal sağlayıcı listesi olmalı");
  assert.ok(studioSrc.includes("id: 'veo', label: '🎥 Veo', tag: 'Yakında', passive: true"), "veo pasif Yakında");
  assert.ok(studioSrc.includes("id: 'higgs', label: '✨ Higgsfield', tag: 'Yakında', passive: true"), "higgs pasif Yakında");
  assert.ok(studioSrc.includes("videoModalDurations"), "süre seçimi olmalı");
  assert.ok(studioSrc.includes("VID_COST(sec"), "modal maliyet göstermeli");
});
test("Studio.dc.html: Video Üret modalı açar (3 yerde openVideoModal)", () => {
  const n = (studioSrc.match(/openVideoModal\(/g) || []).length;
  assert.ok(n >= 4, "openVideoModal en az 3 kart + 1 tanım kullanmalı (bulundu: " + n + ")");
  assert.ok(studioSrc.includes("submitVideoModal()"), "modal üret dispatcher olmalı");
});
test("Studio.dc.html: video süresi sunucuya vsec olarak gider (sabit 5 değil)", () => {
  assert.ok(!studioSrc.includes("vsec: 5,"), "sabit vsec:5 kalmamalı");
  assert.ok(studioSrc.includes("vsec: Math.round(Math.min(15, Math.max(3, sec || 5)))"), "vsec seçilen süreden gelmeli");
});
