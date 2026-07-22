// ============================================================================
// FAZ D — SOHBETLE ÜRETİM: kullanıcı ajanla KONUŞARAK üretim yaptırır.
// "3. sahnenin görselini üret", "seslendir", "videosunu çıkar", "bu konuyu üret".
// Ajan niyeti anlar, yanıtına gizli [[DO:...]] direktifi ekler; sistem yürütür.
// Kredi/ücret onayı ilgili metotların (startGenerate/makeImage/makeTts) içinde.
// Çalıştır: node --test supabase/functions/studio-generate/sohbet_uretim.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("Sohbet promptu ÜRETİM KOMUTLARI + [[DO:...]] direktif sözlüğü içerir", () => {
  assert.ok(src.includes("SEN AYNI ZAMANDA BİR ÜRETİM AJANISIN"), "üretim ajanı personası");
  for (const d of ["[[DO:uret]]", "[[DO:konu:", "[[DO:gorseller]]", "[[DO:gorsel:N]]", "[[DO:seslendir]]", "[[DO:video:N]]"]) {
    assert.ok(src.includes(d), "direktif tanımı: " + d);
  }
  assert.ok(src.includes("belirsizse direktif EKLEME, tek net soru sor"), "eksik bilgide soru sorma kuralı");
});

test("sendChat: [[DO:...]] direktifini ayrıştırır, gizler ve yürütür", () => {
  assert.ok(src.includes("const act = raw.match(/\\[\\[DO:([a-zçğıöşü]+)(?::([^\\]]*))?\\]\\]/i)"), "DO direktif regex");
  assert.ok(src.includes(".replace(/\\[\\[DO:[^\\]]*\\]\\]/g, '')"), "direktif kullanıcıdan gizlenir");
  assert.ok(src.includes("if (act) this._chatAction(act[1].toLocaleLowerCase('tr'), (act[2] || '').trim())"), "aksiyon dispatch");
});

test("_chatAction: her direktif doğru metoda bağlanır + ön koşul korumaları", () => {
  assert.ok(src.includes("_chatAction(kind, arg)"), "dispatcher");
  assert.ok(src.includes("if (kind === 'uret')") && src.includes("this.startGenerate()"), "uret → startGenerate");
  assert.ok(src.includes("if (kind === 'gorseller')") && src.includes("this.genAllScenes()"), "gorseller → genAllScenes");
  assert.ok(src.includes("this.makeImage(gp.prompt, n - 1, 'gp' + (n - 1))"), "gorsel:N → makeImage");
  assert.ok(src.includes("if (kind === 'seslendir')") && src.includes("this.makeTts()"), "seslendir → makeTts");
  assert.ok(src.includes("this.openVideoModal({ kind: 'scene', key, url: img.url })"), "video:N → openVideoModal");
  // ön koşullar
  assert.ok(src.includes("if (!this.looksLikeTopic(s.idea || ''))"), "uret: geçerli konu koşulu");
  assert.ok(src.includes("Video, sahnenin GÖRSELİNDEN üretilir"), "video: görsel ön koşulu");
  assert.ok(src.includes("Seslendirilecek metin yok"), "seslendir: metin ön koşulu");
});

test("_studioCtx: ajana canlı durum (sahne sayısı, üretilen görsel, seslendirme, ayarlar)", () => {
  assert.ok(src.includes("_studioCtx()"), "durum özeti helper'ı");
  assert.ok(src.includes("Sahne sayısı=' + nGor + ' · üretilen görsel=' + imgDone"), "sahne + görsel sayısı");
  assert.ok(src.includes("seslendirme=' + (hasSes ? 'hazır' : 'yok')"), "seslendirme durumu");
  assert.ok(src.includes("const ctx = this._studioCtx();"), "sendChat durum özetini kullanır");
});

test("Boş sohbet çipleri dosya varken üretim komutlarına döner", () => {
  assert.ok(src.includes("quickChips: (s.result"), "çipler duruma göre");
  assert.ok(src.includes("🎨 Tüm sahne görsellerini üret"), "görsel üret çipi");
  assert.ok(src.includes("🎙 Seslendirmeyi üret"), "seslendir çipi");
});
