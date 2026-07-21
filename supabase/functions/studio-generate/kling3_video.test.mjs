// ============================================================================
// KLING 3.0 VİDEO — yeni API sözleşmesi kilitlenir (endpoint + kimlik + poll)
// Kling 3.0 tek Bearer API anahtarı (KLING_API_KEY) kullanır; eski hesaplar JWT
// (ACCESS+SECRET). Bu test, koddaki uç noktaların Kling 3.0 dokümanıyla birebir
// aynı kalmasını garanti eder — daha önce eski JWT API'sine "kaymıştık".
// Çalıştır: node --test supabase/functions/studio-generate/kling3_video.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, "index.ts"), "utf8");

test("klingAuth: KLING_API_KEY varsa v3 (doğrudan Bearer), yoksa JWT'ye düşer", () => {
  const i = src.indexOf("async function klingAuth");
  assert.ok(i > 0, "klingAuth bulunur");
  const blk = src.slice(i, i + 400);
  assert.ok(blk.includes('Deno.env.get("KLING_API_KEY")'), "yeni tek anahtar okunur");
  assert.ok(blk.includes("v3: true"), "API anahtarı varsa v3 modu");
  assert.ok(blk.includes("klingToken()"), "anahtar yoksa eski JWT üretimine düşer");
});

test("submitKling v3: POST /image-to-video/kling-3.0 + contents(first_frame) + Bearer", () => {
  const i = src.indexOf("async function submitKling");
  const blk = src.slice(i, i + 2000);
  assert.ok(blk.includes('"/image-to-video/" + model'), "yeni image-to-video yolu");
  assert.ok(blk.includes('"kling-3.0"'), "varsayılan model kling-3.0");
  assert.ok(blk.includes('type: "first_frame"'), "ilk kare görseli contents içinde gönderilir");
  assert.ok(blk.includes('type: "prompt"'), "prompt contents içinde gönderilir");
  assert.ok(blk.includes("Bearer ${auth.token}"), "Bearer kimlik");
  assert.ok(blk.includes("multi_shot: false") && blk.includes('audioOn ? "on" : "off"'), "settings alanları (ses moduna göre audio on/off)");
});

test("SES modu: silent/ambient/speech yönergeleri + Kling audio on/off", () => {
  assert.ok(src.includes('type AudioMode = "silent" | "ambient" | "speech"'), "AudioMode türü");
  const di = src.indexOf("function audioDirective");
  const dblk = src.slice(di, di + 400);
  assert.ok(dblk.includes("No speech") && dblk.includes("No music"), "silent yönergesi konuşma+müzik yasağı");
  assert.ok(dblk.includes("Ambient") && dblk.includes("no music"), "ambient yönergesi müzik yok");
  // submitVideo: Grok/Fal prompt'a yönerge ekler; Kling audio ayarını kendi içinde yapar
  const sv = src.slice(src.indexOf("async function submitVideo"), src.indexOf("async function submitVideo") + 1400);
  assert.ok(sv.includes("audioDirective(am)"), "prompt'a ses yönergesi eklenir (Grok/Fal)");
  assert.ok(sv.includes("submitKling(prompt, imageUrl, dur, aspect, am)"), "Kling'e ses modu geçirilir");
});

test("submitKling: eski JWT yolu geriye uyum için korunur (image2video)", () => {
  const i = src.indexOf("async function submitKling");
  const blk = src.slice(i, i + 2600);
  assert.ok(blk.includes("/v1/videos/image2video"), "legacy JWT endpoint korunur");
  assert.ok(blk.includes("model_name"), "legacy model_name parametresi");
});

test("pollKling v3: GET /tasks?task_ids= → outputs[type==video].url, status succeeded/failed", () => {
  const i = src.indexOf("async function pollKling");
  const blk = src.slice(i, i + 1400);
  assert.ok(blk.includes('"/tasks?task_ids=" + encodeURIComponent(id)'), "yeni görev sorgu yolu");
  assert.ok(blk.includes('o.type === "video"'), "video çıktısı outputs içinden seçilir");
  assert.ok(blk.includes('status === "succeeded"'), "başarılı durum kontrolü");
  assert.ok(blk.includes('status === "failed"'), "başarısız durum kontrolü");
});

test("version: kling anahtarı yeni KLING_API_KEY'i de sayar + klingMode raporlar", () => {
  const i = src.indexOf('act === "version"');
  const blk = src.slice(i, i + 1300);
  assert.ok(blk.includes('has("KLING_API_KEY")'), "yeni anahtar teşhiste görünür");
  assert.ok(blk.includes("klingMode"), "kimlik modu (v3/legacy/none) raporlanır");
});
