// ============================================================================
// PR-2 — AI YÖNETMEN · ÜRETİM EKRANI (Design Freeze v1, yalnız frontend sunum)
// Çalıştır:  node supabase/functions/studio-generate/ux_uret.test.mjs
//
// (A) Kaynak değişmezleri (Studio.dc.html):
//     kesin 6 stil, ⚡ Otomatik motor (sunucuya asla 'auto' gitmez), platform→tek
//     etkin oran + elle-değişti rozeti, 'Görsel hazır' terminolojisi, prompt
//     varsayılan gizli, mobil CTA kuralı. Backend (index.ts) DEĞİŞMEZ.
// (B) Saf aynalar: platform önerisi / etkin oran / rozet mantığı.
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");
const indexSrc = readFileSync(join(HERE, "index.ts"), "utf8");

// ── (A) Kaynak değişmezleri ─────────────────────────────────────────────────
test("Kesin stil listesi (Freeze v1): 6 stil, Hollywood Foto-gerçekçi ayrı", () => {
  assert.ok(studioSrc.includes("[['sinematik', 'SİNEMATİK'], ['belgeselfoto', 'BELGESEL'], ['hollywood', 'HOLLYWOOD FOTO-GERÇEKÇİ'], ['gravur', 'GRAVÜR'], ['minyatur', 'OSMANLI MİNYATÜRÜ'], ['animasyon', 'ANİMASYON']]"), "6 stil, sabit sıra ve adlarla");
  assert.ok(!studioSrc.includes("'GERÇEKÇİ']"), "eski tek başına 'GERÇEKÇİ' etiketi kalmadı");
  // Anahtarlar backend STYLE_TEMPLATES ile birebir — yeni anahtar İCAT EDİLMEZ.
  for (const k of ["sinematik", "belgeselfoto", "hollywood", "gravur", "minyatur", "animasyon"]) {
    assert.ok(indexSrc.includes("  " + k + ":") || indexSrc.includes(k + ':'), "backend şablon anahtarı mevcut: " + k);
  }
});

test("Motor: ⚡ Otomatik varsayılan; sunucuya giden HER yol _provResolve'dan geçer", () => {
  assert.ok(studioSrc.includes("_provResolve(p) {"), "_provResolve helper tanımlı");
  assert.ok(studioSrc.includes("imgProvider: saved.imgProvider || 'auto'"), "varsayılan auto");
  assert.ok(studioSrc.includes("['auto', '⚡ Otomatik', false]"), "seçici listede Otomatik");
  assert.ok(studioSrc.includes("imageProvider: this._provResolve(provider || this.state.imgProvider)"), "imageServer yolu çözümlenir");
  assert.ok(studioSrc.includes("this._provResolve(providerOverride || this.state.imgProvider)"), "makeImage yolu çözümlenir");
  assert.ok(studioSrc.includes("this._provResolve(s.imgProvider)"), "genAllScenes (batch) yolu çözümlenir");
  assert.ok(!studioSrc.includes("imageProvider: 'auto'"), "'auto' hiçbir yerde doğrudan gönderilmez");
  assert.ok(studioSrc.includes("imgAutoNote"), "Otomatik/elle şeffaflık notu");
});

test("Platform → tek etkin oran: öneri + elle-değişti rozeti + seçim korunur", () => {
  assert.ok(studioSrc.includes("imgPlatforms:"), "platform seçici VM");
  for (const p of ["REELS / STORY", "SHORTS", "TIKTOK", "IG GÖNDERİSİ", "YOUTUBE", "1:1 KARE"]) {
    assert.ok(studioSrc.includes(p), "platform: " + p);
  }
  assert.ok(studioSrc.includes("imgAspect: sug, imgAspectManual: false"), "platform seçimi orana öneri yazar + manuel bayrağı temizler");
  assert.ok(studioSrc.includes("imgAspect: k, imgAspectManual: true"), "elle oran seçimi manuel bayrağı kor (platform seçimi korunur)");
  assert.ok(studioSrc.includes("aspectManualBadge"), "✋ elle değiştirildi rozeti");
  assert.ok(studioSrc.includes("4:5 yakında"), "IG Gönderisi dürüst etiket: 1:1 (4:5 yakında) — sahte 4:5 üretimi yok");
  // 1:1 her zaman erişilebilir (Freeze kuralı): kadraj listesinde 'kare' var
  assert.ok(studioSrc.includes("'kare'") && studioSrc.includes("KARE 1:1"), "1:1 kalıcı seçenek");
});

test("Terminoloji: 'Görsel hazır' (Tamamlandı yerine) — kart + kuyruk tutarlı", () => {
  assert.ok(studioSrc.includes("✓ GÖRSEL HAZIR · "), "kart rozeti Görsel hazır");
  assert.ok(studioSrc.includes("🟢 GÖRSEL HAZIR"), "batch rozeti Görsel hazır");
  assert.ok(studioSrc.includes("Görsel hazır: ") && studioSrc.includes("Üretiliyor: ") && studioSrc.includes("Sırada: "), "kuyruk özeti: hazır/üretiliyor/sırada (processing 'Sırada' sayılmaz)");
  assert.ok(!studioSrc.includes("'🟢 TAMAMLANDI'"), "eski TAMAMLANDI rozeti kalmadı");
});

