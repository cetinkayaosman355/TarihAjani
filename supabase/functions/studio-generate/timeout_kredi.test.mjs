// ============================================================================
// TIMEOUT → KREDİ GÜVENLİĞİ — canlı vaka düzeltmesi
// (img_fail status=0 class=TIMEOUT ms=120002 → 12 KR kalıcı düşmüştü)
// Çalıştır:  node --test supabase/functions/studio-generate/timeout_kredi.test.mjs
//
// (A) Kaynak değişmezleri: merkezi zaman bütçesi, bütçe içinde durma,
//     görsel yolunun garantili-iade ağına bağlanması, imgreclaim ucu,
//     istemci zaman sınırı + kurtarma çağrısı, zaman aşımı mesajı.
// (B) Saf aynalar: bütçe zamanlayıcısı, iade durum makinesi (AbortError/ağ/
//     oran/parse), idempotent refund, reclaim akışı, retry'da çift ücret yok.
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");
const indexSrc = readFileSync(join(HERE, "index.ts"), "utf8");
const sqlSrc = readFileSync(join(REPO, "supabase", "migrations", "20260718d_kredi_rezervasyon.sql"), "utf8");
const sweepSrc = readFileSync(join(REPO, "supabase", "migrations", "20260719a_asili_rezervasyon_iade.sql"), "utf8");

// ── (A) KAYNAK DEĞİŞMEZLERİ ─────────────────────────────────────────────────
test("Merkezi zaman bütçesi: deneme + toplam süre config'te; zincir bütçeye sığar", () => {
  assert.ok(indexSrc.includes("const IMG_ATTEMPT_MS"), "deneme başına süre merkezi");
  assert.ok(indexSrc.includes("const IMG_BUDGET_MS"), "toplam bütçe merkezi");
  assert.ok(indexSrc.includes('Deno.env.get("TA_IMG_ATTEMPT_TIMEOUT_MS")') && indexSrc.includes('Deno.env.get("TA_IMG_BUDGET_MS")'), "env ile ayarlanabilir");
  assert.ok(indexSrc.includes("Math.min(140_000"), "toplam senkron bekleme 140 sn'yi AŞAMAZ");
  assert.ok(indexSrc.includes("const remaining = () => IMG_BUDGET_MS - (Date.now() - chainT0)"), "kalan süre takibi");
  assert.ok(indexSrc.includes("if (remaining() < 20_000) {"), "kalan süre yetmiyorsa YENİ deneme başlamaz (kontrol fonksiyona döner)");
  assert.ok(indexSrc.includes("Math.min(IMG_ATTEMPT_MS, remaining() - 8_000)"), "her çağrının süresi kalan bütçeden kırpılır");
  assert.ok(indexSrc.includes("remaining() > 25_000"), "retry yalnız bütçe varsa");
  // eski sabit 120 sn görsel çağrılarında kalmadı (görsel yolunda dinamik timeoutMs)
  assert.ok(indexSrc.includes("callOnce: (model: string, isPrimary: boolean, timeoutMs: number)"), "callOnce timeout parametresi alır");
  assert.ok(indexSrc.includes("}, timeoutMs);"), "fetchT görsel çağrılarında dinamik timeout kullanır");
});

test("Görsel yolu garantili-iade ağına bağlı: beklenmeyen exception da iade eder", () => {
  assert.ok(indexSrc.includes("if (res.reserved) pendingRefund = { admin, user: userId, job: opId };"), "rezervasyon sonrası pendingRefund kurulur");
  const iSet = indexSrc.indexOf("if (res.reserved) pendingRefund = { admin, user: userId, job: opId };");
  const iGen = indexSrc.indexOf("let url = await generateImage(");
  assert.ok(iSet > 0 && iSet < iGen, "pendingRefund provider çağrısından ÖNCE kurulur");
  assert.ok(indexSrc.includes("pendingRefund = null;   // başarı → beklenmeyen-hata iadesi devre dışı"), "başarıda ağ kapatılır (finalize'dan sonra iade yok)");
  assert.ok(indexSrc.includes("await doRefund();"), "global catch doRefund çağırır");
});

test("Zaman aşımı kullanıcıya NET söylenir + iade bilgisiyle", () => {
  assert.ok(indexSrc.includes('diag.cls === "TIMEOUT"'), "timeout ayrı ele alınır");
  assert.ok(indexSrc.includes("Üretim zaman aşımına uğradı"), "kullanıcı dili mesaj");
  assert.ok(indexSrc.includes("kredi iade edildi"), "iade bilgisi mesajda");
});

