// ============================================================================
// FİKİR EKRANI İKİ MOD: "Sen Öner" / "Benim Fikrim Var" + "Taslağı Hazırla"
// Çalıştır: node --test supabase/functions/studio-generate/taslak_modu.test.mjs
// (A) Kaynak değişmezleri (Studio.dc.html + index.ts)  (B) Saf aynalar: taslak mantığı
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

// ── (A) KAYNAK DEĞİŞMEZLERİ ─────────────────────────────────────────────────
test("İki mod seçici: Sen Öner + Benim Fikrim Var, varsayılan 'suggest'", () => {
  assert.ok(studioSrc.includes("◈ Sen Öner"), "Sen Öner butonu");
  assert.ok(studioSrc.includes("✎ Benim Fikrim Var"), "Benim Fikrim Var butonu");
  assert.ok(studioSrc.includes("ideaMode: 'suggest'"), "varsayılan mod suggest");
  assert.ok(studioSrc.includes("setModeSuggest:"), "suggest'e geçiş VM");
  assert.ok(studioSrc.includes("setModeOwn:"), "own'a geçiş VM");
  assert.ok(studioSrc.includes("isOwnMode: (s.ideaMode || 'suggest') === 'own'"), "isOwnMode türetimi");
  assert.ok(studioSrc.includes("isSuggestMode: (s.ideaMode || 'suggest') !== 'own'"), "isSuggestMode türetimi");
});

test("CTA moda göre: own → 'Taslağı Hazırla', suggest → 'SEÇENEKLERE GEÇ'", () => {
  assert.ok(studioSrc.includes("TASLAĞI HAZIRLA"), "own modu CTA'sı");
  assert.ok(studioSrc.includes("SEÇENEKLERE GEÇ"), "suggest modu CTA'sı korunur");
  assert.ok(studioSrc.includes("prepareDraftBase: () => this.prepareDraft('base')"), "own CTA prepareDraft çağırır");
  assert.ok(studioSrc.includes('onClick="{{ toStep2 }}"'), "suggest CTA doğrudan adım 2'ye geçer (değişmedi)");
});

test("'Taslağı Hazırla' TAM üretim yapmaz: yalnız 8 taslak alanı üretir", () => {
  assert.ok(studioSrc.includes("async prepareDraft(variant)"), "prepareDraft metodu");
  // İstenen 8 alan, tam hikâye/seslendirme/görsel prompt/video prompt DEĞİL
  for (const f of ['"ana_fikir"', '"bakis_acisi"', '"baslangic"', '"gelisme"', '"final"', '"onemli_ayrintilar"', '"korunacak"', '"istenmeyen"']) {
    assert.ok(studioSrc.includes(f), "taslak alanı: " + f);
  }
  // Bu prompt bir taslak briefi; senaryo/seslendirme/prompt üretim talimatı içermez
  assert.ok(!/prepareDraft[\s\S]*?seslendirme_notu/.test(studioSrc.slice(studioSrc.indexOf("async prepareDraft"), studioSrc.indexOf("async prepareDraft") + 2000)), "taslak promptu tam üretim istemez");
});

test("Kullanıcının temel fikri DEĞİŞTİRİLMEZ, yalnız düzenlenip netleştirilir", () => {
  assert.ok(studioSrc.includes("TEMEL FİKRİNİ ASLA DEĞİŞTİRME"), "fikir korunur talimatı");
  assert.ok(studioSrc.includes("yalnızca düzenle, netleştir ve yapılandır"), "yalnız netleştirme");
  assert.ok(studioSrc.includes("Uydurma büyük olaylar EKLEME"), "uydurma olay eklenmez");
});

test("Taslak ekranı butonları: Bu taslak doğru · Ayrıntı ekle · AI ile geliştir · Farklı taslak üret", () => {
  assert.ok(studioSrc.includes("Bu taslak doğru"), "onay butonu");
  assert.ok(studioSrc.includes("Ayrıntı ekle"), "ayrıntı ekle butonu");
  assert.ok(studioSrc.includes("AI ile geliştir"), "AI ile geliştir butonu");
  assert.ok(studioSrc.includes("Farklı taslak üret"), "farklı taslak butonu");
  assert.ok(studioSrc.includes("draftEnrich: () => this.prepareDraft('enrich')"), "geliştir → enrich varyantı");
  assert.ok(studioSrc.includes("draftVariant: () => this.prepareDraft('variant')"), "farklı → variant varyantı");
});

