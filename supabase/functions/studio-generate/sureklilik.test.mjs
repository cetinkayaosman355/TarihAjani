// ============================================================================
// SÜREKLİLİK — uzun videolarda (10 dk) karakter + MEKÂN + hikâye devamlılığı
// Sorun: sahne promptları bölüm bölüm, birbirinden BAĞIMSIZ üretiliyordu; karakter
// bible'ı vardı ama MEKÂN bible'ı yoktu → "aynı saray" her sahnede farklı görünüyor,
// sahneler kopuk ada gibi kalıyordu. Çözüm: mekanlar[] şeması + locbible + film bağlamı
// her sahne grubuna verilir. API modeli fine-tune EDİLMEZ; talimat/şema güçlendirilir.
// Çalıştır: node --test supabase/functions/studio-generate/sureklilik.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("buildPrompt JSON şemasında mekanlar[] (mekân bible'ı) var", () => {
  assert.ok(src.includes('"mekanlar": [{"ad"'), "mekanlar şema alanı");
  assert.ok(src.includes("aynı yer her sahnede AYNI görünsün"), "mekân sabit kimlik açıklaması");
  assert.ok(src.includes("Hikâyede tekrar eden HER ana kişiyi buraya ekle"), "karakterler doldurma zorunluluğu");
});

test("buildPrompt: SÜREKLİLİK kuralı (film tek parça) mevcut", () => {
  assert.ok(src.includes("🔗 SÜREKLİLİK (film TEK PARÇA durmalı"), "süreklilik kuralı");
  assert.ok(src.includes("karakterler[] ve mekanlar[] dizilerini DOLU ver"), "iki bible da doldurulur");
  assert.ok(src.includes('"aynı saray" iki sahnede iki farklı bina gibi görünmesin'), "mekân tutarlılığı vurgusu");
});

test("genScenePrompts: locbible + logline her sahne grubuna hazırlanır", () => {
  assert.ok(src.includes("cfg.locbible = (Array.isArray(result.mekanlar) ? result.mekanlar : [])"), "mekân bible'ı result.mekanlar'dan");
  assert.ok(src.includes("cfg.logline = String(result.logline || result.baslik || this.state.idea"), "film bağlamı (logline)");
});

test("sceneBatch: mekân + film bağlamı prompta girer", () => {
  assert.ok(src.includes("const locLine = (cfg.locbible)"), "locLine tanımı");
  assert.ok(src.includes("TEKRAR EDEN MEKÂNLAR"), "mekân talimatı metni");
  assert.ok(src.includes("const filmLine = (cfg.logline)"), "filmLine tanımı");
  assert.ok(src.includes("FİLMİN BÜTÜNÜ (bağlam"), "film bağlam metni");
  assert.ok(src.includes("bibleLine + locLine +"), "locLine prompt gövdesine eklenmiş");
  assert.ok(src.includes("\\n' + filmLine + 'Bu bölümün seslendirme metnini"), "filmLine prompt başına eklenmiş");
});

test("Karakter referans görseli TÜM sahnelere taşınır (ilk üretilen baz alınır)", () => {
  // Kullanıcı referans yüklerse tüm sahneler onu; yüklemezse ilk sahne (gp1) baz alınır.
  assert.ok(src.includes("if (up) return up;   // kullanıcı referans yükledi → tüm sahneler onu baz alır"), "yüklenen referans tüm sahnelere");
  assert.ok(src.includes("const refKey = keys[0], refUrl = si[refKey].url"), "ilk sahne referans olur");
  assert.ok(src.includes("const rf = this._charRef(sceneKey); return rf ? { refImage: rf } : {}"), "referans imageServer'a refImage olarak gider");
});
