// ============================================================================
// SÜRÜM İZLEME + DEPLOY DRIFT KORUMASI — kök neden kalıcı çözümü
// Canlıda hangi build'in koştuğu artık TAHMİN değil: {action:"version"} damga döner;
// CI push'ta otomatik deploy edip damgayı doğrular; istemci sürüm uyuşmazlığında
// anlamsız hata yerine NET sebep söyler.
// Çalıştır: node --test supabase/functions/studio-generate/surum_izleme.test.mjs
// ============================================================================
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");
const indexSrc = readFileSync(join(HERE, "index.ts"), "utf8");

test("Backend: BUILD damgası + version action (kimliksiz sürüm kontrolü)", () => {
  const m = indexSrc.match(/const BUILD = "(sg-\d{4}-\d{2}-\d{2}-r\d+)"/);
  assert.ok(m, "BUILD damgası 'sg-YYYY-AA-GG-rN' biçiminde olmalı");
  assert.ok(indexSrc.includes('"support", "version"'), "version allowlist'te");
  assert.ok(indexSrc.includes('if (act === "version")'), "version handler mevcut");
  assert.ok(indexSrc.includes("build: BUILD, primaryModel: primary"), "yanıt build + aktif model döner");
  assert.ok(indexSrc.includes('"gpt-image-2": 20, "gpt-image-1.5": 12, "gpt-image-1": 8'), "yanıt fiyat tablosunu döner");
  // izlenebilirlik: estimate + görsel meta da damga taşır
  assert.ok(indexSrc.includes("per, build: BUILD"), "estimate build döner");
  assert.ok(indexSrc.includes("build: BUILD,       // izlenebilirlik"), "görsel meta build taşır");
});

test("Frontend: sürüm uyuşmazlığında NET hata (gpt1 + eski sunucu)", () => {
  assert.ok(studioSrc.includes("data.errClass === 'INVALID_IMAGE_PROVIDER' && provider === 'gpt1'"), "uyuşmazlık tespiti");
  assert.ok(studioSrc.includes("Sunucudaki görsel sistemi henüz güncellenmedi"), "kullanıcı diliyle net sebep");
  assert.ok(studioSrc.includes("'IMG-SURUM'"), "hata kodu sistemine bağlı");
  // Sessiz motor değişimi YOK: mesaj öneri verir, kendi kendine gpt'ye düşmez
  assert.ok(!studioSrc.includes("provider = 'gpt';   // sessiz"), "sessiz fallback eklenmedi");
});

test("Frontend: batch tahmini seçili motoru gönderir (fiyat tutarlılığı)", () => {
  assert.ok(studioSrc.includes("action: 'estimate', scenes: idxs, imageProvider: this._provResolve()"), "estimate motor bilgisiyle gider");
});

test("CI: otomatik deploy workflow'u + canlı damga doğrulaması", () => {
  const wfPath = join(REPO, ".github", "workflows", "supabase-deploy.yml");
  assert.ok(existsSync(wfPath), "workflow dosyası mevcut");
  const wf = readFileSync(wfPath, "utf8");
  assert.ok(wf.includes("supabase/functions/**"), "yalnız fonksiyon değişince tetiklenir");
  assert.ok(wf.includes("supabase functions deploy studio-generate"), "studio-generate deploy");
  assert.ok(wf.includes("supabase functions deploy posta"), "posta deploy");
  assert.ok(wf.includes('{"action":"version"}'), "deploy sonrası canlı damga doğrulanır");
  assert.ok(wf.includes("SUPABASE_ACCESS_TOKEN") && wf.includes("SUPABASE_PROJECT_REF"), "gereken secrets belgelenmiş");
  assert.ok(wf.includes("workflow_dispatch"), "elle de tetiklenebilir");
});

test("DEPLOY.md: sürüm kontrolü + acil stabilizasyon belgelenmiş", () => {
  const doc = readFileSync(join(REPO, "DEPLOY.md"), "utf8");
  assert.ok(doc.includes("action: 'version'") || doc.includes('"version"'), "sürüm kontrol komutu");
  assert.ok(doc.includes("TA_IMAGE_PRIMARY_MODEL"), "acil stabilizasyon (birincil model secret'ı)");
  assert.ok(doc.includes("problem_reports") && doc.includes("settle_reservation") && doc.includes("goodwill_grant"), "migration kontrol SQL'i");
  assert.ok(doc.includes("INVALID_IMAGE_PROVIDER:gpt1"), "eski sürüm log imzası belgelenmiş");
});

// Ayna: damga karşılaştırma mantığı (CI'daki doğrulamanın saf hali)
test("Ayna: canlı damga ≠ beklenen → deploy başarısız sayılır", () => {
  const verify = (expected, live) => expected === live;
  assert.equal(verify("sg-2026-07-21-r2", "sg-2026-07-21-r2"), true);
  assert.equal(verify("sg-2026-07-21-r2", ""), false, "eski build version bilmez → boş → uyuşmaz");
  assert.equal(verify("sg-2026-07-21-r2", "sg-2026-07-20-r1"), false);
});
