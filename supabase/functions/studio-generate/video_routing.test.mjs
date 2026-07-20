// ============================================================================
// STABİLİZASYON Faz 5 — VIDEO SAĞLAYICI YÖNLENDİRME STATİK DOĞRULAMASI
// Çalıştır:  node supabase/functions/studio-generate/video_routing.test.mjs
//
// İKİ şey doğrulanır:
//   (A) submitVideo yönlendirme KARARI — index.ts'teki dispatch'in AYNASI. Otomatik
//       fal fallback KALDIRILDIĞI için karar deterministiktir: seçilen sağlayıcı ne ise
//       YALNIZ o çağrılır; "veo" → VEO_PROVIDER_NOT_CONFIGURED (fal'a düşmez).
//       ⚠ index.ts değişirse bu ayna da güncellenmeli.
//   (B) GERÇEK index.ts'te Faz 5 değişmezleri (fallback yok, veo eşlemesi yok, hata kodu).
//
// Deno kurulu olmadığından mantık aynası + kaynak taraması yöntemi (Faz 3/4 ile aynı).
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const indexSrc = readFileSync(join(HERE, "index.ts"), "utf8");

// ── (A) submitVideo dispatch AYNASI (fallback YOK) ──────────────────────────
function pickProvider(p, envDefault = "grok") {
  const v = String(p || "").toLowerCase();
  return (v === "kling" || v === "grok" || v === "fal" || v === "veo") ? v : envDefault;
}
// Dönüş: { called: <çağrılan sağlayıcı ya da null>, id?, err? }
function routeVideo(provider, envDefault = "grok") {
  const use = pickProvider(provider, envDefault);
  if (use === "veo") return { called: null, err: "VEO_PROVIDER_NOT_CONFIGURED" };
  if (use === "fal") return { called: "fal", id: "fal:X" };
  if (use === "kling") return { called: "kling", id: "kling:X" };
  return { called: "grok", id: "grok:X" };
}

test("Kling seçilirse YALNIZ Kling çağrılır (fal/grok'a düşmez)", () => {
  const r = routeVideo("kling");
  assert.equal(r.called, "kling");
  assert.equal(r.id, "kling:X");
});

test("Grok seçilirse YALNIZ Grok çağrılır", () => {
  const r = routeVideo("grok");
  assert.equal(r.called, "grok");
  assert.equal(r.id, "grok:X");
});

test("Veo seçilirse HİÇBİR sağlayıcı çağrılmaz → VEO_PROVIDER_NOT_CONFIGURED (fal'a düşmez)", () => {
  const r = routeVideo("veo");
  assert.equal(r.called, null);
  assert.equal(r.err, "VEO_PROVIDER_NOT_CONFIGURED");
  assert.ok(!r.id);
});

test("Fal YALNIZ kullanıcı açıkça Fal seçince çağrılır", () => {
  assert.equal(routeVideo("fal").called, "fal");
  // hiçbir başka seçim fal'ı tetiklemez
  assert.notEqual(routeVideo("kling").called, "fal");
  assert.notEqual(routeVideo("grok").called, "fal");
  assert.equal(routeVideo("veo").called, null);
});

test("Boş/geçersiz seçim → env varsayılanı (fallback DEĞİL, yalnız varsayılan sağlayıcı)", () => {
  assert.equal(routeVideo("").called, "grok");          // varsayılan grok
  assert.equal(routeVideo("banana").called, "grok");    // geçersiz → varsayılan
  assert.equal(routeVideo("", "kling").called, "kling"); // env=kling ise kling
  assert.equal(routeVideo("veo", "kling").err, "VEO_PROVIDER_NOT_CONFIGURED"); // açık veo yine hata
});

test("Anahtar eksikliği BAŞKA sağlayıcıyı tetiklemez (tek çağrı, fallback yok)", () => {
  // Gerçekte anahtar eksikse submitKling/submitGrok/submitFal 'err' döndürür;
  // dispatch YİNE yalnız o sağlayıcıyı çağırır — burada tek 'called' değeri bunu kanıtlar.
  for (const p of ["kling", "grok", "fal"]) {
    const r = routeVideo(p);
    assert.equal(r.called, p, p + " seçiminde yalnız " + p + " çağrılmalı");
  }
});