test("'Bu taslak doğru' mevcut sahne üretim (seçenekler) ekranına geçer", () => {
  assert.ok(studioSrc.includes("approveDraft()"), "approveDraft metodu");
  // step:2 = mevcut ADIM 2 · SEÇENEKLER ekranı (yeni ekran değil)
  assert.ok(/approveDraft\(\)[\s\S]*?step: 2/.test(studioSrc), "onay adım 2'ye geçirir");
  assert.ok(studioSrc.includes("ONAYLANMIŞ TASLAK"), "taslak brief olarak custom'a katlanır");
});

test("BACKEND AKIŞI DEĞİŞMEDİ: taslak custom (ÖZEL İSTEK) alanına katlanır, yeni endpoint yok", () => {
  // approveDraft taslağı mevcut 'custom' alanına yazar; buildPrompt bunu zaten okur
  assert.ok(/approveDraft\(\)[\s\S]*?custom:/.test(studioSrc), "onay custom alanını günceller");
  // Ücretsiz metin üretimi: action boş → 0 kredi (mevcut backend kuralı, değişmedi)
  assert.ok(indexSrc.includes("diğer/boş -> 0 (ücretsiz)"), "action'sız üretim ücretsiz (backend kuralı)");
  // index.ts'e taslağa özel yeni bir action/dal EKLENMEDİ
  assert.ok(!indexSrc.includes('"taslak"') && !indexSrc.includes("act === \"draft\""), "backend'e taslak dalı eklenmedi");
});

// ── (B) SAF AYNALAR — taslak mantığı ────────────────────────────────────────
// draftFields aynası: yalnız DOLU alanlar gösterilir
function draftFields(d) {
  const arr = (x) => Array.isArray(x) ? x.filter(Boolean).join(' · ') : (x || '');
  return [
    ['ANA FİKİR', d.ana_fikir || ''],
    ['BAKIŞ AÇISI', d.bakis_acisi || ''],
    ['BAŞLANGIÇ', d.baslangic || ''],
    ['GELİŞME', d.gelisme || ''],
    ['FİNAL', d.final || ''],
    ['ÖNEMLİ AYRINTILAR', arr(d.onemli_ayrintilar)],
    ['KORUNACAK UNSURLAR', arr(d.korunacak)],
    ['İSTENMEYEN UNSURLAR', arr(d.istenmeyen)]
  ].filter(x => x[1]).map(([label, value]) => ({ label, value }));
}
test("Ayna: boş alanlar taslak ekranında gizlenir", () => {
  const f = draftFields({ ana_fikir: 'X', bakis_acisi: '', onemli_ayrintilar: ['a', '', 'b'] });
  assert.deepEqual(f.map(x => x.label), ['ANA FİKİR', 'ÖNEMLİ AYRINTILAR']);
  assert.equal(f[1].value, 'a · b');
});
test("Ayna: sekiz alan da doluysa hepsi listelenir", () => {
  const full = { ana_fikir: '1', bakis_acisi: '2', baslangic: '3', gelisme: '4', final: '5', onemli_ayrintilar: ['6'], korunacak: ['7'], istenmeyen: ['8'] };
  assert.equal(draftFields(full).length, 8);
});

// approveDraft brief aynası: custom'a katlama davranışı
function foldBrief(d, cur) {
  const arr = (x) => Array.isArray(x) && x.length ? x.join('; ') : '';
  const brief = [
    'ONAYLANMIŞ TASLAK (bu çerçeveye SADIK kal, kullanıcının fikrini değiştirme):',
    d.ana_fikir ? '• Ana fikir: ' + d.ana_fikir : '',
    arr(d.korunacak) ? '• Korunacak: ' + arr(d.korunacak) : ''
  ].filter(Boolean).join('\n');
  return cur ? (cur + '\n\n' + brief) : brief;
}
test("Ayna: mevcut ÖZEL İSTEK varsa taslak brief'i üstüne eklenir, ezmez", () => {
  const out = foldBrief({ ana_fikir: 'Fatih', korunacak: ['zehir şüphesi'] }, '16:9 yatay');
  assert.ok(out.startsWith('16:9 yatay'), "eski istek korunur");
  assert.ok(out.includes('ONAYLANMIŞ TASLAK'), "taslak brief eklenir");
  assert.ok(out.includes('Fatih'), "ana fikir taşınır");
});
test("Ayna: taslak varyant talimatı temel fikri korur", () => {
  const varLine = (v) => v === 'variant'
    ? 'AYNI temel fikri koruyarak FARKLI'
    : v === 'enrich' ? 'temel fikri ve niyeti DEĞİŞTİRME' : '';
  assert.ok(varLine('variant').includes('AYNI temel fikri'));
  assert.ok(varLine('enrich').includes('DEĞİŞTİRME'));
  assert.equal(varLine('base'), '');
});
