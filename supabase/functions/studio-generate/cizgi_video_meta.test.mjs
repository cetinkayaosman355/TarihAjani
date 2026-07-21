// ============================================================================
// ÇİZGİ FİLM stili + VİDEO meta rozeti (sağlayıcı bilgisi)
// - Yeni "cizgi" (2D cartoon) stili frontend + backend'de uçtan uca tanımlı
// - Video kartı hangi sağlayıcıyla (Kling/Grok) üretildiğini gösterir
// Çalıştır: node --test supabase/functions/studio-generate/cizgi_video_meta.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const studio = readFileSync(join(REPO, "Studio.dc.html"), "utf8");
const index = readFileSync(join(HERE, "index.ts"), "utf8");

test("Çizgi Film stili backend'de tanımlı (2D cartoon prompt + etiket)", () => {
  assert.ok(index.includes('cizgi: "classic 2D hand-drawn cartoon'), "backend STYLE_TEMPLATES cizgi");
  assert.ok(index.includes('cizgi: "Çizgi Film"'), "backend STYLE_LABELS cizgi");
});

test("Çizgi Film stili frontend'de uçtan uca (liste + anahtar + kategori + prompt)", () => {
  assert.ok(studio.includes("id: 'cizgi', name: 'Çizgi Film'"), "stil listesinde cizgi");
  assert.ok(studio.includes("'animasyon', 'cizgi'"), "STYLE_KEYS içinde cizgi");
  assert.ok(studio.includes("sanatsal: ['gravur', 'minyatur', 'animasyon', 'cizgi']"), "sanatsal kategoride cizgi");
  assert.ok(studio.includes("cizgi: 'classic 2D hand-drawn cartoon"), "frontend prompt fragmanı cizgi");
  // "seçilen = gerçek çıktı": etiket haritalarında cizgi olmalı (kart yanlış etiket göstermesin)
  assert.ok(studio.includes("animasyon: 'Animasyon', cizgi: 'Çizgi Film' }"), "etiket haritasında cizgi");
});

test("Video meta rozeti: sağlayıcı·süre·ses kartta gösterilir", () => {
  assert.ok(studio.includes("_vidMetaLabel(meta)"), "video meta etiket yardımcısı var");
  assert.ok(studio.includes("kling: 'Kling', grok: 'Grok'"), "sağlayıcı adları eşlenir");
  assert.ok(studio.includes("vidProv: prov, vidSec: vsec, vidAudio"), "sahne videosunda meta saklanır");
  assert.ok(studio.includes("vidMeta: { prov:") || studio.includes("vidMeta: vmeta"), "kalıcı kayıtta video meta");
  assert.ok(studio.includes("vidMetaLabel:"), "sahne kartı meta etiketi render eder");
});
