// ============================================================================
// PR-1 UX — Bilgi mimarisi (ÜRET/ARŞİV) + Geçmiş Üretimler 3 sekme + grid/filtre
// Çalıştır:  node supabase/functions/studio-generate/ux_ia_gecmis.test.mjs
//
// Yalnız frontend sunum. Backend/queue/kredi/metadata davranışı KORUNUR.
// (A) Kaynak değişmezleri (Studio.dc.html). (B) Saf filtre/güvenli-dönüşüm aynaları.
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

// ── (A) Kaynak değişmezleri ─────────────────────────────────────────────────
test("Sol menü: ÜRET / ÇALIŞMALARIM / KEŞFET bilgi mimarisi", () => {
  assert.ok(studioSrc.includes(">ÜRET<"), "ÜRET grubu başlığı");
  assert.ok(studioSrc.includes(">ÇALIŞMALARIM<"), "ÇALIŞMALARIM grubu başlığı (ARŞİV değil)");
  assert.ok(studioSrc.includes(">KEŞFET<"), "KEŞFET grubu");
  for (const item of ["Hikâye", "Görsel", "Dosyalarım", "Görsellerim", "Videolarım", "Seslerim", "Hazır Hikâye Arşivi"]) {
    assert.ok(studioSrc.includes(item), "menü öğesi: " + item);
  }
  // ÜRET: Video/Ses "Yakında" ERİŞİLEBİLİR DISABLED (tıklanır görünmez); Hazır Hikâye Arşivi KEŞFET'te
  assert.ok(studioSrc.includes("soonDisabled: true") && studioSrc.includes('disabled="{{ soonDisabled }}"') && studioSrc.includes('aria-disabled="{{ soonDisabled }}"'), "Video/Ses erişilebilir disabled (Yakında)");
  assert.ok(studioSrc.includes(".ta-navbtn:disabled") && studioSrc.includes(".ta-navbtn:disabled:hover"), "disabled hover affordance kaldırıldı");
  assert.ok(!studioSrc.includes("uretYakinda"), "pasif öğede tıklama handler'ı yok");
  assert.ok(studioSrc.includes("goHistFiles") && studioSrc.includes("goHistImages") && studioSrc.includes("goHistVideos") && studioSrc.includes("goHistSounds"), "çalışmalarım sekmelerine gidiş");
});
test("Senkron: sol menü aktif-durumu ve in-page sekme AYNI state'ten (histTab)", () => {
  // sideGorsellerActive ve histTabImagesStyle ikisi de s.histTab === 'images'e bağlı → daima senkron
  assert.ok(studioSrc.includes("sideGorsellerActive: (s.mode === 'history' && s.histTab === 'images')"), "sol menü aktif = histTab");
  assert.ok(studioSrc.includes("histTabImagesStyle: this._tabStyle(s.histTab === 'images')"), "in-page sekme = histTab");
  assert.ok(studioSrc.includes("sideSeslerimActive: (s.mode === 'history' && s.histTab === 'sounds')"), "Seslerim aktif = histTab");
});
test("Mobil erişim: sol menü gizliyken alt bardan Çalışmalarım'a ulaşılır + in-page sekmeler render", () => {
  assert.ok(studioSrc.includes('onClick="{{ modeHistory }}"') && studioSrc.includes("ÇALIŞMAM"), "mobil alt bar Çalışmalarım'a gider");
  // in-page sekmeler <main> içinde (mobilde de görünür) + yatay kaydırma
  assert.ok(studioSrc.includes("overflow-x: auto"), "sekmeler mobilde yatay kaydırılır (erişim kaybolmaz)");
});
test("Çalışmalarım: 4 sekme (Dosyalarım/Görsellerim/Videolarım/Seslerim) + varsayılan Dosyalarım + sayaç", () => {
  assert.ok(studioSrc.includes("histTab: 'files'"), "varsayılan sekme Dosyalarım");
  assert.ok(studioSrc.includes("isHistFiles") && studioSrc.includes("isHistImages") && studioSrc.includes("isHistVideos") && studioSrc.includes("isHistSounds"), "sekme bayrakları");
  assert.ok(studioSrc.includes("histTabSounds"), "Seslerim sekme handler'ı");
  assert.ok(studioSrc.includes("Dosyalarım ({{ histFilesCount }})") && studioSrc.includes("Seslerim ({{ histSoundsCount }})"), "sekme adı yanında kayıt sayısı");
  assert.ok(studioSrc.includes("overflow-x: auto") && studioSrc.includes("whiteSpace: 'nowrap'"), "mobilde sekmeler yatay kaydırılır");
  assert.ok(studioSrc.includes(">Çalışmalarım<"), "sayfa başlığı Çalışmalarım (Geçmiş Üretimler değil)");
});
test("Görsellerim sekmesi: studio_images kaynağı + 3 filtre + grid + başlık 2 satır", () => {
  assert.ok(studioSrc.includes("_histImageCards()"), "kaynak srvImages (studio_images)");
  assert.ok(studioSrc.includes("imgFilterAll") && studioSrc.includes("imgFilterStory") && studioSrc.includes("imgFilterStandalone"), "Tümü/Hikâye/Bağımsız filtreleri");
  assert.ok(studioSrc.includes("Hikâye Görselleri") && studioSrc.includes("Bağımsız Görseller"), "filtre etiketleri");
  assert.ok(studioSrc.includes("repeat(auto-fill, minmax(230px"), "görsel-ağırlıklı grid");
  assert.ok(studioSrc.includes("↻ YENİDEN") && studioSrc.includes("⬇ İNDİR"), "kart aksiyonları İndir/Yeniden Kullan");
  assert.ok(studioSrc.includes("-webkit-line-clamp: 2"), "görsel kartı başlığı en fazla 2 satır");
});
test("Videolarım/Seslerim: premium boş durum + yeni backend yok", () => {
  assert.ok(studioSrc.includes("Henüz video üretimi yok."), "video premium boş durum");
  assert.ok(studioSrc.includes("Henüz kaydedilmiş ses üretimin yok."), "ses premium boş durum");
  assert.ok(studioSrc.includes("_histVideoCards()") && studioSrc.includes("_histSoundCards()"), "video/ses kartları mevcut kayıtlardan");
});
test("Dosya kartı: kapak önizleme + sahne/görsel sayısı + son gerçek model + nötr Sil", () => {
  assert.ok(studioSrc.includes("hasCover") && studioSrc.includes("coverUrl"), "kapak önizleme");
  assert.ok(studioSrc.includes("sceneInfo") && studioSrc.includes("provInfo"), "sahne/görsel sayısı + sağlayıcı");
  assert.ok(studioSrc.includes("lastModel") && studioSrc.includes("this._modelLabel(lastModelRaw)"), "son kullanılan gerçek model (kullanıcı-dostu)");
  // Sil butonu varsayılan nötr, hover'da kırmızı
  assert.ok(studioSrc.includes("color: #8a8f9c; cursor: pointer; font-size: 14px") && studioSrc.includes('style-hover="border-color: rgba(192,57,43,.55); color: #e08a80'), "Sil nötr→kırmızı hover");
});
test("Sil/Yeniden Kullan backend'e dokunmaz (görünümden gizle + prompt taşı)", () => {
  assert.ok(studioSrc.includes("ta_studio_hidden_v1") && studioSrc.includes("hideImage("), "Sil = cihaz-yerel gizleme (Storage silinmez)");
  assert.ok(studioSrc.includes("reuseImage(") && studioSrc.includes("imgPrompt: x.prompt"), "Yeniden Kullan = promptu Görsel Stüdyo'ya taşı");
});
test("Okunabilirlik: nav/başlık class font'ları büyütüldü (sınıf-tabanlı, güvenli)", () => {
  assert.ok(studioSrc.includes("font-size: 14.5px; font-weight: 500"), "nav butonu ≥14px");
  assert.ok(studioSrc.includes("font-size: 10px;\n      letter-spacing: .18em"), "başlık 8.5→10px, aralık düşürüldü");
});

