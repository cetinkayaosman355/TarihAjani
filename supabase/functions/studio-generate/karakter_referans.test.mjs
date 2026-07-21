// ============================================================================
// KARAKTER TUTARLILIĞI — referans görsel (character consistency)
// Metin tabanlı "karakter İncil'i" yüzü sabitleyemez → gerçek tutarlılık için
// referans görsel: ilk sahne (ya da yüklenen) sonraki sahnelere baz olur.
// Backend: Gemini girdi part'ı + OpenAI /images/edits. refImage yoksa davranış aynı.
// Çalıştır: node --test supabase/functions/studio-generate/karakter_referans.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const index = readFileSync(join(HERE, "index.ts"), "utf8");
const studio = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("Backend: güvenli referans yükleme (SSRF — data URI veya kendi Storage)", () => {
  assert.ok(index.includes("async function loadRefBytes"), "loadRefBytes yardımcısı");
  assert.ok(index.includes("/storage/v1/object/"), "yalnız kendi Storage'a izin (SSRF)");
  assert.ok(index.includes("generateImage") && index.includes("refImage?: string"), "generateImage refImage parametresi");
});

test("Backend: Gemini referans girdi part'ı + OpenAI edits yolu", () => {
  assert.ok(index.includes("gParts.push({ inlineData:"), "Gemini referans inlineData girdisi");
  assert.ok(index.includes("await editImage(refImage, p, size)"), "OpenAI referansla /images/edits");
  assert.ok(index.includes("REF_CONSISTENCY"), "tutarlılık yönergesi prompt'a eklenir");
  // refImage yoksa: davranış aynı (pBase kullanılır)
  assert.ok(index.includes("const p = refBytes ? (pBase + REF_CONSISTENCY) : pBase"), "referans yoksa prompt değişmez");
});

test("Backend: image action refImage'ı iletir", () => {
  assert.ok(index.includes('modelForce, String(b.refImage || ""))'), "image action refImage geçirir");
});

test("Frontend: Karakter tutarlılığı toggle + referans (ilk sahne/otomatik + yükleme)", () => {
  assert.ok(studio.includes("_charRef(sceneKey)"), "referans URL seçici");
  assert.ok(studio.includes("🔗 Karakter tutarlılığı"), "UI toggle");
  assert.ok(studio.includes("_charRefUpload"), "referans yükleme (küçültme)");
  assert.ok(studio.includes("const rf = this._charRef(sceneKey); return rf ? { refImage: rf } : {}"), "istek gövdesine refImage");
  // referans sahnenin kendisi kendini referans almaz
  assert.ok(studio.includes("sceneKey === refKey) return ''"), "referans sahne kendini baz almaz");
});