test("Prompt varsayılan gizli: 'Promptu Gör' aç/kapa — metin kaybolmaz", () => {
  assert.ok(studioSrc.includes("promptShow:"), "promptShow bayrağı");
  assert.ok(studioSrc.includes("togglePrompt:"), "aç/kapa handler");
  assert.ok(studioSrc.includes("👁 PROMPTU GÖR"), "Promptu Gör etiketi");
  assert.ok(studioSrc.includes('sc-if value="{{ gp.promptShow }}"'), "prompt bloğu sc-if arkasında");
  assert.ok(studioSrc.includes("{{ gp.prompt }}"), "prompt metni hâlâ kaynakta (kaybolmadı)");
});

test("Ana CTA (Freeze v1): 'Tüm Görselleri Üret · N sahne · X KR' — gerçek tarife", () => {
  assert.ok(studioSrc.includes("'◈ TÜM GÖRSELLERİ ÜRET · ' + idxs.length + ' sahne · ' + kr + ' KR'"), "CTA metni sahne sayısı + toplam kredi");
  assert.ok(studioSrc.includes("a + this.IMG_COST(i)"), "kredi toplamı gerçek kademeli tarifeden (sunucu costFor aynası)");
  assert.ok(!studioSrc.includes("ile Tüm Sahneleri Üret"), "eski CTA metni kalmadı");
});

test("Taksonomi: oran satırının adı ORAN (Kadraj=çerçeveleme PR-3'e ait)", () => {
  assert.ok(studioSrc.includes(">ORAN</span>"), "oran seçici etiketi ORAN");
  assert.ok(!/letter-spacing: \.14em;">KADRAJ</.test(studioSrc), "oran satırında eski KADRAJ etiketi kalmadı");
});

test("Motor notu (Freeze v1 dili): 'seçildi — bu üretim için öneriliyor'", () => {
  assert.ok(studioSrc.includes("seçildi — bu üretim için öneriliyor"), "otomatik seçim açıklaması kullanıcı dilinde");
  assert.ok(studioSrc.includes("Motor elle seçildi: "), "manuel seçim durumu gösterilir");
});

test("Mobil: ayar satırları yatay carousel + ana CTA sticky", () => {
  assert.ok((studioSrc.match(/class="ta-setrow"/g) || []).length >= 3, "PLATFORM/ORAN/MOTOR satırları carousel sınıflı");
  assert.ok(studioSrc.includes(".ta-setrow { flex-wrap: nowrap !important; overflow-x: auto;"), "carousel CSS");
  assert.ok(studioSrc.includes("position: sticky; bottom: 10px; z-index: 30;"), "ana CTA mobilde sticky");
});

test("Mobil: ana CTA taşamaz (ta-genall) + 44px dokunma hedefleri", () => {
  assert.ok(studioSrc.includes('class="ta-genall"'), "Tümünü Üret butonunda mobil sınıfı");
  assert.ok(studioSrc.includes(".ta-genall { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; white-space: normal !important;"), "mobilde tam genişlik + sarılabilir");
  assert.ok(studioSrc.includes(".ta-card button { min-height: 44px; }"), "kart butonları ≥44px");
});

test("Backend DOKUNULMADI: PR-2 yalnız frontend", () => {
  // studio-generate iş mantığı değişmezleri aynen durur (madde 18 / dokunma listesi)
  assert.ok(indexSrc.includes("reserve_credits") && indexSrc.includes('admin.from("studio_images").upsert('), "kredi + arşiv mantığı yerinde");
  assert.ok(indexSrc.includes('|| "gpt-image-2"') && indexSrc.includes('|| "gpt-image-1.5"'), "model zinciri yerinde");
});

// ── (B) Saf aynalar ─────────────────────────────────────────────────────────
const PLATFORMS = { reels: "dikey", shorts: "dikey", tiktok: "dikey", igpost: "kare", youtube: "yatay", kare11: "kare" };
function pickPlatform(state, id) { return { ...state, imgPlatform: id, imgAspect: PLATFORMS[id], imgAspectManual: false }; }
function pickAspect(state, k) { return { ...state, imgAspect: k, imgAspectManual: true }; }
function effAspect(state) { return state.imgAspect || state.aspect; }
function manualBadge(state) { return !!(state.imgPlatform && state.imgAspectManual); }

test("Ayna: platform önerir, elle seçim platformu KORUR, tek etkin oran", () => {
  let st = { aspect: "dikey" };
  st = pickPlatform(st, "youtube");
  assert.equal(effAspect(st), "yatay", "YouTube → 16:9 önerisi etkin orana yazılır");
  assert.equal(manualBadge(st), false, "platform seçiminde rozet yok");
  st = pickAspect(st, "kare");
  assert.equal(effAspect(st), "kare", "elle 1:1 → etkin oran değişir");
  assert.equal(st.imgPlatform, "youtube", "platform seçimi KORUNUR (sistem geri almaz)");
  assert.equal(manualBadge(st), true, "rozet görünür");
  st = pickPlatform(st, "reels");
  assert.equal(effAspect(st), "dikey", "yeni platform yeni öneri");
  assert.equal(manualBadge(st), false, "yeni platform seçimi bayrağı temizler");
});

test("Ayna: IG Gönderisi bugün dürüstçe 1:1'e maplenir (4:5 backend'e gelene dek)", () => {
  const st = pickPlatform({ aspect: "dikey" }, "igpost");
  assert.equal(effAspect(st), "kare", "igpost → kare (gerçekte üretilebilen oran)");
});

test("Ayna: 1:1 her durumda seçilebilir — hiçbir modda gizlenmez", () => {
  assert.ok(Object.values(PLATFORMS).includes("kare"), "platform yoluyla 1:1'e ulaşılır");
  const st = pickAspect({ aspect: "dikey" }, "kare");
  assert.equal(effAspect(st), "kare", "doğrudan oran seçici yoluyla da 1:1");
});
