// ============================================================================
// AÇIK FORMAT + VİRAL ÖNERİ + AKICI SESLENDİRME + SRT/AYDINLIK DÜZELTMELERİ
// Kullanıcı kanal kalıbına mecbur değil: POV / liste / ne olurdu / soru / serbest.
// Sen Öner viral stratejist turuyla dönüşümlü fikir üretir. TTS'e giden metin
// yumuşatılır ("…", "!!!", asılı tire). SRT boş dosya indirmez; aydınlıkta
// prompt kodu okunur.
// Çalıştır: node --test supabase/functions/studio-generate/acik_format.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("Açık format: 7 içerik formatı seçilebilir + prompt bloğu üretir", () => {
  assert.ok(src.includes("'İçerik Formatı'"), "İnce Ayar'da format grubu");
  for (const id of ["'belgesel'", "'reels'", "'pov'", "'liste'", "'neolurdu'", "'soru'", "'serbest'"])
    assert.ok(src.includes("{ id: " + id + ", name:"), id + " format seçeneği");
  assert.ok(src.includes("contentFormatBlock(f)"), "format kural bloğu yardımcı");
  assert.ok(src.includes("${this.contentFormatBlock(s.format)}"), "ana prompta enjekte");
  assert.ok(src.includes("POV MODU") && src.includes("TOP LİSTE MODU") && src.includes("ALTERNATİF TARİH MODU") && src.includes("SORU-CEVAP MODU") && src.includes("SERBEST FORMAT"), "her formatın kuralı");
  assert.ok(src.includes("POV OVERRIDE:"), "POV sahne kamerası (first-person) sceneCfg'de");
});

test("Sen Öner: viral stratejist turu (YouTube/Reels/TikTok fikirleri)", () => {
  assert.ok(src.includes("const viralTurn = this._sgIdx % 2 === 1"), "dönüşümlü tur");
  assert.ok(src.includes("viral içerik stratejistisin"), "viral stratejist prompt");
  assert.ok(src.includes('POV: 1453'), "başlangıç çiplerinde viral format örneği");
});

test("Akıcı seslendirme: _ttsSmooth her TTS çağrısına uygulanır + prompt kuralı", () => {
  assert.ok(src.includes("_ttsSmooth(t)"), "yumuşatıcı");
  assert.ok(src.includes("text = this._ttsSmooth(text)"), "ttsServer girişinde uygulanır");
  assert.ok(src.includes("SESLİ OKUMA AKICILIĞI (metin bir SESLİ ANLATICI"), "üretim promptunda akıcılık kuralı");
  assert.ok(src.includes('"1982. İstanbul." gibi kesik tarih/yer parçaları YASAK'), "kesik parça yasağı");
});

test("SRT: boş dosya asla inmez + sahne anlatımı yedeği", () => {
  assert.ok(src.includes("if (!srt || !srt.trim())"), "boş içerik indirilmez");
  assert.ok(src.includes("x.anlatim || x.sahne"), "senaryo boşsa sahne anlatımından altyazı");
});

test("Aydınlık tema: prompt kod blokları okunur (koyu mürekkep)", () => {
  assert.ok(src.includes('html[data-theme="light"] [style*="color: #c8cfdd"]'), "soluk prompt rengi hedeflendi");
  assert.ok(src.includes("color: #33383f !important"), "koyu mürekkep");
});

test("Süre danışmanı: 30 sn + kapsamlı konuda nazik öneri + tek dokunuş", () => {
  assert.ok(src.includes("durAdviceShow"), "koşullu görünüm");
  assert.ok(src.includes("durAdvice1dk") && src.includes("{ duration: 's60' }"), "1 dk tek dokunuş");
  assert.ok(src.includes("1 dakika, hikâyeye nefes aldırır"), "öneri dili");
});

// ── SAF AYNA: _ttsSmooth davranışı ─────────────────────────────────────────
function smooth(t) {
  return String(t || '')
    .replace(/…|\.{3,}/g, '.')
    .replace(/\s+[–—-]\s+/g, ', ')
    .replace(/([!?]){2,}/g, '$1')
    .replace(/\.\s*\.(\s|$)/g, '.$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
test("Ayna: yumuşatma — üç nokta/tire/çoklu ünlem; bitişik aralıklar korunur", () => {
  assert.equal(smooth("Yıl 1982… İstanbul…"), "Yıl 1982. İstanbul.");
  assert.equal(smooth("Sonra — kimse beklemiyordu — geldi"), "Sonra, kimse beklemiyordu, geldi");
  assert.equal(smooth("İnanılmaz!!! Gerçekten mi??"), "İnanılmaz! Gerçekten mi?");
  assert.equal(smooth("1982–83 kışı"), "1982–83 kışı");   // bitişik aralık bozulmaz
});
