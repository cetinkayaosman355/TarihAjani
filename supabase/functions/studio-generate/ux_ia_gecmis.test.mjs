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
test("Sol menü: ÜRET / ARŞİV bilgi mimarisi", () => {
  assert.ok(studioSrc.includes(">ÜRET<"), "ÜRET grubu başlığı");
  assert.ok(studioSrc.includes(">ARŞİV<"), "ARŞİV grubu başlığı");
  for (const item of ["Hikâye", "Görsel", "Dosyalar", "Görseller", "Videolar"]) {
    assert.ok(studioSrc.includes("> " + item + "<") || studioSrc.includes(">" + item + "<"), "menü öğesi: " + item);
  }
  assert.ok(studioSrc.includes("goHistFiles") && studioSrc.includes("goHistImages") && studioSrc.includes("goHistVideos"), "arşiv sekmelerine gidiş");
});
test("Geçmiş Üretimler: 3 sekme (Dosyalar/Görseller/Videolar) + varsayılan Dosyalar", () => {
  assert.ok(studioSrc.includes("histTab: 'files'"), "varsayılan sekme Dosyalar");
  assert.ok(studioSrc.includes("isHistFiles") && studioSrc.includes("isHistImages") && studioSrc.includes("isHistVideos"), "sekme bayrakları");
  assert.ok(studioSrc.includes("histTabFiles") && studioSrc.includes("histTabImages") && studioSrc.includes("histTabVideos"), "sekme geçiş handler'ları");
});
test("Görseller sekmesi: studio_images kaynağı + 3 filtre + grid", () => {
  assert.ok(studioSrc.includes("_histImageCards()"), "kaynak srvImages (studio_images)");
  assert.ok(studioSrc.includes("imgFilterAll") && studioSrc.includes("imgFilterStory") && studioSrc.includes("imgFilterStandalone"), "Tümü/Hikâye/Bağımsız filtreleri");
  assert.ok(studioSrc.includes("Hikâye Görselleri") && studioSrc.includes("Bağımsız Görseller"), "filtre etiketleri");
  assert.ok(studioSrc.includes("repeat(auto-fill, minmax(230px"), "görsel-ağırlıklı grid");
  assert.ok(studioSrc.includes("↻ YENİDEN") && studioSrc.includes("⬇ İNDİR"), "kart aksiyonları İndir/Yeniden Kullan");
});
test("Videolar sekmesi: premium boş durum + yeni backend yok", () => {
  assert.ok(studioSrc.includes("Henüz video üretimi yok."), "premium boş durum");
  assert.ok(studioSrc.includes("_histVideoCards()"), "video kartları mevcut kayıtlardan");
});
test("Dosyalar kartı: kapak önizleme + sahne/görsel sayısı + son sağlayıcı", () => {
  assert.ok(studioSrc.includes("hasCover") && studioSrc.includes("coverUrl"), "kapak önizleme");
  assert.ok(studioSrc.includes("sceneInfo") && studioSrc.includes("provInfo"), "sahne/görsel sayısı + sağlayıcı");
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
