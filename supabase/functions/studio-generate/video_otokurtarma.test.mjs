// ============================================================================
// VİDEO OTOMATİK KURTARMA — açılışta sunucudaki videoları sessizce geri getir
// Yerel IndexedDB silinse de (mobil eviction / önbellek / PWA / başka cihaz)
// Videolarım kendi kendine dolar. Kaynak: video_jobs (result_path, kalıcı).
// Çalıştır: node --test supabase/functions/studio-generate/video_otokurtarma.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");
const index = readFileSync(join(HERE, "index.ts"), "utf8");

test("Açılışta otomatik çağrılır (loadServerImages ile birlikte)", () => {
  assert.ok(src.includes("this._autoRestoreVideos()"), "oturum açılışında tetiklenir");
  assert.ok(src.includes("async _autoRestoreVideos()"), "yöntem tanımlı");
});

test("Sessiz + oturum başına bir kez + hata halinde tekrar denenebilir", () => {
  const i = src.indexOf("async _autoRestoreVideos()");
  const seg = src.slice(i, i + 1200);
  assert.ok(seg.includes("if (this._vidRestored) return"), "bir kez çalışır");
  assert.ok(seg.includes("action: 'video_list'"), "sunucudan çeker");
  assert.ok(!seg.includes("vidImportMsg"), "sessiz: kullanıcıya banner göstermez");
  assert.ok(seg.includes("this._vidRestored = false"), "ağ/oturum hatasında tekrar denenir");
});

test("Sunucu kaynağı kalıcı: video_jobs.result_path (Storage'a yüklenmiş)", () => {
  assert.ok(index.includes('act === "video_list"'), "video_list action");
  assert.ok(index.includes('.eq("status", "completed")') && index.includes("result_path"), "tamamlanan işlerin kalıcı yolu");
  assert.ok(index.includes("uploadVideo("), "sağlayıcı videosu Storage'a indirilip yüklenir (kalıcı)");
});

test("Elle 'Videolarımı Getir' butonu da korunur (çift güvence)", () => {
  assert.ok(src.includes("importVideos:") && src.includes("Videolarımı Getir"), "manuel kurtarma butonu durur");
});