// ── (B) Saf filtre + güvenli dönüşüm aynaları ───────────────────────────────
function filterImgs(list, f) {
  if (f === "story") return list.filter(x => x.kind !== "standalone" && x.fileId);
  if (f === "standalone") return list.filter(x => x.kind === "standalone" || !x.fileId);
  return list;
}
test("Görsel filtresi: Hikâye = story_id var, Bağımsız = story_id yok", () => {
  const list = [
    { url: "a", kind: "scene", fileId: "F1" },
    { url: "b", kind: "cover", fileId: "F1" },
    { url: "c", kind: "standalone", fileId: "" },
    { url: "d", kind: "standalone" },
  ];
  assert.equal(filterImgs(list, "all").length, 4);
  assert.deepEqual(filterImgs(list, "story").map(x => x.url), ["a", "b"], "Hikâye Görselleri");
  assert.deepEqual(filterImgs(list, "standalone").map(x => x.url), ["c", "d"], "Bağımsız Görseller");
});

function cardOf(x) {
  const m = x.meta || {};
  const dash = (v) => (v === undefined || v === null || v === "") ? "-" : String(v);
  const mn = x.sceneKey && /\d+/.test(x.sceneKey) ? (parseInt((x.sceneKey.match(/\d+/) || ["0"])[0], 10) + 1) : null;
  const sceneLbl = x.kind === "cover" ? "Kapak" : (mn ? ("Sahne " + mn) : (x.kind === "standalone" ? "Bağımsız" : "-"));
  return {
    title: x.story || (x.kind === "standalone" || !x.fileId ? "Bağımsız Görsel" : "-"),
    sceneLabel: sceneLbl, provider: dash(m.provider), style: dash(m.style), aspect: dash(m.aspect),
  };
}
test("EKSİK metadata kaydı GİZLENMEZ; eksik alanlar '-' (ekran çökmez)", () => {
  assert.doesNotThrow(() => cardOf({ url: "x" }));
  const c = cardOf({ url: "x", kind: "standalone" });
  assert.equal(c.title, "Bağımsız Görsel");
  assert.equal(c.provider, "-");
  assert.equal(c.style, "-");
  const s = cardOf({ url: "y", kind: "scene", sceneKey: "gp4", story: "Fatih", meta: { provider: "GPT" } });
  assert.equal(s.title, "Fatih");
  assert.equal(s.sceneLabel, "Sahne 5", "gp4 → Sahne 5 (0-tabanlı+1)");
  assert.equal(s.provider, "GPT");
  assert.equal(cardOf({ url: "z", kind: "cover" }).sceneLabel, "Kapak");
});
