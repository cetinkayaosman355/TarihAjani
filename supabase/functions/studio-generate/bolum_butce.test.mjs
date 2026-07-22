// ============================================================================
// BÖLÜM KELİME BÜTÇESİ — uzun videolarda dengeli bölüm + dürüst süre
// Sorun: "4:30 video 3 bölüm ama 2. bölüm 90 sn diyor, 2 cümle var". Süre etiketi
// metinle uyuşmuyordu. Çözüm: bölüm başına kelime bütçesi + iki-yönlü süre kilidi
// + dürüst süre kuralı (kelime÷2.4). API modeli fine-tune EDİLMEZ; talimat düzeltilir.
// Çalıştır: node --test supabase/functions/studio-generate/bolum_butce.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("Bölüm başına kelime bütçesi hesaplanır", () => {
  assert.ok(src.includes("const perChap = chaptered ? Math.round((wmin + wmax) / 2 / bolumN)"), "perChap bütçesi");
  assert.ok(src.includes("const perChapMin = chaptered ? Math.round(perChap * 0.8)"), "alt sınır (perChapMin)");
});

test("Prompt: dengeli dağıtım + boş bölüm yasağı + dürüst süre", () => {
  assert.ok(src.includes("BÖLÜM BAŞINA KELİME BÜTÇESİ"), "kelime bütçesi kuralı");
  assert.ok(src.includes("${perChap} kelime olmalı (en az ${perChapMin})"), "bölüm bütçesi prompta girer");
  assert.ok(src.includes("DÜRÜST SÜRE") && src.includes("kelime sayısı ÷ 2.4"), "süre metinle tutarlı");
  assert.ok(src.includes("90 sn yazıp 2 cümle koyma"), "boş bölüm açık yasak");
});

test("İki yönlü süre kilidi (alt sınır da eşit ciddi)", () => {
  assert.ok(src.includes("İKİ YÖNLÜ") && src.includes("${wmin} ALTINA DÜŞME"), "alt sınır vurgusu");
  assert.ok(src.includes("EN AZ fazla yazmak kadar CİDDİ bir HATADIR"), "az yazmak da hata");
});

test("SON KONTROL: bölüm başına min kelime + süre tutarlılığı", () => {
  assert.ok(src.includes('HER bölümün "metin"i ≥ \' + perChapMin + \' kelime'), "bölüm min kontrolü");
  assert.ok(src.includes('her "sure" o bölümün kelime sayısıyla TUTARLI'), "süre tutarlılık kontrolü");
});

test("Güçlü & istikrarlı dil: kalite uzunluktan önce, dolgu yasak", () => {
  assert.ok(src.includes("GÜÇLÜ & İSTİKRARLI DİL (KALİTE, UZUNLUKTAN ÖNCE GELİR)"), "kalite önceliği kuralı");
  assert.ok(src.includes("Süre bütçesini DOLGUYLA doldurma"), "dolgu yasağı");
  assert.ok(src.includes("Bütçeyi doldurmanın tek meşru yolu DAHA ÇOK GERÇEK MADDE"), "uzunluk = daha çok gerçek madde");
  assert.ok(src.includes("TEK ve TUTARLI bir anlatıcı sesi"), "istikrarlı ses");
  assert.ok(src.includes("KISA AMA DOLU"), "denge + stub yasağı");
});
