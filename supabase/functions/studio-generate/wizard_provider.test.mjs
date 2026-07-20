// ============================================================================
// SİHİRBAZ SAHNE ALANI — SAĞLAYICI SEÇİCİ + DİNAMİK BUTON METİNLERİ (statik)
// Çalıştır:  node supabase/functions/studio-generate/wizard_provider.test.mjs
//
// Üret-Sihirbaz sahne üretim alanına, Görsel Studio'daki AYNI GPT/Gemini/Higgs
// bileşeni (imgProviders) eklendi (yeni mantık yok). Buton metinleri seçilen
// sağlayıcıya göre dinamik; tüm çağrılar imageProvider'ı backend'e gönderir.
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("imgProviders bileşeni TEK tanım (yeni mantık yazılmadı, yeniden kullanıldı)", () => {
  const defs = (studioSrc.match(/imgProviders:\s*\[\['gpt'/g) || []).length;
  assert.equal(defs, 1, "imgProviders tek kaynak olmalı (kopya mantık yok)");
  assert.ok(studioSrc.includes("['higgs', 'Higgs', true]"), "Higgs pasif (Yakında) korunmalı");
});

test("Sihirbaz sahne alanında SAĞLAYICI seçici imgProviders'ı kullanır (3. kullanım)", () => {
  const uses = (studioSrc.match(/list="\{\{ imgProviders \}\}"/g) || []).length;
  assert.ok(uses >= 3, "imgProviders seçici en az 3 yerde (2 Görsel Studio + Sihirbaz) render edilmeli (bulundu: " + uses + ")");
  // Sihirbaz GÖRSEL PROMPTLARI alanında SAĞLAYICI etiketi + selector
  const wiz = studioSrc.slice(studioSrc.indexOf("GÖRSEL PROMPTLARI"), studioSrc.indexOf("GÖRSEL PROMPTLARI") + 3500);
  assert.ok(wiz.includes("SAĞLAYICI") && wiz.includes('list="{{ imgProviders }}"'), "sihirbaz sahne alanında sağlayıcı seçici olmalı");
});

test("Varsayılan GPT; sağlayıcı kısa adı yardımı", () => {
  assert.ok(studioSrc.includes("_provNm() { return { gpt: 'GPT', gemini: 'Gemini' }[this.state.imgProvider || 'gpt']"), "_provNm varsayılan gpt");
});

test("Buton metinleri sağlayıcıya göre dinamik (Görsel Üret / Tekrar Üret / Tüm Sahneleri Üret)", () => {
  assert.ok(studioSrc.includes("this._provNm() + ' ile Görsel Üret · 12 KR'"), "kapak/karakter: '<prov> ile Görsel Üret · 12 KR'");
  assert.ok(studioSrc.includes("this._provNm() + ' ile Görsel Üret · ' + cost + ' KR'"), "sahne: '<prov> ile Görsel Üret · X KR'");
  assert.ok(studioSrc.includes("this._provNm() + ' ile Tekrar Üret"), "Yenile/Tekrar Üret dinamik");
  assert.ok(studioSrc.includes("this._provNm() + ' ile Tüm Sahneleri Üret ('"), "Tüm Sahneleri Üret dinamik + (N)");
});

test("Tüm Sahneleri Üret etiketi (N) = kalan sahne sayısı (genAllScenes ile aynı filtre)", () => {
  // genAllLabel'daki N sayımı, genAllScenes'in 'done değil' filtresini aynen kullanmalı
  assert.ok(studioSrc.includes("gorsel_promptlar || []).filter((x, i) => x && x.prompt && !(((s.sceneImgs || {})['gp' + i]) || {}).done).length"),
    "kalan sahne sayımı genAllScenes filtresini yansıtmalı");
});

test("Tüm sahne çağrıları imageProvider'ı backend'e gönderir (makeImage → imageServer)", () => {
  // Sahne/kapak/karakter üretimi makeSceneImg → makeImage; makeImage → imageServer;
  // imageServer gövdesi imageProvider gönderir (mevcut). Zincir korunmalı.
  assert.ok(studioSrc.includes("this.makeImage(prompt, idx, key, this.state.aspect)"), "makeSceneImg makeImage'ı çağırmalı");
  assert.ok(studioSrc.includes("imageProvider: this.state.imgProvider || 'gpt'"), "imageServer imageProvider'ı göndermeli");
  assert.ok(studioSrc.includes("this.imageServer(sendPrompt, ar, idx, onAttempt, id, sty)"), "makeImage imageServer'a stil+opId geçmeli (zincir)");
});
