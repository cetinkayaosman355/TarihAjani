// ============================================================================
// GÖRSEL KALİTE PARİTESİ (ChatGPT'ye yaklaştırma) — STATİK DOĞRULAMA
// Çalıştır:  node supabase/functions/studio-generate/image_quality.test.mjs
//
// Amaç: aynı promptla Studio çıktısını ChatGPT kalitesine yaklaştırmak.
// Doğrulananlar: OpenAI çıktısı VARSAYILAN kayıpsız PNG; gereksiz JPEG sıkıştırma
// yok; sonradan küçültme/yeniden-encode yok; indirmede kayıpsız (kırpma yoksa
// orijinal, kırpma varsa PNG). quality=high korunur.
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

// ── SUNUCU: OpenAI çıktı biçimi ─────────────────────────────────────────────
test("index.ts: OpenAI çıktısı VARSAYILAN kayıpsız PNG (TA_IMAGE_FORMAT ile override)", () => {
  assert.ok(indexSrc.includes('(Deno.env.get("TA_IMAGE_FORMAT") || "png")'), "varsayılan png olmalı");
  assert.ok(indexSrc.includes("output_format: fmt"), "output_format değişkenden gelmeli");
  assert.ok(indexSrc.includes('const fmtMime = fmt === "jpeg" ? "image/jpeg" : "image/png";'), "data URI mime biçimle eşleşmeli");
  assert.ok(indexSrc.includes('"data:" + fmtMime + ";base64," + b64'), "b64 ham aynen, mime dinamik dönmeli");
});
test("index.ts: JPEG sıkıştırma yalnız jpeg override'ında; png'de yok", () => {
  assert.ok(indexSrc.includes('if (fmt === "jpeg") reqBody.output_compression = 100;'), "compression yalnız jpeg'de");
  assert.ok(!indexSrc.includes('output_format: "jpeg",'), "sabit jpeg çıktısı kalmamalı");
});
test("index.ts: quality=high korunur", () => {
  assert.ok(indexSrc.includes('quality: "high"'), "quality high korunmalı");
});
test("index.ts: sunucuda sonradan küçültme/yeniden-encode yok (crop pasif + kayıpsız)", () => {
  // cropToAspect artık kayıpsız PNG encode eder (ve loadImage null → zaten pasif)
  assert.ok(!indexSrc.includes("encodeJPEG(90)"), "JPEG 90 ikinci encode kalmamalı");
  assert.ok(indexSrc.includes("await out.encode();"), "kırpma gerekirse kayıpsız PNG encode");
  // uploadImage baytları olduğu gibi yükler (resize yok)
  const up = indexSrc.slice(indexSrc.indexOf("async function uploadImage("), indexSrc.indexOf("async function uploadImage(") + 900);
  assert.ok(!/resize|scale|width|height/i.test(up), "uploadImage yeniden boyutlandırmamalı");
});

// ── İSTEMCİ: indirme zinciri ────────────────────────────────────────────────
test("Studio.dc.html: indirmede gereksiz yeniden-encode YOK (oran uyuyorsa orijinal)", () => {
  const cb = studioSrc.slice(studioSrc.indexOf("_cropAspectBlob(srcUrl, arKey)"), studioSrc.indexOf("async dlImage("));
  assert.ok(cb.includes("Math.abs(srcAr - target) < 0.02) return resolve(null)"), "oran zaten uyuyorsa null → orijinal indirilir");
  assert.ok(cb.includes("'image/png'") && !cb.includes("'image/jpeg', 0.96"), "kırpma gerekince kayıpsız PNG (jpeg 0.96 kalkmalı)");
});
test("Studio.dc.html: dlImage kırpma yoksa orijinali indirir + doğru uzantı", () => {
  const start = studioSrc.indexOf("async dlImage(");
  const dl = studioSrc.slice(start, studioSrc.indexOf("thumbBox(ar)", start));
  assert.ok(dl.includes("guessExt"), "biçime göre uzantı belirlenmeli");
  assert.ok(dl.includes("kırpma yok → ORİJİNALİ kayıpsız indir"), "kırpma yoksa orijinal indirilmeli");
  assert.ok(!dl.includes("+ '.jpg';"), "sabit .jpg uzantısı kalmamalı");
});

// ── Mantık kontrolü: hangi durumda yeniden-encode olur? ─────────────────────
function willReencodeOnDownload(srcAr, target) {
  // _cropAspectBlob aynası: |srcAr-target|<0.02 → null (encode yok); değilse PNG encode
  return Math.abs(srcAr - target) >= 0.02;
}
test("Kare kaynak (1:1) 1:1 hedef → indirmede encode YOK", () => {
  assert.equal(willReencodeOnDownload(1.0, 1.0), false);
});
test("2:3 kaynak (OpenAI 1024x1536) 9:16 hedef → kırpma gerekir → kayıpsız PNG encode", () => {
  // srcAr=2/3≈0.667, target 9/16=0.5625 → fark 0.10 > 0.02 → PNG kırpma
  assert.equal(willReencodeOnDownload(2 / 3, 9 / 16), true);
});
test("Zaten 9:16 kaynak 9:16 hedef → encode YOK (orijinal indirilir)", () => {
  assert.equal(willReencodeOnDownload(9 / 16, 9 / 16), false);
});
