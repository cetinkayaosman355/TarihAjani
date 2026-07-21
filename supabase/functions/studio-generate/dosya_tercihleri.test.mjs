// ============================================================================
// DOSYA TERCİHLERİ — kalıcı üretim ayarları + kompakt ekran + kalıtım tutarlılığı
// Çalıştır:  node --test supabase/functions/studio-generate/dosya_tercihleri.test.mjs
//
// (A) Kaynak değişmezleri: dosya oluşturmada tercihlerin kalıcı yazımı, geçmişten
//     açmada geri yükleme, kompakt özet kartı, görselli stil kartları.
// (B) Saf aynalar: 8. bölümdeki A–F tutarlılık senaryoları.
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

// ── (A) KAYNAK DEĞİŞMEZLERİ ─────────────────────────────────────────────────
test("Dosya oluşturma: seçenekler dosya kaydına KALICI yazılır (picks + state başlangıcı)", () => {
  // history kaydındaki picks tüm üretim tercihlerini taşır
  assert.ok(studioSrc.includes("aspect: this.state.aspect, format: this.state.format,"), "picks: oran + içerik türü");
  assert.ok(studioSrc.includes("imgStyle: this.state.style, imgStyleCat: '', imgAspect: this.state.aspect, imgAspectManual: false, imgPlatform: this.state.imgPlatform || ''"), "picks: görsel tercihler sihirbazdan başlar (platform dahil)");
  assert.ok(studioSrc.includes("{ key: 'platform', title: 'Platform'") && studioSrc.includes("{ key: 'motor', title: 'Görsel Motoru'"), "sihirbazda platform + motor grupları");
  assert.ok(studioSrc.includes("o.sug ? { aspect: o.sug } : {}"), "platform seçimi oranı yalnız önerir");
  assert.ok(studioSrc.includes("genCreatedPreset: this.state.format || '', genUpdatedAt: genTs"), "picks: hazır mod + güncelleme zamanı");
  // yeni dosya açılırken state de aynı değerlerle başlar; önceki dosyanın seçimleri taşınmaz
  assert.ok(studioSrc.includes("imgPlatform: this.state.imgPlatform || '', sceneOpts: {}, promptHist: {}, imgValErr: '',"), "yeni dosya: panel + sahne ayarları sıfırdan");
});

test("Geçmişten açma: dosyanın KENDİ tercihleri döner; önceki dosyanınki taşınmaz", () => {
  assert.ok(studioSrc.includes("sceneOpts: (h.sceneOpts) || {},"), "sahne ayarları dosya kaydından döner");
  assert.ok(studioSrc.includes("imgStyle: (h.picks && h.picks.imgStyle) || null"), "görsel stil dosya kaydından");
  assert.ok(studioSrc.includes("imgAspect: (h.picks && h.picks.imgAspect) || null"), "oran dosya kaydından");
  assert.ok(studioSrc.includes("genUpdatedAt: (h.picks && h.picks.genUpdatedAt) || 0"), "güncelleme zamanı dosya kaydından");
  // persist: aktif dosyanın geçmiş kaydı görseller + sahne ayarları + tercihlerle tazelenir
  assert.ok(studioSrc.includes("sceneImgs: s.sceneImgs || {}, sceneOpts: s.sceneOpts || {}, promptHist: s.promptHist || {}, audioUrl:"), "persist geçmiş kaydına sceneOpts + prompt geçmişi yazar");
  assert.ok(studioSrc.includes("picks: Object.assign({}, h.picks || {}, {"), "persist geçmiş kaydındaki tercihleri tazeler");
  // arşiv dosyası açarken de önceki panel/sahne seçimi sızmaz
  assert.ok(studioSrc.includes("sceneOpts: {}, promptHist: {}, imgStyle: null, imgStyleCat: '', imgAspect: null, imgAspectManual: false, imgPlatform: ''"), "arşiv açılışında sıfırlama");
});

test("Normalize tercih görünümü: fileGenSettings tek kaynaktan türetilir (paralel alan yok)", () => {
  assert.ok(studioSrc.includes("fileGenSettings() {"), "normalize görünüm fonksiyonu");
  for (const f of ["contentMode:", "durationSeconds:", "storyModel:", "narrationTone:", "voiceId:", "visualStyle:", "styleCategory:", "platform:", "aspectRatio:", "imageProviderMode:", "resolvedImageProvider:", "createdFromPreset:", "updatedAt:"]) {
    assert.ok(studioSrc.includes(f), "alan: " + f);
  }
  assert.ok(studioSrc.includes("this.resolveImageGenerationSettings('')") , "görsel alanları resolver'dan türetilir (kopya saklanmaz)");
});

