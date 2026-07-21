// ============================================================================
// AŞAMA 3 — FAVORİ / ARŞİV / GÜVENLİ SİLME
// Çalıştır:  node --test supabase/functions/studio-generate/asama3_favori.test.mjs
// (A) Kaynak + migration değişmezleri  (B) Saf aynalar: bayrak defteri
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");
const mig = readFileSync(join(REPO, "supabase", "migrations", "20260721_gorsel_favori_arsiv.sql"), "utf8");

// ── (A) KAYNAK DEĞİŞMEZLERİ ─────────────────────────────────────────────────
test("Migration: yumuşak durumlar + RLS + kolon-izinli güncelleme (yalnız kendi satırları)", () => {
  for (const c of ["is_favorite boolean not null default false", "is_archived boolean not null default false", "deleted_at  timestamptz"]) {
    assert.ok(mig.includes(c), "kolon: " + c);
  }
  assert.ok(mig.includes('create policy "studio_images_update_flags_own"') && mig.includes("auth.uid() = user_id"), "RLS: yalnız kendi satırı");
  assert.ok(mig.includes("revoke update on public.studio_images from authenticated, anon"), "genel update izni yok");
  assert.ok(mig.includes("grant update (is_favorite, is_archived, deleted_at) on public.studio_images to authenticated"), "yalnız bayrak kolonları güncellenebilir");
  assert.ok(mig.includes("add column if not exists"), "tekrar çalıştırmak güvenli");
});

test("İstemci: bayraklar yüklenir; silinmişler listelenmez; kredi ucuna dokunulmaz", () => {
  assert.ok(studioSrc.includes("is_favorite,is_archived,deleted_at')"), "select bayrakları da çeker");
  assert.ok(studioSrc.includes(".is('deleted_at', null)"), "silinmiş kayıtlar sunucudan hiç gelmez");
  assert.ok(studioSrc.includes("async _imgFlag(opId, patch)"), "bayrak güncelleme fonksiyonu");
  const fn = studioSrc.slice(studioSrc.indexOf("async _imgFlag"), studioSrc.indexOf("_verFlag(key"));
  assert.ok(!fn.includes("action:") && !fn.includes("credits"), "bayrak işlemi kredi/üretim ucuna dokunmaz");
});

test("Sahne şeridi: arşivli/silinmiş görünmez; favori yıldızı thumb üzerinde; seçili fallback", () => {
  assert.ok(studioSrc.includes(".filter(x => x.v && !x.v.arch && !x.v.del)"), "şeritte yalnız aktif versiyonlar");
  assert.ok(studioSrc.includes("favToggle: (e) =>"), "yıldız thumb üzerinde");
  assert.ok(studioSrc.includes("const act = vers.filter(v => v && !v.arch && !v.del);"), "seçili kaldırılınca en yeni aktif versiyona düşülür");
  assert.ok(studioSrc.includes("url = nx ? nx.url : ''"), "hiç versiyon kalmazsa sahne görselsiz olur");
  assert.ok(studioSrc.includes("Görsel arşive taşındı"), "arşiv bildirimi");
  assert.ok(studioSrc.includes("imgUndoDo:"), "Geri Al aksiyonu");
  assert.ok(studioSrc.includes("🗄 Arşivle") && studioSrc.includes("🗑 Görseli Sil"), "menüde Arşivle ve Sil AYRI");
  assert.ok(studioSrc.includes("Bu görsel kalıcı olarak silinecek"), "silme onay metni");
});