test("imgreclaim ucu: önce KURTAR (sonuç varsa), yoksa idempotent İADE", () => {
  assert.ok(indexSrc.includes('"imgreclaim"'), "ALLOWED_ACTIONS'ta");
  assert.ok(indexSrc.includes('act === "imgreclaim"'), "handler mevcut");
  const h = indexSrc.slice(indexSrc.indexOf('if (act === "imgreclaim")'));
  const iLoad = h.indexOf("loadJobResult(admin, userId, rOp)");
  const iRef = h.indexOf("refundOp(admin, userId, rOp)");
  assert.ok(iLoad > 0 && iRef > 0 && iLoad < iRef, "önce sonuç kurtarma, sonra iade (başarılı üretim asla iade edilmez)");
  assert.ok(h.slice(0, 900).includes("recovered: true"), "kurtarılan sonuç ücretsiz döner");
  assert.ok(indexSrc.includes('"TIMEOUT_RECLAIMED"'), "iade sınıfı loglanır/dönülür");
  assert.ok(indexSrc.includes('cost > 0 || isEdit || act === "imgreclaim"'), "reclaim için giriş şart (başkasının rezervasyonu iade edilemez)");
});

test("İstemci: 150 sn sınır + yanıt alınamazsa tek seferlik reclaim", () => {
  assert.ok(studioSrc.includes("setTimeout(() => { try { ac.abort(); } catch (e) {} }, 150000)"), "istemci fetch zaman sınırı");
  assert.ok(studioSrc.includes("action: 'imgreclaim', opId"), "reclaim çağrısı");
  assert.ok(studioSrc.includes("if (d2 && d2.ok && d2.url) return { url: d2.url, meta: d2.meta || null };"), "sonuç kurtarılırsa başarı sayılır");
  assert.ok(studioSrc.includes("Üretim zaman aşımına uğradı; kredi iade edildi. Tekrar dene."), "kullanıcıya net mesaj");
});

test("SQL sözleşmesi: refund idempotent + 15 dk asılı-rezervasyon süpürücüsü mevcut", () => {
  assert.ok(sqlSrc.includes("if not found or r.status <> 'reserved' then"), "refund yalnız 'reserved' durumunu iade eder (idempotent)");
  assert.ok(sqlSrc.includes("status = 'finalized', updated_at = now()") && sqlSrc.includes("and status = 'reserved'"), "finalize yalnız 'reserved'ı kapatır");
  assert.ok(sweepSrc.includes("interval '15 minutes'"), "asılı rezervasyonlar 15 dk sonra otomatik iade");
  assert.ok(sweepSrc.includes("perform public.refund_reservation(p_user, r.job);"), "süpürücü her reserve çağrısında çalışır");
});

test("Timeout sonrası studio_images'e 'başarılı' kayıt düşmez (kaynak sırası)", () => {
  const h = indexSrc.slice(indexSrc.indexOf('String(b.action || "") === "image"'));
  const iNull = h.indexOf("if (!url) {");
  const iIns = h.indexOf('admin.from("studio_images").upsert(');
  assert.ok(iNull > 0 && iIns > 0 && iNull < iIns, "başarısızlık dönüşü arşiv kaydından ÖNCE (timeout'ta kayıt oluşmaz)");
});

// ── (B) SAF AYNALAR ─────────────────────────────────────────────────────────
// Bütçe zamanlayıcısı aynası — runImageChain ile aynı kurallar.
function chainSim(attempts, BUDGET = 135, ATTEMPT = 100, MIN_LEFT = 20, TRIM = 8) {
  let t = 0; const calls = [];
  for (const dur of attempts) {
    const left = BUDGET - t;
    if (left < MIN_LEFT) { calls.push({ skipped: true, left }); break; }
    const tmo = Math.min(ATTEMPT, left - TRIM);
    const spent = Math.min(dur, tmo);
    calls.push({ tmo, spent });
    t += spent;
  }
  return { calls, total: t };
}
test("Ayna bütçe: 3 × 120 sn'lik eski felaket artık İMKÂNSIZ — toplam ≤ 135 sn", () => {
  const r = chainSim([999, 999, 999]);   // hepsi asılı kalan çağrılar
  assert.ok(r.total <= 135, "toplam süre bütçeyi aşamaz (eski: ~360 sn)");
  assert.equal(r.calls[0].tmo, 100, "ilk deneme en çok 100 sn");
  assert.ok(r.calls[1].tmo <= 35 - 8 + 8, "ikinci deneme kalan bütçeye kırpılır");
  const last = r.calls[r.calls.length - 1];
  assert.ok(last.skipped || r.total <= 135, "bütçe bitince yeni deneme başlamaz");
});
test("Ayna bütçe: hızlı başarısızlıkta yedek modele süre KALIR", () => {
  const r = chainSim([5, 5, 100]);
  assert.equal(r.calls.length, 3, "üç çağrı da yapılabildi");
  assert.ok(r.total <= 135);
});

