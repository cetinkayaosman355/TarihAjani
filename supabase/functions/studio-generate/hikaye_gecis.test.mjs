// ============================================================================
// HİKÂYE GEÇİŞİ — sahne görselleri sızmaz (state bleed düzeltmesi)
// Bug: yeni hikâye üretilince eski hikâyenin sahne görselleri (gp0/gp1) Sahne 1'de
// kalıyordu — sceneImgs sıfırlanmıyordu. Sahne anahtarları dosyaya göre değil sıra
// numarasına göre (gp0..) olduğundan eski görsel yeni dosyada görünüyordu.
// Çalıştır: node --test supabase/functions/studio-generate/hikaye_gecis.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("Yeni üretim tamamlanınca sceneImgs SIFIRLANIR (eski hikâye görselleri sızmaz)", () => {
  // startGenerate tamamlanma setState'i: result/fileNo ile birlikte sahne durumu temizlenir
  const i = studioSrc.indexOf("generating: false, genPct: 100, result, fileNo: no");
  assert.ok(i > 0, "üretim tamamlanma bloğu bulunur");
  const blk = studioSrc.slice(i, i + 600);
  assert.ok(blk.includes("sceneImgs: {}"), "sahne GÖRSELLERİ sıfırlanır (bug düzeltmesi)");
  assert.ok(blk.includes("sceneOpts: {}") && blk.includes("promptHist: {}"), "sahne ayarı + prompt geçmişi de sıfırlanır");
});

test("newFile (BAŞTAN) da sceneImgs sıfırlar (tutarlılık)", () => {
  const i = studioSrc.indexOf("newFile: () => this.setState({");
  assert.ok(i > 0, "newFile handler bulunur");
  const blk = studioSrc.slice(i, i + 300);
  assert.ok(blk.includes("sceneImgs: {}"), "yeni dosya sahne görsellerini temizler");
});

test("Arşivden yükleme sahne görsellerini O dosyaya göre HİDRE eder (sızma yok)", () => {
  // _hydrateSceneImgs yalnız rec.fileId === fileNo olan sunucu görsellerini ekler
  assert.ok(studioSrc.includes("rec.fileId === fileNo && rec.sceneKey"), "hidrasyon dosya kimliğine göre filtreler");
  assert.ok(studioSrc.includes("sceneImgs: this._hydrateSceneImgs(a.fileNo, a.sceneImgs || {})"), "arşiv seçimi dosyaya özel sahne görseliyle yüklenir");
});
