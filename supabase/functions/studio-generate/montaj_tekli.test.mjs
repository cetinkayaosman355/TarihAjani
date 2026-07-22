// ============================================================================
// MONTAJ PANELİ — TEK TEK ÜRETİM: her sahne satırında 🎙 seslendirme (üret/dinle)
// + 🎬 tek AI video. Tek tek üretilen sesler dosya-bazlı ÖNBELLEĞE alınır ve
// belgesel montajı aynı sesi KREDİSİZ kullanır (eskiden her render tüm sahne
// TTS'ini yeniden üretip kredi yakıyordu). Metin değişirse önbellek geçersizleşir.
// Çalıştır: node --test supabase/functions/studio-generate/montaj_tekli.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("Sahne seslendirme önbelleği: dosya-bazlı + metin değişince geçersiz", () => {
  assert.ok(src.includes("_docAudActive()"), "aktif dosya süzgeci");
  assert.ok(src.includes("a.text === String(text || '')) ? a.url : ''"), "metin eşleşmezse önbellek geçersiz");
  assert.ok(src.includes("_docAudSet(gi, text, url)"), "önbelleğe yazma");
  assert.ok(src.includes("docAud: (w && w.docAud) || {}"), "yenilemede geri yüklenir");
  assert.ok(src.includes("docAud: s.docAud || {}, docAudFile: s.docAudFile || ''"), "persist'e yazılır");
});

test("Montaj satırı 🎙: sesi tek başına üret / hazırsa dinle", () => {
  assert.ok(src.includes("async docSceneVoice(gi)"), "tekli seslendirme üretimi");
  assert.ok(src.includes("if (have) { try { new Audio(have).play(); } catch (e) {} return; }"), "hazır ses doğrudan çalınır (ücretsiz)");
  assert.ok(src.includes("voiceIcon: voiceBusy ? '⏳' : (hasAud ? '▶' : '🎙')"), "duruma göre ikon");
  assert.ok(src.includes('onClick="{{ ds.voice }}" disabled="{{ ds.voiceBusy }}"'), "satır butonu bağlı");
});

test("Montaj satırı 🎬: sahneden tek AI video (mevcut video modalı)", () => {
  assert.ok(src.includes("vid: () => this.openVideoModal({ kind: 'scene', key: 'gp' + gi, url: rawImg })"), "video modalı sahneyle açılır");
  assert.ok(src.includes('onClick="{{ ds.vid }}" title="{{ ds.vidTitle }}"'), "satır video butonu bağlı");
});

test("Belgesel render önbelleği kullanır: aynı ses için iki kez ödenmez", () => {
  assert.ok(src.includes("const cachedUrl = this._docAudGet(scenes[i].gi, scenes[i].text)"), "render önce önbelleğe bakar");
  assert.ok(src.includes("const url = cachedUrl || (await this.ttsServer(scenes[i].text || ' ')).url"), "yoksa TTS üretir");
  assert.ok(src.includes("if (!cachedUrl && url) this._docAudSet(scenes[i].gi, scenes[i].text, url)"), "render ürettiğini de önbelleğe yazar");
  assert.ok(src.includes("out.push({ img, text: String(text || ''), gi: i })"), "_docScenes sahne indeksini taşır");
});

test("Montaj düzeni (sıra/çıkarılan) da yenilemede korunur", () => {
  assert.ok(src.includes("docOrder: (w && w.docOrder) || null"), "sıra geri yüklenir");
  assert.ok(src.includes("docOrder: s.docOrder || null, docExcl: s.docExcl || null, docMontageFile: s.docMontageFile || ''"), "sıra persist edilir");
});
