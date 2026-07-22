// ============================================================================
// ARŞİV · AJANLA TAMAMLA — dosya içini oku, eksikleri tespit et, üretiyormuş
// gibi tamamla. Üye kilidi arkasında, ücretsiz (action'sız) metin üretimiyle.
// Çalıştır: node --test supabase/functions/studio-generate/arsiv_tamamla.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Arsiv.dc.html"), "utf8");

test("Arşiv: AJANLA TAMAMLA butonu + durum mesajı üye bloğunda", () => {
  assert.ok(src.includes('onClick="{{ agentFix }}"'), "tamamla butonu");
  assert.ok(src.includes("{{ agentFixLabel }}"), "buton etiketi");
  assert.ok(src.includes('sc-if value="{{ selCanFix }}"'), "yalnız eksik varken/tamamlanınca görünür");
  assert.ok(src.includes("{{ selFixMsg }}") && src.includes("{{ selFixColor }}"), "durum mesajı + rengi");
});

test("Arşiv: gap tespiti (seslendirme/süre/görsel/yayın) + üretiyormuş gibi tamamlama", () => {
  assert.ok(src.includes("_arsivGaps(index)"), "gap tespiti");
  assert.ok(src.includes("gaps.push('seslendirme')") && src.includes("gaps.push('sure')") &&
    src.includes("gaps.push('gorsel')") && src.includes("gaps.push('yayin')"), "dört gap türü");
  assert.ok(src.includes("async agentTamamla(index)"), "tamamlama akışı");
  assert.ok(src.includes("baş yapımcısısın") && src.includes("var olan içeriği BOZMA"), "mevcut içerik korunur");
  assert.ok(src.includes("TÜM mevcut bölümleri KORU"), "bölümler korunur, eksik eklenir");
});

test("Arşiv: tamamlanan sürüm gösterime/ekitaba/kopyaya yansır", () => {
  assert.ok(src.includes("_secOf(index)"), "canlı bölüm çözümleyici (fix > orijinal)");
  assert.ok(src.includes("return fixed || raw.sections || raw.sayfalar || []"), "düzeltilmiş sürüm önceliklidir");
  assert.ok(src.includes("selSections: sel ? (selSecsLive"), "gösterim canlı bölümlerden");
  assert.ok(src.includes("this.ekitapOpen({ ...sel, sections: selSecsLive })"), "e-kitap düzeltilmiş sürümü basar");
});

test("Arşiv: ücretsiz askAI (action'sız) + üye jetonu + hata koruması", () => {
  assert.ok(src.includes("async _askAI(prompt, maxTokens)"), "askAI yardımcısı");
  assert.ok(src.includes("action: ''"), "action'sız = ücretsiz");
  assert.ok(src.includes("const token = this._tok || KEY"), "üye jetonu, yoksa anon");
  assert.ok(src.includes("this._tok = (session && session.access_token)"), "oturum jetonu yakalanır");
  assert.ok(src.includes("(d && d.text) || (d && d.result)"), "yanıt data.text'ten okunur");
});

// ── SAF AYNA: gap tespiti mantığı ───────────────────────────────────────────
function gaps(secs) {
  const blocks = (secs || []).flatMap(s => (s.bloklar || []).map(b => ({
    k: (b.k || '').toLocaleUpperCase('tr'), t: b.t || '', ad: (s.ad || '').toLocaleUpperCase('tr') })));
  const ses = blocks.find(b => /SESLEND/.test(b.k) || /SESLEND/.test(b.ad));
  const sesW = ses && ses.t.trim() ? ses.t.trim().split(/\s+/).length : 0;
  const hepsi = (secs || []).flatMap(s => (s.bloklar || []).map(b => (b.k || '') + ' ' + (b.t || ''))).join('\n').toLocaleUpperCase('tr');
  const g = [];
  if (sesW < 90) g.push('seslendirme');
  if (!/\d+\s*(SN|SANİYE|DK|DAKİKA)/.test(hepsi)) g.push('sure');
  if (!/(GÖRSEL|SAHNE|PROMPT|KAPAK)/.test(hepsi)) g.push('gorsel');
  if (!/(YOUTUBE|INSTAGRAM|YAYIN|BAŞLIK|ETİKET|HASHTAG)/.test(hepsi)) g.push('yayin');
  return g;
}
test("Ayna: ince/eksik dosyada gaplar; dolu dosyada gap yok", () => {
  const ince = [{ ad: 'SESLENDİRME', bloklar: [{ k: 'SESLENDİRME', t: 'Kısa bir cümle.' }] }];
  assert.deepEqual(gaps(ince).sort(), ['gorsel', 'seslendirme', 'sure', 'yayin'].sort());
  const uzunSes = Array.from({ length: 120 }, () => 'kelime').join(' ');
  const tam = [
    { ad: 'SESLENDİRME', bloklar: [{ k: 'SESLENDİRME (~80 SN)', t: uzunSes }] },
    { ad: 'GÖRSEL & SAHNE PROMPTLARI', bloklar: [{ k: 'KAPAK', t: 'cinematic prompt' }] },
    { ad: 'YAYIN PAKETİ', bloklar: [{ k: 'YOUTUBE', t: 'başlık + etiketler' }] },
  ];
  assert.deepEqual(gaps(tam), []);
});
