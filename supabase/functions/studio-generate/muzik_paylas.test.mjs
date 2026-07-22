// ============================================================================
// FAZ 2 (kısım 1): FON MÜZİĞİ KÜTÜPHANESİ (5 mizaç, prosedürel) + PAYLAŞ BUTONU
// Müzik telifsiz WebAudio ile üretilir; seçili mizaç belgesel montajına geçer,
// ▶ ile önizlenir. Paylaş butonu indirmenin yanında (navigator.share → dosya).
// Çalıştır: node --test supabase/functions/studio-generate/muzik_paylas.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("Fon müziği: 5 mizaç prosedürel motor + montaja geçer", () => {
  assert.ok(src.includes("_musicBed(ctx, dest, t0, total, mood)"), "müzik motoru");
  for (const m of ["gerilim:", "dramatik:", "korku:", "neseli:", "duygusal:"])
    assert.ok(src.includes(m), "mizaç: " + m);
  assert.ok(src.includes("this._musicBed(ctx, dest, t0, total, opts.mood"), "montaja bağlı");
  assert.ok(src.includes("mood: this.state.docMusicMood"), "seçili mizaç montaja gider");
});

test("Mizaç UI: seçici çipler + ücretsiz önizleme", () => {
  assert.ok(src.includes("docMoods:"), "mizaç çipleri");
  assert.ok(src.includes("previewMoodNow()"), "önizleme motoru");
  assert.ok(src.includes('list="{{ docMoods }}"'), "panelde mizaç seçici");
  assert.ok(src.includes("['gerilim', 'Gerilim'") && src.includes("['korku', 'Korku'"), "mizaç etiketleri");
});

test("Müzik güvenli: hata montajı bozmaz, seslendirmenin altında kısık", () => {
  const i = src.indexOf("_musicBed(ctx, dest, t0, total, mood)");
  const seg = src.slice(i, i + 1800);
  assert.ok(seg.includes("catch (e) { /* müzik opsiyonel"), "hata yutulur (montaj sürer)");
  assert.ok(seg.includes("linearRampToValueAtTime(1, t0 + 2.5)") && seg.includes("linearRampToValueAtTime(0, t0 + total)"), "başta/sonda fade");
});

test("Paylaş butonu: indirmenin yanında, dosya paylaşımı + link yedeği", () => {
  assert.ok(src.includes("async shareMedia(url, filename, title)"), "paylaş yöntemi");
  assert.ok(src.includes("nav.canShare({ files: [file] })"), "dosya paylaşımı (WhatsApp/IG/AirDrop)");
  assert.ok(src.includes("Bağlantı kopyalandı ✓"), "link yedeği");
  assert.ok(src.includes("docShare:") && src.includes(">↗ PAYLAŞ<"), "belgeselde paylaş butonu");
  assert.ok(src.includes("share: () => this.shareMedia(x.vidUrl"), "Videolarım kartında paylaş");
});