test("Geçmiş Görseller: Favoriler + Arşiv filtreleri; varsayılanda arşivli/silinmiş yok; 'Arşivde' etiketi", () => {
  assert.ok(studioSrc.includes("★ Favoriler") && studioSrc.includes("🗄 Arşiv"), "filtre çipleri");
  assert.ok(studioSrc.includes("if (f === 'fav') list = list.filter(x => x.fav)"), "favori filtresi");
  assert.ok(studioSrc.includes("else if (f === 'arch') list = list.filter(x => x.arch)"), "arşiv filtresi");
  assert.ok(studioSrc.includes("list.filter(x => !x.arch)"), "varsayılan listelerde arşivli görünmez");
  assert.ok(studioSrc.includes("&& !x.del)"), "silinmişler hiçbir listede görünmez");
  assert.ok(studioSrc.includes("(f === 'fav' && x.arch) ? 'Arşivde' : ''"), "favori görünümünde 'Arşivde' etiketi");
  assert.ok(studioSrc.includes("'↩ ARŞİVDEN ÇIKAR' : '🗄 ARŞİVLE'"), "arşivden çıkarma aksiyonu");
});

// ── (B) SAF AYNALAR ─────────────────────────────────────────────────────────
function flag(rec, patch) { return { ...rec, ...patch }; }   // _imgFlag/_verFlag aynası
test("Ayna: favori + arşiv birlikte olabilir; işlemler idempotent; kredi alanı yok", () => {
  let r = { id: "a", fav: false, arch: false, del: false };
  r = flag(r, { fav: true });
  r = flag(r, { arch: true });
  assert.deepEqual({ fav: r.fav, arch: r.arch }, { fav: true, arch: true }, "aynı anda favori + arşiv");
  const again = flag(r, { fav: true });
  assert.deepEqual(again, r, "aynı bayrağı tekrar yazmak durumu değiştirmez (idempotent)");
});
test("Ayna: arşiv aktif şeritten çıkarır ama kayıt DURUR; arşivden çıkınca şeride döner", () => {
  let vers = [{ id: "a", url: "u1" }, { id: "b", url: "u2" }];
  vers = vers.map(v => v.id === "a" ? flag(v, { arch: true }) : v);
  const strip = vers.filter(v => !v.arch && !v.del);
  assert.equal(strip.length, 1, "şeritte yalnız aktif");
  assert.equal(vers.length, 2, "kayıt silinmedi");
  vers = vers.map(v => v.id === "a" ? flag(v, { arch: false }) : v);
  assert.equal(vers.filter(v => !v.arch && !v.del).length, 2, "arşivden çıkınca geri gelir");
});
test("Ayna: seçili görsel silinince en yeni aktif versiyon seçilir; tek görsel silinirse sahne boşalır", () => {
  const fallback = (vers, selUrl) => {
    const cur = vers.find(v => v.url === selUrl);
    if (!cur || (!cur.arch && !cur.del)) return selUrl;
    const act = vers.filter(v => !v.arch && !v.del);
    return act.length ? act[act.length - 1].url : "";
  };
  let vers = [{ id: "a", url: "u1" }, { id: "b", url: "u2" }, { id: "c", url: "u3", del: true }];
  vers = vers.map(v => v.id === "b" ? flag(v, { del: true }) : v);   // seçili (u2) silindi
  assert.equal(fallback(vers, "u2"), "u1", "en yeni AKTİF versiyona düşer");
  vers = vers.map(v => flag(v, { del: true }));
  assert.equal(fallback(vers, "u1"), "", "hepsi silinirse sahne görselsiz");
});
test("Ayna: silinen görsel Favoriler ve Arşiv listelerinde görünmez", () => {
  const rows = [
    { id: 1, fav: true, arch: false, del: false },
    { id: 2, fav: true, arch: true, del: false },
    { id: 3, fav: true, arch: false, del: true },
    { id: 4, fav: false, arch: true, del: true }
  ];
  const base = rows.filter(x => !x.del);
  assert.deepEqual(base.filter(x => x.fav).map(x => x.id), [1, 2], "favoriler (arşivli favori dahil, silinen hariç)");
  assert.deepEqual(base.filter(x => x.arch).map(x => x.id), [2], "arşiv (silinen hariç)");
  assert.deepEqual(base.filter(x => !x.arch).map(x => x.id), [1], "varsayılan liste");
});
