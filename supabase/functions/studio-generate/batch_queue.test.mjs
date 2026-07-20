// ============================================================================
// KONTROLLÜ TOPLU ÜRETİM KUYRUĞU — STATİK + MANTIK DOĞRULAMASI
// Çalıştır:  node supabase/functions/studio-generate/batch_queue.test.mjs
//
// (A) _batchRun AYNASI: eşzamanlılık ≤2, hata izolasyonu, DURAKLAT vs İPTAL.
// (B) worker durum eşlemesi (completed/failed/refunded).
// (C) idempotent batch (çift tıklama), refresh geri-yükleme dönüşümü.
// (D) Gerçek index.ts + Studio.dc.html değişmezleri (queue UX katmanı dahil).
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
// isStopped() → false | 'pause' | 'cancel'. 'pause': kalan 'queued' KORUNUR
// (devam edilebilir). 'cancel'/doğal bitiş: kalan 'queued' → 'cancelled'.
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
  if (isStopped() !== "pause") {
    for (let k = 0; k < status.length; k++) if (status[k] === "queued") { status[k] = "cancelled"; onStatus(k, "cancelled"); }
  }
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

test("İPTAL → başlamamış sahneler 'cancelled'; çalışan ≤2 biter", async () => {
  const items = Array.from({ length: 12 }, (_v, i) => i);
  let started = 0, mode = false;
  const st = await batchRun(items, async () => { started++; if (started >= 2) mode = "cancel"; await wait(5); return { status: "completed" }; },
    { concurrency: 2, isStopped: () => mode });
  const completed = st.filter(x => x === "completed").length;
  const cancelled = st.filter(x => x === "cancelled").length;
  assert.ok(completed <= 2, "iptalde en fazla 2 tamamlanır (completed=" + completed + ")");
  assert.ok(cancelled >= 10, "kalanlar iptal edilir (cancelled=" + cancelled + ")");
  assert.equal(completed + cancelled, 12);
});

