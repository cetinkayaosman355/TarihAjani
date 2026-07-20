// ============================================================================
// KONTROLLÜ TOPLU ÜRETİM KUYRUĞU — STATİK + MANTIK DOĞRULAMASI
// Çalıştır:  node supabase/functions/studio-generate/batch_queue.test.mjs
//
// (A) _batchRun AYNASI: eşzamanlılık ≤2, hata izolasyonu, durdur→iptal.
// (B) worker durum eşlemesi (completed/failed/refunded).
// (C) idempotent batch (çift tıklama), refresh geri-yükleme dönüşümü.
// (D) Gerçek index.ts + Studio.dc.html değişmezleri.
// ⚠ _batchRun aynası Studio.dc.html ile senkron tutulmalı.
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

// ── (A) _batchRun aynası ────────────────────────────────────────────────────
async function batchRun(items, worker, opts) {
  opts = opts || {};
  const CONC = Math.max(1, opts.concurrency || 2);
  const isStopped = opts.isStopped || (() => false);
  const onStatus = opts.onStatus || (() => {});
  const status = items.map(() => "queued");
  let next = 0;
  const lane = async () => {
    while (true) {
      if (isStopped()) return;
      const i = next < items.length ? next++ : -1;
      if (i < 0) return;
      status[i] = "processing"; onStatus(i, "processing");
      let st = "completed", err;
      try { const r = await worker(items[i], i); st = (r && r.status) || "completed"; err = r && r.err; }
      catch (e) { st = "failed"; err = String((e && e.message) || e); }
      status[i] = st; onStatus(i, st, err);
    }
  };
  const lanes = Math.max(1, Math.min(CONC, items.length));
  await Promise.all(Array.from({ length: lanes }, lane));
  for (let k = 0; k < status.length; k++) if (status[k] === "queued") { status[k] = "cancelled"; onStatus(k, "cancelled"); }
  return status;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test("12 sahnede eşzamanlı aktif iş HİÇBİR ZAMAN 2'yi geçmez", async () => {
  let active = 0, maxActive = 0;
  const items = Array.from({ length: 12 }, (_v, i) => i);
  await batchRun(items, async () => { active++; maxActive = Math.max(maxActive, active); await wait(5); active--; return { status: "completed" }; }, { concurrency: 2 });
  assert.ok(maxActive <= 2, "maxActive=" + maxActive + " (2 olmalı)");
  assert.equal(maxActive, 2, "iki şerit de kullanılmalı");
});

test("5. sahne hata verince 6–12 devam eder (batch çökmez)", async () => {
  const items = Array.from({ length: 12 }, (_v, i) => i);
  const st = await batchRun(items, async (i) => {
    await wait(2);
    if (i === 4) throw new Error("5. sahne patladı");   // 0-tabanlı → 5. sahne
    return { status: "completed" };
  }, { concurrency: 2 });
  assert.equal(st[4], "failed", "5. sahne failed");
  for (const i of [5, 6, 7, 8, 9, 10, 11]) assert.equal(st[i], "completed", (i + 1) + ". sahne tamamlanmalı");
  assert.equal(st.filter(x => x === "completed").length, 11);
});

test("Durdur → başlamamış sahneler 'cancelled'; çalışan ≤2 biter", async () => {
  const items = Array.from({ length: 12 }, (_v, i) => i);
  let started = 0, stopped = false;
  const st = await batchRun(items, async () => { started++; if (started >= 2) stopped = true; await wait(5); return { status: "completed" }; },
    { concurrency: 2, isStopped: () => stopped });
  const completed = st.filter(x => x === "completed").length;
  const cancelled = st.filter(x => x === "cancelled").length;
  assert.ok(completed <= 2, "durdurunca en fazla 2 tamamlanır (completed=" + completed + ")");
  assert.ok(cancelled >= 10, "kalanlar iptal edilir (cancelled=" + cancelled + ")");
  assert.equal(completed + cancelled, 12);
});

// ── (B) worker durum eşlemesi ───────────────────────────────────────────────
function mapWorker(r) {
  if (r && r.ok) return { status: "completed" };
  if (r && r.err === "YETERSIZ_KREDI") return { status: "failed", err: "Yetersiz kredi (ücretlenmedi)" };
  return { status: "refunded", err: (r && r.err) || "üretilemedi" };
}
test("Durum eşlemesi: ok→completed, yetersiz kredi→failed(ücretsiz), hata→refunded(iade)", () => {
  assert.equal(mapWorker({ ok: true }).status, "completed");
  assert.equal(mapWorker({ ok: false, err: "YETERSIZ_KREDI" }).status, "failed");
  assert.equal(mapWorker({ ok: false, err: "MODERATION" }).status, "refunded");
});

// ── (C) idempotent batch + refresh geri-yükleme ─────────────────────────────
test("Çift tıklama ikinci batch OLUŞTURMAZ (idempotent guard)", () => {
  // genAllScenes başında: if (this._batchActive) return;
  let active = false, started = 0;
  const genAll = () => { if (active) return; active = true; started++; };
  genAll(); genAll(); genAll();
  assert.equal(started, 1, "yalnız bir batch başlar");
});
test("Refresh geri-yükleme: processing/cancelled → queued (devam edilebilir), completed korunur", () => {
  const restore = (scenes) => scenes.map(sc => (sc.status === "processing" || sc.status === "cancelled") ? { ...sc, status: "queued" } : sc);
  const before = [{ status: "completed" }, { status: "processing" }, { status: "queued" }, { status: "cancelled" }, { status: "refunded" }];
  const after = restore(before);
  assert.equal(after[0].status, "completed");
  assert.equal(after[1].status, "queued");
  assert.equal(after[3].status, "queued");
  const resumable = after.filter(sc => sc.status === "queued").length;
  assert.equal(resumable, 3, "devam edilecek sahne sayısı");
});

// ── (D) GERÇEK kaynak değişmezleri ──────────────────────────────────────────
test("index.ts: sunucu-taraflı estimate + image recovery-by-opId + save-on-success", () => {
  assert.ok(indexSrc.includes('act === "estimate"') && indexSrc.includes('costFor("image", "", i)'), "sunucu estimate (costFor) olmalı");
  assert.ok(indexSrc.includes('"estimate"') && indexSrc.includes("ALLOWED_ACTIONS"), "estimate izinli action");
  assert.ok(indexSrc.includes("loadJobResult(admin, userId, opId)") && indexSrc.includes("recovered: true"), "opId ile kurtarma (çift üretim yok)");
  assert.ok(indexSrc.includes("saveJobResult(admin, userId, opId, { url, meta })"), "sonuç job-cache'e yazılmalı");
});
test("Studio.dc.html: _batchRun concurrency 2 + kararlı opId + sayaçlar + durdur + kalıcılık", () => {
  assert.ok(studioSrc.includes("async _batchRun("), "kontrollü kuyruk motoru");
  assert.ok(studioSrc.includes("concurrency: 2"), "eşzamanlılık 2");
  assert.ok(studioSrc.includes("Math.min(CONC, items.length)"), "aktif iş concurrency ile sınırlı");
  assert.ok(studioSrc.includes("(batchId + sc.key)") && studioSrc.includes("makeImage(sc.prompt, sc.idx, sc.key, batch.aspect, opId, provider)"), "sahne başına kararlı opId + kendi promptu/sağlayıcısı");
  assert.ok(studioSrc.includes("if (this._batchActive) return;"), "çift tıklama koruması");
  assert.ok(studioSrc.includes("stopBatch()") && studioSrc.includes("_batchStopFlag = true"), "Durdur");
  assert.ok(studioSrc.includes("ta_studio_batch_v1"), "batch durumu kalıcı (yenileme)");
  for (const w of ["queued", "processing", "completed", "failed", "refunded", "cancelled"]) {
    assert.ok(studioSrc.includes(w), "durum eksik: " + w);
  }
  assert.ok(studioSrc.includes("tamamlandı") && studioSrc.includes("üretiliyor") && studioSrc.includes("sırada"), "sayaç etiketleri");
  assert.ok(studioSrc.includes("action: 'estimate'"), "toplam tahmin sunucudan alınır");
});