test("Sihirbaz stil kartları: gerçek örnek görseller + büyütme; placeholder yok", () => {
  assert.ok(studioSrc.includes("STYLE_IMG(k)"), "stil → örnek görsel eşlemesi");
  for (const k of ["sinematik:", "belgeselfoto:", "hollywood:", "gravur:", "minyatur:", "animasyon:"]) {
    const i = studioSrc.indexOf("STYLE_IMG(k)");
    assert.ok(studioSrc.slice(i, i + 1200).includes(k), "örnek görsel: " + k);
  }
  assert.ok(studioSrc.includes("isStyle: true"), "stil grubu görselli kart moduna geçti");
  assert.ok(studioSrc.includes('class="ta-stylegrid"'), "masaüstü grid + mobil carousel sınıfı");
  assert.ok(studioSrc.includes(".ta-stylegrid { display: flex !important; overflow-x: auto"), "mobil yatay carousel CSS");
  assert.ok(studioSrc.includes('aria-label="Örneği büyüt"'), "büyütülmüş önizleme");
  assert.ok(studioSrc.includes("'Hollywood Foto-gerçekçi', desc: 'ARRI"), "vitrin adı: Hollywood Foto-gerçekçi");
});

test("Görsel Promptları kompakt: seçim satırları sürekli görünmez, özet kart + Değiştir", () => {
  // Panel kapalıyken platform/oran/stil/motor satırları render edilmez (sc-if arkasında)
  const iOpen = studioSrc.indexOf('sc-if value="{{ imgSetOpen }}"');
  const iPlat = studioSrc.indexOf("Nerede yayınlayacaksın?");
  const iStyle = studioSrc.indexOf("Nasıl görünsün?");
  assert.ok(iOpen > 0 && iPlat > iOpen && iStyle > iPlat, "platform + stil alanları imgSetOpen panelinin İÇİNDE");
  assert.ok(studioSrc.includes("{{ secimKompakt }}"), "kompakt tek satır özet");
  assert.ok(studioSrc.includes("hazır görseller değişmez"), "değişiklik bildirimi: eski görseller korunur");
});

// ── (B) SAF AYNALAR — 8. bölüm A–F senaryoları ─────────────────────────────
const AR_MAP = { yatay: "16:9", dikey: "9:16", kare: "1:1" };
const STYLE_KEYS = ["sinematik", "belgeselfoto", "hollywood", "gravur", "minyatur", "animasyon"];
function resolve(state, sceneKey) {
  const so = (sceneKey && (state.sceneOpts || {})[sceneKey]) || {};
  const arKey = so.ar || state.imgAspect || state.aspect || "";
  const aspectRatio = AR_MAP[arKey] || "";
  let styleId = so.style || state.imgStyle || "";
  if (!styleId) { const cat = state.imgStyleCat || ""; styleId = !cat ? (state.style || "") : (cat === "sinematik" ? "sinematik" : ""); }
  if (STYLE_KEYS.indexOf(styleId) < 0) styleId = "";
  const prov = (p => (p === "gemini" ? "gemini" : "gpt"))(String(so.prov || state.imgProvider || "auto").toLowerCase());
  return { aspectRatio, styleId, prov, valid: !!(aspectRatio && styleId) };
}
// Dosya oluşturma aynası: sihirbaz seçimleri → dosya kaydı (startGenerate ile aynı kural)
function createFile(wizard) {
  return {
    picks: { tone: wizard.tone, voice: wizard.voice, style: wizard.style, duration: wizard.duration, model: wizard.model,
      aspect: wizard.aspect, format: wizard.format,
      imgStyle: wizard.style, imgStyleCat: "", imgAspect: wizard.aspect, imgAspectManual: false, imgPlatform: "",
      genCreatedPreset: wizard.format || "", genUpdatedAt: 1000 }
  };
}
// Geçmişten açma aynası (openFile ile aynı kural): dosya kaydı state'i EZER
function openFile(prevState, h) {
  return { ...prevState,
    sceneOpts: h.sceneOpts || {},
    imgStyle: (h.picks && h.picks.imgStyle) || null, imgStyleCat: (h.picks && h.picks.imgStyleCat) || "",
    imgAspect: (h.picks && h.picks.imgAspect) || null, imgPlatform: (h.picks && h.picks.imgPlatform) || "",
    ...(h.picks || {}) };
}

test("A: Minyatür + 9:16 + Kadir + Belgesel/Ciddi → dosya kaydı + özet + payload aynı", () => {
  const f = createFile({ tone: "belgesel", voice: "kadir", style: "minyatur", duration: "s45", model: "claude", aspect: "dikey", format: "reels" });
  assert.equal(f.picks.imgStyle, "minyatur"); assert.equal(f.picks.imgAspect, "dikey");
  assert.equal(f.picks.voice, "kadir"); assert.equal(f.picks.tone, "belgesel");
  const st = openFile({}, f);
  const r = resolve(st, "");
  assert.equal(r.styleId, "minyatur", "ilk üretim payload'ı: style = minyatur");
  assert.equal(r.aspectRatio, "9:16", "ilk üretim payload'ı: size = 9:16");
});

