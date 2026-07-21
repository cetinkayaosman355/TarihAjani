// ============================================================================
// GÖRSEL AÇILMA HIZI — küçük WebP önizleme (Supabase görsel dönüşümü)
// 2.8 MB PNG'ler yavaş açılıyordu. Ekranda küçük WebP; büyütme/indirme tam çözünürlük.
// Dönüşüm açık mı BİR KEZ test edilir; kapalıysa orijinale döner (kırılmaz).
// Çalıştır: node --test supabase/functions/studio-generate/gorsel_hiz.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("_dispSrc: public storage görselini render/image dönüşümüne çevirir + width", () => {
  assert.ok(src.includes("_dispSrc(url, w)"), "gösterim-src yardımcısı");
  assert.ok(src.includes("/storage/v1/render/image/public/"), "dönüşüm yolu");
  assert.ok(src.includes("'width=' + (w || 512) + '&quality=72'"), "genişlik + kalite parametresi");
  assert.ok(src.includes("if (i < 0) return url"), "storage dışı URL aynen döner");
});

test("Güvenli: dönüşüm açık mı otomatik test; kapalıysa orijinal (kırılmaz)", () => {
  assert.ok(src.includes("_probeImgXform"), "yetenek testi");
  assert.ok(src.includes("this._imgXformOk = true") && src.includes("this._imgXformOk = false"), "aç/kapa durumu");
  assert.ok(src.includes("if (!this._imgXformOk) return url"), "dönüşüm yoksa orijinal");
});

test("Büyütme TAM çözünürlük: openZoom data-full okur, kartlarda data-full var", () => {
  assert.ok(src.includes("el.getAttribute('data-full') || el.getAttribute('src')"), "zoom tam çözünürlüğü tercih eder");
  assert.ok(src.includes('data-full="{{ gp.img.url }}" src="{{ gp.img.dispUrl }}"'), "sahne görseli: küçük göster, tam büyüt");
});

test("Kart üreticileri dispUrl sağlar (kırık src olmaz)", () => {
  assert.ok(src.includes("dispUrl: this._dispSrc(x.url, 480)"), "galeri/kayıtlı/queue dispUrl");
  assert.ok(src.includes("dispUrl: this._dispSrc(url, 600)"), "sahne kartı dispUrl");
  assert.ok(src.includes("poster: this._dispSrc(x.url || '', 400)"), "video poster küçük önizleme");
});