test("DURAKLAT → başlamamış sahneler 'queued' KALIR (devam edilebilir), 'cancelled' OLMAZ", async () => {
  const items = Array.from({ length: 12 }, (_v, i) => i);
  let started = 0, mode = false;
  const st = await batchRun(items, async () => { started++; if (started >= 2) mode = "pause"; await wait(5); return { status: "completed" }; },
    { concurrency: 2, isStopped: () => mode });
  const completed = st.filter(x => x === "completed").length;
  const queued = st.filter(x => x === "queued").length;
  const cancelled = st.filter(x => x === "cancelled").length;
  assert.ok(completed <= 2, "duraklatınca en fazla 2 tamamlanır");
  assert.equal(cancelled, 0, "duraklatmada İPTAL yok (kalanlar korunur)");
  assert.ok(queued >= 10, "kalanlar 'queued' kalır → devam edilebilir (queued=" + queued + ")");
  // DEVAM: kalan queued'ları tekrar çalıştır → hepsi tamamlanır
  const rest = items.filter((_v, i) => st[i] === "queued");
  const st2 = await batchRun(rest, async () => { await wait(1); return { status: "completed" }; }, { concurrency: 2 });
  assert.ok(st2.every(x => x === "completed"), "devam edince kalanlar tamamlanır");
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
test("Kurtarma bildirimi koşulu: bitmemiş + işlenecek sahnesi olan batch", () => {
  const notice = (b) => !b.done && (b.scenes || []).some(sc => sc.status === "queued" || sc.status === "processing" || sc.status === "cancelled");
  assert.equal(notice({ done: false, scenes: [{ status: "completed" }, { status: "queued" }] }), true, "yarım kalan → bildirim");
  assert.equal(notice({ done: true, scenes: [{ status: "completed" }] }), false, "bitmiş → bildirim yok");
  assert.equal(notice({ done: false, scenes: [{ status: "completed" }, { status: "failed" }] }), false, "işlenecek sahne yok → bildirim yok");
});

// ── (D) GERÇEK kaynak değişmezleri ──────────────────────────────────────────
test("index.ts: sunucu-taraflı estimate + image recovery-by-opId + save-on-success", () => {
  assert.ok(indexSrc.includes('act === "estimate"') && indexSrc.includes('costFor("image", "", i)'), "sunucu estimate (costFor) olmalı");
  assert.ok(indexSrc.includes('"estimate"') && indexSrc.includes("ALLOWED_ACTIONS"), "estimate izinli action");
  assert.ok(indexSrc.includes("loadJobResult(admin, userId, opId)") && indexSrc.includes("recovered: true"), "opId ile kurtarma (çift üretim yok)");
  assert.ok(indexSrc.includes("saveJobResult(admin, userId, opId, { url, meta })"), "sonuç job-cache'e yazılmalı");
});
test("Studio.dc.html: kontrollü kuyruk motoru + kararlı opId + kalıcılık", () => {
  assert.ok(studioSrc.includes("async _batchRun("), "kontrollü kuyruk motoru");
  assert.ok(studioSrc.includes("concurrency: 2"), "eşzamanlılık 2");
  assert.ok(studioSrc.includes("Math.min(CONC, items.length)"), "aktif iş concurrency ile sınırlı");
  assert.ok(studioSrc.includes("(b.id + sc.key)") && studioSrc.includes("makeImage(sc.prompt, sc.idx, sc.key, b.aspect, opId, provider)"), "sahne başına kararlı opId + kendi promptu/sağlayıcısı");
  assert.ok(studioSrc.includes("if (this._batchActive) return;"), "çift tıklama koruması");
  assert.ok(studioSrc.includes("ta_studio_batch_v1"), "batch durumu kalıcı (yenileme)");
  for (const w of ["queued", "processing", "completed", "failed", "refunded", "cancelled"]) {
    assert.ok(studioSrc.includes(w), "durum eksik: " + w);
  }
  assert.ok(studioSrc.includes("action: 'estimate'"), "toplam tahmin sunucudan alınır");
});
test("Studio.dc.html: DURAKLAT / DEVAM / İPTAL ayrımı ('pause' korur, 'cancel' iptal eder)", () => {
  assert.ok(studioSrc.includes("pauseBatch()") && studioSrc.includes("_batchStopMode = 'pause'"), "Duraklat");
  assert.ok(studioSrc.includes("cancelBatch()") && studioSrc.includes("_batchStopMode = 'cancel'"), "İptal");
  assert.ok(studioSrc.includes("async resumeBatch()"), "Devam Et");
  assert.ok(studioSrc.includes("isStopped() !== 'pause'"), "duraklatta kalan 'queued' KORUNUR");
  assert.ok(studioSrc.includes("⏸ DURAKLAT") && studioSrc.includes("▶ DEVAM ET") && studioSrc.includes("✖ İPTAL ET"), "üç kontrol butonu");
});
test("Studio.dc.html: queue özeti + progress bar + aktif sahne + tahmini kalan süre", () => {
  // PR-2 terminolojisi: 'Görsel hazır' (Tamamlanan yerine) · 'Üretiliyor' (processing) · 'Sırada' (queued)
  assert.ok(studioSrc.includes("Toplam Sahne: ") && studioSrc.includes("Görsel hazır: ") && studioSrc.includes("Üretiliyor: ") && studioSrc.includes("Sırada: "), "queue özeti 4 sayaç (Görsel hazır terminolojisi)");
  assert.ok(studioSrc.includes("batchProgStyle") && studioSrc.includes("batchPctText"), "gerçek zamanlı progress bar");
  assert.ok(studioSrc.includes("🟡 Şu anda üretiliyor:") && studioSrc.includes("Tahmini kalan süre:"), "aktif sahne paneli");
  assert.ok(studioSrc.includes("batchTick") && studioSrc.includes("_startBatchTicker"), "canlı kalan süre için 1sn re-render");
});
test("Studio.dc.html: emoji durum rozetleri + sahne-bazlı Tekrar Dene", () => {
  assert.ok(studioSrc.includes("⚪ BEKLİYOR") && studioSrc.includes("🟡 ÜRETİLİYOR") && studioSrc.includes("🟢 GÖRSEL HAZIR") && studioSrc.includes("🔴 HATA"), "emoji rozetler (PR-2: GÖRSEL HAZIR)");
  assert.ok(studioSrc.includes("retryScene(") && studioSrc.includes("TEKRAR DENE") && studioSrc.includes("batchCanRetry"), "başarısız sahnede Tekrar Dene");
});
test("Studio.dc.html: üretim sonu özeti + kurtarma bildirimi", () => {
  assert.ok(studioSrc.includes("✅ Üretim Tamamlandı"), "tamamlanma başlığı");
  assert.ok(studioSrc.includes("Toplam Süre:") && studioSrc.includes("Harcanan Kredi:") && studioSrc.includes("Başarılı:") && studioSrc.includes("Başarısız:"), "özet alanları");
  assert.ok(studioSrc.includes("Devam eden üretiminiz bulundu"), "yenileme kurtarma bildirimi");
});
