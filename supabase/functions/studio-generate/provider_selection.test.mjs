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
// Allowlist: gpt→openai, gemini→gemini. BOŞ → env varsayılanı (eski istemci).
// DOLU ama listede yok → REDDET (sessiz fallback yok). higgs → 501 (yakında).
function mapImageProvider(ipRaw) {
  const v = String(ipRaw || "").trim().toLowerCase();
  if (v === "gpt" || v === "openai") return { imgProv: "openai" };
  if (v === "gemini") return { imgProv: "gemini" };
  if (v === "higgs" || v === "higgsfield") return { err: "HIGGS_IMAGE_NOT_CONFIGURED", status: 501 };
  if (v !== "") return { err: "INVALID_IMAGE_PROVIDER", status: 400 };
  return { imgProv: "" }; // boş → env varsayılanı (yalnız eski istemci)
}
// generateImage sağlayıcı dalı aynası: hangi API çağrılır?
function resolveGenProvider(providerOverride, envDefault = "openai") {
  return (providerOverride || envDefault || "openai").trim().toLowerCase();
}
function apiForProvider(prov) {
  return prov === "gemini" ? "generativelanguage.googleapis.com" : "api.openai.com";
}

test("GPT seçimi → OpenAI çağrılır, Gemini ÇAĞRILMAZ", () => {
  const m = mapImageProvider("gpt");
  assert.equal(m.imgProv, "openai");
  const api = apiForProvider(resolveGenProvider(m.imgProv, "gemini")); // env gemini olsa bile
  assert.equal(api, "api.openai.com");
  assert.notEqual(api, "generativelanguage.googleapis.com");
});
test("Gemini seçimi → Gemini çağrılır, OpenAI ÇAĞRILMAZ", () => {
  const m = mapImageProvider("gemini");
  assert.equal(m.imgProv, "gemini");
  const api = apiForProvider(resolveGenProvider(m.imgProv, "openai")); // env openai olsa bile
  assert.equal(api, "generativelanguage.googleapis.com");
  assert.notEqual(api, "api.openai.com");
});
test("Geçersiz provider REDDEDİLİR (400, sessiz fallback yok)", () => {
  const r = mapImageProvider("banana");
  assert.equal(r.err, "INVALID_IMAGE_PROVIDER");
  assert.equal(r.status, 400);
  assert.ok(!("imgProv" in r), "geçersizde imgProv atanmamalı (default'a düşmemeli)");
});
test("Görsel: higgs → 501 HIGGS_IMAGE_NOT_CONFIGURED (üretim/kredi yok, fallback yok)", () => {
  const r = mapImageProvider("higgs");
  assert.equal(r.err, "HIGGS_IMAGE_NOT_CONFIGURED");
  assert.equal(r.status, 501);
});
test("Görsel: BOŞ (eski istemci) → env varsayılanı (global secret yalnız burada geçerli)", () => {
  assert.equal(mapImageProvider("").imgProv, "");
  assert.equal(resolveGenProvider(mapImageProvider("").imgProv, "gemini"), "gemini"); // env=gemini → gemini
  assert.equal(resolveGenProvider(mapImageProvider("").imgProv, "openai"), "openai"); // env=openai → openai
});