// ── (B) GERÇEK index.ts DEĞİŞMEZLERİ ────────────────────────────────────────
test("index.ts: otomatik fal fallback KALDIRILDI", () => {
  assert.ok(!indexSrc.includes("const haveFal = !!falKey();"), "haveFal fallback değişkeni kalmamalı");
  assert.ok(!indexSrc.includes('use = haveFal ? "fal"'), "anahtar-eksik → fal otomatik geçişi kalmamalı");
  assert.ok(!indexSrc.includes('use === "grok" && !haveGrok'), "grok→fallback satırı kalmamalı");
  assert.ok(!indexSrc.includes('use === "kling" && !haveKling'), "kling→fallback satırı kalmamalı");
});

test("index.ts: pickProvider 'veo'yu artık fal'a EŞLEMİYOR", () => {
  assert.ok(!indexSrc.includes('v === "veo" ? "fal"'), "veo→fal eşlemesi kalmamalı");
  // pickProvider veo'yu olduğu gibi döndürmeli (higgs eklendi; higgsfield→higgs normalize)
  assert.ok(indexSrc.includes('v === "veo"') && indexSrc.includes("videoProvider()") && indexSrc.includes('v === "higgsfield" ? "higgs"'),
    "pickProvider veo'yu literal döndürmeli (higgs normalize dahil)");
});

test("index.ts: submitVideo veo → VEO_PROVIDER_NOT_CONFIGURED döndürür", () => {
  const sv = indexSrc.slice(indexSrc.indexOf("async function submitVideo("), indexSrc.indexOf("async function pollVideo("));
  assert.ok(sv.includes('if (use === "veo") return { err: "VEO_PROVIDER_NOT_CONFIGURED" };'), "veo açık hata dönmeli");
  assert.ok(!sv.includes("haveFal") && !sv.includes("haveGrok") && !sv.includes("haveKling"), "submitVideo'da fallback anahtar kontrolü kalmamalı");
  assert.ok(sv.includes('submitFal(') && sv.includes('submitKling(') && sv.includes('submitGrok('), "seçilen sağlayıcı doğrudan çağrılmalı");
});

test("index.ts: Grok (xAI) entegrasyonu resmî endpoint/model + GROK_KEY_MISSING", () => {
  const sg = indexSrc.slice(indexSrc.indexOf("async function submitGrok("), indexSrc.indexOf("async function pollGrok("));
  assert.ok(sg.includes('if (!key) return { err: "GROK_KEY_MISSING" };'), "XAI_API_KEY yoksa GROK_KEY_MISSING dönmeli");
  assert.ok(sg.includes('"https://api.x.ai/v1/videos/generations"'), "resmî POST endpoint'i olmalı");
  assert.ok(sg.includes('Deno.env.get("XAI_VIDEO_MODEL") || "grok-imagine-video"'), "model varsayılanı grok-imagine-video olmalı");
  assert.ok(!sg.includes("grok-imagine-video-1.5"), "eski 1.5 model sabiti kalmamalı (secret ile override edilebilir)");
  assert.ok(sg.includes("d.request_id"), "request_id okunmalı");
  assert.ok(!sg.includes('"fal"') && !sg.includes("submitFal"), "submitGrok içinde Fal'a geçiş olmamalı");
});

test("index.ts: pollGrok resmî GET /v1/videos/{request_id} + video.url + expire", () => {
  const pg = indexSrc.slice(indexSrc.indexOf("async function pollGrok("), indexSrc.indexOf("// ── fal.ai"));
  assert.ok(pg.includes('"https://api.x.ai/v1/videos/" + encodeURIComponent(id)'), "resmî poll GET endpoint'i olmalı");
  assert.ok(pg.includes("d.video?.url"), "done → video.url okunmalı (resmî yanıt)");
  assert.ok(pg.includes('status.includes("expire")'), "expired durumu başarısız sayılmalı");
});

test("index.ts: kredi/iş takibi değişmezleri korunur (reserve/refund/video_jobs/opId)", () => {
  assert.ok(indexSrc.includes('reserve_credits'), "kredi rezervasyonu korunmalı");
  assert.ok(indexSrc.includes('await doRefund()'), "başarısızlıkta iade korunmalı");
  assert.ok(indexSrc.includes('.from("video_jobs")'), "video_jobs kaydı korunmalı");
  assert.ok(indexSrc.includes('const vjId = crypto.randomUUID();'), "video iş kimliği (opId) korunmalı");
});
