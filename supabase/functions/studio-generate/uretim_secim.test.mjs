// ============================================================================
// KOMPAKT AYAR SATIRI + ÜRETİM ÇIKTI SEÇİMİ + "BEN HİKAYEMİ YAZACAĞIM" MODU
// Çalıştır:  node --test supabase/functions/studio-generate/uretim_secim.test.mjs
// (A) Kaynak değişmezleri (Studio.dc.html)  (B) Saf aynalar: çıktı gating mantığı
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
test("Genel Görsel Ayarları KOMPAKT tek satır: motor | oran | stil + Değiştir", () => {
  assert.ok(studioSrc.includes("secimKompakt:"), "kompakt tek satır VM");
  assert.ok(studioSrc.includes("].join('  |  ')"), "satır ' | ' ile birleşir");
  assert.ok(studioSrc.includes("{{ secimKompakt }}"), "markup kompakt satırı gösterir");
  // Eski çok satırlı kart (GENEL GÖRSEL AYARLARI etiketi + Görsel motoru satırı) kalktı
  assert.ok(!studioSrc.includes(">GENEL GÖRSEL AYARLARI</span>"), "eski büyük başlıklı kart kalktı");
  assert.ok(studioSrc.includes("{{ imgSetLinkLabel }}"), "Değiştir/Kapat bağlantısı korunur");
  assert.ok(studioSrc.includes('sc-if value="{{ imgSetOpen }}"'), "Değiştir paneli aynen korunur");
});

test("Üretim çıktı seçimi: Hikaye zorunlu taban (kilitli); diğerleri serbest kutucuk", () => {
  assert.ok(studioSrc.includes("genOutputs: { gorsel: true, ses: false, video: false, thumb: false }"), "varsayılan: Görsel Prompt açık, diğerleri kapalı");
  assert.ok(studioSrc.includes("genOutputOpts:"), "çıktı seçici VM");
  for (const l of ["'Hikaye'", "'Görsel Prompt'", "'Seslendirme'", "'Video Prompt'", "'Thumbnail'"]) {
    assert.ok(studioSrc.includes(l), "kutucuk: " + l);
  }
  assert.ok(studioSrc.includes("['hikaye', 'Hikaye', true, true]"), "Hikaye kilitli-açık (taban)");
  assert.ok(studioSrc.includes("toggle: locked ? (() => {})"), "kilitli kutucuk değişmez");
  assert.ok(studioSrc.includes(">NELER ÜRETİLSİN?</p>"), "başlık kullanıcı dilinde");
  assert.ok(studioSrc.includes("Yalnız seçtiklerin üretilir."), "davranış açıklaması");
});

test("'Ben Hikayemi Yazacağım' modu: konu kutusu hikâye sayılır, ajan yeniden yazmaz", () => {
  assert.ok(studioSrc.includes("toggleOwnStory:"), "mod toggle");
  assert.ok(studioSrc.includes("Ben Hikayemi Yazacağım"), "mod adı");
  assert.ok(studioSrc.includes("ownStory: false,"), "varsayılan kapalı");
  // buildPrompt: mod açıkken 'yeniden yazma' talimatı + süre kilidi uygulanmaz
  assert.ok(studioSrc.includes('BEN HİKAYEMİ YAZDIM'), "prompt: özel mod talimatı");
  assert.ok(studioSrc.includes("YENİDEN YAZMA, süsleme, kısaltma"), "ajan metni değiştirmez");
  assert.ok(studioSrc.includes("SÜRE/KELİME kilidini UYGULAMA"), "kendi metninde süre kilidi yok");
  assert.ok(studioSrc.includes("sec >= 120 && !s.ownStory"), "kendi hikâyede iki-aşama genişletme (expandActs) kapalı");
});