// ── OpenAI boyut güvenliği: yalnız desteklenen boyutlar ─────────────────────
const OPENAI_SUPPORTED = new Set(["1024x1536", "1536x1024", "1024x1024"]);
function openaiSize(size) { return size === "9:16" ? "1024x1536" : size === "16:9" ? "1536x1024" : "1024x1024"; }
test("OpenAI: yalnız desteklenen boyutlar; 9:16 → 1024x1536; HD/2048 API'ye gitmez", () => {
  for (const s of ["9:16", "16:9", "kare", "1:1", ""]) assert.ok(OPENAI_SUPPORTED.has(openaiSize(s)));
  assert.equal(openaiSize("9:16"), "1024x1536");
  // desteklenmeyen HD boyutları asla üretilmez
  for (const bad of ["1536x2048", "2048x1536", "2048x2048"]) assert.ok(!OPENAI_SUPPORTED.has(bad));
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
test("index.ts: image handler imageProvider allowlist + higgs 501 + geçersiz 400", () => {
  const blk = indexSrc.slice(indexSrc.indexOf('String(b.action || "") === "image"'), indexSrc.indexOf("GÖRSEL DÜZENLEME"));
  assert.ok(blk.includes("b.imageProvider"), "imageProvider okunmalı");
  assert.ok(blk.includes("HIGGS_IMAGE_NOT_CONFIGURED"), "higgs 501 hata kodu olmalı");
  assert.ok(blk.includes("INVALID_IMAGE_PROVIDER") && blk.includes('ipRaw !== ""'), "allowlist dışı DOLU değer 400 ile reddedilmeli");
  assert.ok(blk.includes("generateImage(") && blk.includes("imgProv"), "seçilen sağlayıcı generateImage'a geçmeli");
});
test("index.ts: OpenAI desteklenmeyen HD boyutları KALDIRILDI (yalnız standart, quality high)", () => {
  const gi = indexSrc.slice(indexSrc.indexOf("async function generateImage("), indexSrc.indexOf("async function generateSpeech("));
  for (const bad of ["1536x2048", "2048x1536", "2048x2048"]) assert.ok(!gi.includes(bad), "HD boyutu kalmamalı: " + bad);
  assert.ok(!gi.includes("const gHd") && !gi.includes("TA_IMAGE_HD"), "HD boyut mantığı kalmamalı");
  assert.ok(gi.includes('const gStd = size === "9:16" ? "1024x1536" : size === "16:9" ? "1536x1024" : "1024x1024";'), "yalnız desteklenen standart boyutlar");
  assert.ok(gi.includes("const gSize = gStd;"), "API'ye yalnız standart boyut gitmeli");
  assert.ok(gi.includes('quality: "high"'), "quality=high korunmalı");
});
test("index.ts: dikey 9:16 güvenli-kompozisyon talimatı YALNIZ dikeyde", () => {
  const gi = indexSrc.slice(indexSrc.indexOf("async function generateImage("), indexSrc.indexOf("async function generateSpeech("));
  assert.ok(gi.includes('size === "9:16"') && gi.includes("central safe area") && gi.includes("no critical subjects near top/bottom crop zones"), "dikey güvenli-kadraj talimatı olmalı");
  assert.ok(gi.includes("VERTICAL_SAFE"), "talimat yalnız 9:16'da eklenmeli (koşullu)");
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
  assert.ok(studioSrc.includes("imageProvider: provider || this.state.imgProvider || 'gpt'"), "istek gövdesinde imageProvider gönderilmeli (batch'te sabit sağlayıcı)");
  assert.ok(studioSrc.includes("imgProviders:"), "görsel sağlayıcı seçici listesi olmalı");
  assert.ok(studioSrc.includes("['higgs', 'Higgs', true]"), "higgs pasif (Yakında) olmalı");
});
test("Studio.dc.html: görsel buton metni sağlayıcıya göre (vitrin model adı) + maliyet", () => {
  // Dinamik: GPT → 'GPT Image 2', Gemini → 'Gemini Flash Image', Higgs → 'Higgs'
  assert.ok(studioSrc.includes("_provModelLabel(s.imgProvider)"), "buton metni sağlayıcı vitrin modeline göre");
  assert.ok(studioSrc.includes("gpt: 'GPT Image 2'"), "GPT → GPT Image 2");
  assert.ok(studioSrc.includes("gemini: 'Gemini Flash Image'") && studioSrc.includes("higgs: 'Higgs'"), "Gemini/Higgs vitrin adları");
  assert.ok(studioSrc.includes("' ile Üret · 12 KR'"), "buton metni maliyet göstermeli (fiyat DEĞİŞMEDİ)");
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
