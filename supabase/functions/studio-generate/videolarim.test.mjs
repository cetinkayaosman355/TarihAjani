// ============================================================================
// VİDEOLARIM — belgesel kalıcı kayıt + Belgesel bölümü + favoriler (Sprint 2)
// Belgesel tarayıcıda üretilir (blob); IndexedDB'ye Blob olarak yazılır → yenilemede
// Videolarım'da durur. Filtre: Tümü / Belgesel / Favoriler.
// Çalıştır: node --test supabase/functions/studio-generate/videolarim.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("Belgesel kalıcı kayıt: IndexedDB'ye Blob + yenilemede geri yükleme", () => {
  assert.ok(src.includes("async _saveBelgesel(blob"), "belgesel Blob kaydı");
  assert.ok(src.includes("belgesel: true, blob"), "kayıt Blob içerir (kalıcı)");
  // render başarısında kaydedilir
  assert.ok(src.includes("this._saveBelgesel(blob, this.state.aspect"), "render sonrası kaydeder");
  // yenilemede taze objectURL üretilir
  assert.ok(src.includes("r.belgesel && r.blob") && src.includes("URL.createObjectURL(r.blob)"), "yenilemede objectURL");
  assert.ok(src.includes("belgeselVids:"), "belgeselVids durumu");
});

test("Videolarım: Belgesel bölümü + favoriler + filtre (Tümü/Belgesel/Favoriler)", () => {
  assert.ok(src.includes("vidFilterChips"), "filtre çipleri");
  assert.ok(src.includes("['all', 'Tümü'], ['belgesel', '🎞 Belgesel'], ['fav', '★ Favoriler']"), "üç filtre");
  assert.ok(src.includes("filt === 'belgesel'") && src.includes("filt === 'fav'"), "filtre uygulanır");
  assert.ok(src.includes("_belgFav(x.id)"), "belgesel favori");
  assert.ok(src.includes("favToggle: () => (x.opId ? this._imgFlag"), "galeri videosu favori (sunucu)");
  assert.ok(src.includes(">BELGESEL<"), "belgesel rozeti kartta");
});

test("Filtre-farkında boş durumlar (yanlış 'hiç video yok' göstermez)", () => {
  assert.ok(src.includes("histVideosAny"), "toplam video var mı");
  assert.ok(src.includes("noFilteredVideos"), "filtre boşsa ayrı mesaj");
  assert.ok(src.includes("Bu filtrede video yok"), "filtre boş mesajı");
});