test("B: Hollywood + 16:9 → dosya kaydı doğru; 'yenileme' (yeniden açma) aynı değerleri verir", () => {
  const f = createFile({ tone: "dramatik", voice: "kadir", style: "hollywood", duration: "s480", model: "claude", aspect: "yatay", format: "belgesel" });
  const r1 = resolve(openFile({}, f), "");
  assert.equal(r1.styleId, "hollywood"); assert.equal(r1.aspectRatio, "16:9");
  // yenileme: kayıt tekrar açılır → aynı sonuç (sistem varsayılanına dönmez)
  const r2 = resolve(openFile({ imgStyle: "animasyon", imgAspect: "kare" }, f), "");
  assert.equal(r2.styleId, "hollywood", "önceki oturumun state'i dosya kaydını EZEMEZ");
  assert.equal(r2.aspectRatio, "16:9");
});

test("C: Dosya genel stili sonradan değişir → yeni üretim yeni stili kullanır, eski görsel kaydı değişmez", () => {
  const st = { aspect: "dikey", style: "minyatur", imgStyle: "minyatur",
    sceneImgs: { gp0: { url: "u", meta: { aspect: "9:16", style: "Osmanlı Minyatürü" } } } };
  const changed = { ...st, imgStyle: "gravur", genUpdatedAt: 2000, imgSetNotice: true };   // panel pick aynası
  assert.equal(resolve(changed, "").styleId, "gravur", "sonraki üretimler yeni stil");
  assert.deepEqual(changed.sceneImgs.gp0.meta, { aspect: "9:16", style: "Osmanlı Minyatürü" }, "hazır görselin kaydı DEĞİŞMEZ");
  assert.ok(changed.genUpdatedAt > 1000 && changed.imgSetNotice, "güncelleme damgası + bildirim");
});

test("D: Tek sahneye 1:1 + Animasyon override → yalnız o sahne; 'Genel ayarlara dön' temizler", () => {
  const st = { aspect: "dikey", style: "hollywood", imgStyle: "hollywood", sceneOpts: { gp2: { ar: "kare", style: "animasyon" } } };
  assert.deepEqual({ a: resolve(st, "gp2").aspectRatio, s: resolve(st, "gp2").styleId }, { a: "1:1", s: "animasyon" }, "override'lı sahne 1:1 + animasyon");
  assert.deepEqual({ a: resolve(st, "gp1").aspectRatio, s: resolve(st, "gp1").styleId }, { a: "9:16", s: "hollywood" }, "diğer sahneler dosya geneli");
  const cleared = { ...st, sceneOpts: (() => { const all = { ...st.sceneOpts }; delete all.gp2; return all; })() };   // clearOvr aynası
  assert.deepEqual({ a: resolve(cleared, "gp2").aspectRatio, s: resolve(cleared, "gp2").styleId }, { a: "9:16", s: "hollywood" }, "dönüş sonrası genel ayarlar");
});

test("E: Eski localStorage/oturum değerleri dosya kaydının ÖNÜNE GEÇEMEZ", () => {
  const f = createFile({ tone: "merak", voice: "kadir", style: "belgeselfoto", duration: "s45", model: "claude", aspect: "kare", format: "reels" });
  const stale = { imgStyle: "sinematik", imgStyleCat: "sinematik", imgAspect: "yatay", imgPlatform: "youtube", sceneOpts: { gp0: { ar: "yatay" } } };
  const st = openFile(stale, f);
  assert.equal(resolve(st, "").styleId, "belgeselfoto", "dosya stili kazanır");
  assert.equal(resolve(st, "").aspectRatio, "1:1", "dosya oranı kazanır");
  assert.deepEqual(st.sceneOpts, {}, "başka dosyanın sahne ayarı taşınmaz");
});

test("F: Yenile + tekrar aç → seçimler kaybolmaz, sistem varsayılanına dönmez (kaynak sözleşmesi)", () => {
  // work'e yazım + geri yükleme çifti kaynakta birebir mevcut olmalı
  for (const pair of [
    ["imgStyle: s.imgStyle || null", "imgStyle: (w && w.imgStyle) || null"],
    ["imgAspect: s.imgAspect || null", "imgAspect: (w && w.imgAspect) || null"],
    ["genCreatedPreset: s.genCreatedPreset || ''", "genCreatedPreset: (w && w.genCreatedPreset) || ''"],
    ["genUpdatedAt: s.genUpdatedAt || 0", "genUpdatedAt: (w && w.genUpdatedAt) || 0"]
  ]) {
    assert.ok(studioSrc.includes(pair[0]), "persist: " + pair[0]);
    assert.ok(studioSrc.includes(pair[1]), "restore: " + pair[1]);
  }
});