// İade durum makinesi — rezervasyon SONRASI her hata yolu iade eder.
function settle(ev) {
  // ev: { reserved, outcome: 'ok'|'abort'|'network'|'parse'|'ratio'|'storage'|'db'|'exception', resultSaved }
  if (!ev.reserved) return { refunded: false, charged: false };
  if (ev.outcome === "ok") return { refunded: false, charged: true, finalized: true };
  return { refunded: true, charged: false };   // timeout/abort/ağ/parse/oran/storage/db/exception → İADE
}
test("Ayna iade: AbortError · timeout · ağ · parse · oran · storage · db · exception → HEPSİ iade", () => {
  for (const o of ["abort", "network", "parse", "ratio", "storage", "db", "exception"]) {
    const r = settle({ reserved: true, outcome: o });
    assert.equal(r.refunded, true, o + " → refund");
    assert.equal(r.charged, false, o + " → ücret yok");
  }
  const ok = settle({ reserved: true, outcome: "ok" });
  assert.deepEqual(ok, { refunded: false, charged: true, finalized: true }, "başarı → yalnız finalize");
});

// Rezervasyon defteri aynası (SQL davranışı): idempotent refund + retry'da çift düşüm yok.
function ledger() {
  const res = new Map(); let bal = 13149;
  return {
    bal: () => bal,
    reserve(job, amount) {
      if (res.has(job)) return res.get(job).status !== "refunded";   // idempotent: tekrar düşmez
      if (bal < amount) return false;
      bal -= amount; res.set(job, { amount, status: "reserved" });
      return true;
    },
    finalize(job) { const r = res.get(job); if (r && r.status === "reserved") r.status = "finalized"; },
    refund(job) { const r = res.get(job); if (!r || r.status !== "reserved") return bal; bal += r.amount; r.status = "refunded"; return bal; }
  };
}
test("Ayna defter: aynı rezervasyon İKİ KEZ refund → bakiye İKİ KEZ ARTMAZ (13149 sabit)", () => {
  const L = ledger();
  L.reserve("op1", 12);
  assert.equal(L.bal(), 13137, "rezervasyonda düşer (canlı vaka)");
  assert.equal(L.refund("op1"), 13149, "ilk iade bakiyeyi geri getirir");
  assert.equal(L.refund("op1"), 13149, "ikinci iade DEĞİŞTİRMEZ (idempotent)");
  assert.equal(L.bal(), 13149);
});
test("Ayna defter: aynı opId ile retry → ikinci kredi düşmez; başarı → yalnız finalize", () => {
  const L = ledger();
  L.reserve("op2", 12);
  L.reserve("op2", 12);   // retry aynı opId
  assert.equal(L.bal(), 13137, "tek düşüm");
  L.finalize("op2");
  assert.equal(L.refund("op2"), 13137, "finalize sonrası refund NO-OP (başarılı üretim iade edilmez)");
});
test("Ayna reclaim: sonuç varsa kurtar (iade yok); yoksa iade; ikinci reclaim no-op", () => {
  const L = ledger();
  L.reserve("op3", 12);
  const reclaim = (hasResult) => hasResult ? { recovered: true, bal: L.bal() } : { reclaimed: true, bal: L.refund("op3") };
  assert.deepEqual(reclaim(true), { recovered: true, bal: 13137 }, "başarılı üretim: görsel döner, iade YOK (finalize edilecek)");
  const r1 = reclaim(false);
  assert.equal(r1.bal, 13149, "sonuç yoksa iade");
  const r2 = reclaim(false);
  assert.equal(r2.bal, 13149, "ikinci reclaim bakiyeyi artırmaz");
});