test("buildPrompt çıktı sınırları: thumbnail yoksa kapak [], seslendirme yoksa not boş", () => {
  assert.ok(studioSrc.includes("if (!go.thumb) modeRules += '\\n\\nÇIKTI SINIRI: kapak dizisini BOŞ []"), "thumbnail off → kapak boş");
  assert.ok(studioSrc.includes("if (!go.ses) modeRules += "), "seslendirme off → seslendirme_notu boş");
  assert.ok(studioSrc.includes("return p + deferScenes + (outlineOnly ? summarize : '') + modeRules;"), "koşullar prompta eklenir");
});

test("Sahne aşaması gating: yalnız görsel/video istendiyse çalışır; istenmeyen dizi boşalır", () => {
  assert.ok(studioSrc.includes("if (go2.gorsel || go2.video) {"), "sahne aşaması yalnız gerekince");
  assert.ok(studioSrc.includes("if (!go2.gorsel) result.gorsel_promptlar = [];"), "görsel istenmezse boş");
  assert.ok(studioSrc.includes("if (!go2.video) result.video_promptlar = [];"), "video istenmezse boş");
  assert.ok(studioSrc.includes("if (!go2.thumb) result.kapak = [];"), "thumbnail istenmezse kapak boş");
});

test("KURAL KORUNDU: seslendirme SESİ bu ekranda üretilmez (TTS hep sonra, kullanıcı tetikler)", () => {
  assert.ok(studioSrc.includes("Seslendirmeyi Üret"), "seslendirme sesi ayrı, kullanıcı tetikli");
  assert.ok(studioSrc.includes('Seslendirme sesi burada üretilmez'), "ekranda açık uyarı");
  // Bu değişiklik backend üretim/kredi akışına dokunmadı
  assert.ok(indexSrc.includes("const outs = (b.outputs && b.outputs.length"), "backend outputs desteği zaten mevcut (değişmedi)");
});

// ── (B) SAF AYNALAR — çıktı gating mantığı ─────────────────────────────────
// startGenerate sahne aşaması aynası
function sceneStage(go) {
  const out = { gorsel: null, video: null, kapak: ["A", "B"] };
  if (go.gorsel || go.video) {
    out.gorsel = ["g"]; out.video = ["v"];          // genScenePrompts üretir
    if (!go.gorsel) out.gorsel = [];
    if (!go.video) out.video = [];
  } else { out.gorsel = []; out.video = []; }
  if (!go.thumb) out.kapak = [];
  return out;
}
test("Ayna: yalnız Görsel Prompt seçili → video ve thumbnail üretilmez", () => {
  const r = sceneStage({ gorsel: true, video: false, thumb: false });
  assert.deepEqual(r.gorsel, ["g"]); assert.deepEqual(r.video, []); assert.deepEqual(r.kapak, []);
});
test("Ayna: hiçbir görsel çıktı seçili değil → sahne aşaması hiç çalışmaz", () => {
  const r = sceneStage({ gorsel: false, video: false, thumb: false });
  assert.deepEqual(r.gorsel, []); assert.deepEqual(r.video, []);
});
test("Ayna: Görsel + Video + Thumbnail → hepsi üretilir", () => {
  const r = sceneStage({ gorsel: true, video: true, thumb: true });
  assert.deepEqual(r.gorsel, ["g"]); assert.deepEqual(r.video, ["v"]); assert.deepEqual(r.kapak, ["A", "B"]);
});
test("Ayna: yalnız Video Prompt seçili → görsel boş, video dolu", () => {
  const r = sceneStage({ gorsel: false, video: true, thumb: false });
  assert.deepEqual(r.gorsel, []); assert.deepEqual(r.video, ["v"]);
});
// ownStory → twoStage kapalı aynası
test("Ayna: ownStory açıkken 10 dk bile olsa iki-aşama (expandActs) çalışmaz", () => {
  const twoStage = (sec, own) => sec >= 120 && !own;
  assert.equal(twoStage(600, true), false, "kendi hikâyende genişletme yok");
  assert.equal(twoStage(600, false), true, "normal modda uzun video iki-aşama");
  assert.equal(twoStage(45, false), false, "kısa video tek aşama");
});
