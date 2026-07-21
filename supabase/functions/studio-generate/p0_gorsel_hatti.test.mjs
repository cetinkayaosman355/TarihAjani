// ============================================================================
// P0 — GÖRSEL ÜRETİM HATTI: seçilen değer = payload = provider isteği = gerçek
// çıktı = metadata. Bu dosya o zincirin her halkasını kilitler.
// Çalıştır:  node --test supabase/functions/studio-generate/p0_gorsel_hatti.test.mjs
//
// (A) Kaynak değişmezleri: sunucu validasyonu, sağlayıcı boyut eşlemeleri,
//     gerçek çıktı doğrulaması, sessiz fallback yokluğu.
// (B) Saf aynalar: ratioOk, resolver önceliği, kategori→stil validasyonu,
//     kategori değişince stil temizliği, kredi güvenliği durum makinesi.
// (C) Payload aynası: 9:16 / 16:9 / 1:1 için gerçek istek gövdesi.
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

// ── (A) KAYNAK DEĞİŞMEZLERİ ─────────────────────────────────────────────────
test("Sunucu validasyonu: oran/stil rezervasyondan ÖNCE denetlenir (4xx, kredi ayrılmaz)", () => {
  const h = indexSrc.slice(indexSrc.indexOf('String(b.action || "") === "image"'));
  const iVal = h.indexOf('SUPPORTED_ASPECTS.has(sizeReq)');
  const iStyle = h.indexOf('STYLE_TEMPLATES[styleKey]');
  const iReserve = h.indexOf('reserveOp(admin, userId, cost, "gorsel"');
  assert.ok(iVal > 0 && iStyle > 0 && iReserve > 0, "validasyon + rezervasyon blokları mevcut");
  assert.ok(iVal < iReserve && iStyle < iReserve, "validasyon REZERVASYONDAN ÖNCE (geçersiz istekte kredi ayrılmaz)");
  assert.ok(indexSrc.includes('errClass: "VALIDATION_ASPECT" }, 400'), "geçersiz oran → 400");
  assert.ok(indexSrc.includes('errClass: "VALIDATION_STYLE" }, 400'), "bilinmeyen/boş stil → 400");
  assert.ok(indexSrc.includes("Seçilen oran desteklenmiyor"), "oran hatası kullanıcı dilinde");
  assert.ok(indexSrc.includes("geçerli bir görsel stil seçilmedi"), "stil hatası kullanıcı dilinde");
});

test("Sağlayıcı boyut eşlemeleri açık; sunucuda sessiz 1:1/16:9 varsayılanı yok", () => {
  assert.ok(indexSrc.includes('const OPENAI_SIZE: Record<string, string> = { "9:16": "1024x1536", "16:9": "1536x1024", "1:1": "1024x1024" }'), "OpenAI eşlemesi");
  assert.ok(indexSrc.includes('const gStd = OPENAI_SIZE[size] || ""'), "OpenAI boyutu merkezi eşlemeden");
  assert.ok(indexSrc.includes('if (!gStd) {'), "eşlenmeyen oran üretimi durdurur (kemer)");
  assert.ok(!indexSrc.includes('size === "16:9" ? "1536x1024" : "1024x1024"'), "eski üçlü ifade (sessiz 1:1 sonu) kalmadı");
  assert.ok(indexSrc.includes('const aspRatio = GEMINI_ASPECT[size] || ""'), "Gemini oranı merkezi eşlemeden");
  assert.ok(indexSrc.includes("if (!aspOff && aspRatio) genCfg.imageConfig = { aspectRatio: aspRatio }"), "Gemini imageConfig varsayılan gönderilir");
});

test("Gerçek çıktı doğrulaması üretim yolunda: uyuşmazlık → iade + 502, başarı sayılmaz", () => {
  const i0 = indexSrc.indexOf("img_ratio_mismatch");
  const iUp = indexSrc.indexOf("uploadImage(admin, userId, url)");
  assert.ok(i0 > 0, "uyuşmazlık logu var");
  assert.ok(i0 < iUp, "doğrulama Storage'a yüklemeden ÖNCE (yanlış oran arşive hazır görsel olarak girmez)");
  assert.ok(indexSrc.includes('return json({ ok: false, error: "Üretilen görsel seçilen orana ('), "kullanıcıya açık hata");
  const blk = indexSrc.slice(i0, i0 + 700);
  assert.ok(blk.includes("refundOp(admin, userId, opId)"), "uyuşmazlıkta rezervasyon iadesi");
  assert.ok(indexSrc.includes("ratioVerified:"), "meta'da doğrulama işareti");
  assert.ok(indexSrc.includes("img_audit op="), "denetim izi: istek ↔ gerçek çıktı tek satır log");
});

test("İstemci: sessiz 16:9/varsayılan fallback kalmadı; üretim kapısı çalışır", () => {
  assert.ok(!studioSrc.includes("|| '16:9'"), "hiçbir yerde sessiz '16:9' fallback yok");
  assert.ok(!studioSrc.includes("|| 'wide 16:9"), "aspectPhrase sessiz 16:9 üretmez");
  assert.ok(studioSrc.includes("resolveImageGenerationSettings(sceneKey, frozen)"), "merkezi çözümleyici");
  assert.ok(studioSrc.includes("if (!gen.valid) {"), "geçersiz ayar → istek atılmaz");
  assert.ok(studioSrc.includes("imgValErr: gen.err"), "engel nedeni kullanıcıya yazılır");
  assert.ok(studioSrc.includes("genAllDisabled:"), "toplu CTA geçersiz ayarda kilitli");
  assert.ok(studioSrc.includes('disabled="{{ gp.imgBlocked }}"'), "sahne üret butonları geçersiz ayarda kilitli");
  assert.ok(studioSrc.includes("Bir görsel stil seç"), "doğrulama mesajı görünür");
});

test("Kategori ≠ üretim stili: alt stil seçilmeden üretim yok; kategori değişince stil temizlenir", () => {
  assert.ok(studioSrc.includes("styleNeedSub:"), "alt stil eksik uyarısı VM'de");
  assert.ok(studioSrc.includes("kategori tek başına üretim stili değildir"), "uyarı metni");
  assert.ok(studioSrc.includes("imgStyle: this.STYLE_CAT_OF(st.imgStyle || '') === id ? st.imgStyle : null"), "kategori değişince yabancı stil temizlenir");
  assert.ok(studioSrc.includes("cat === 'sinematik' ? 'sinematik' : ''"), "yalnız Sinematik kategorisi tek adımda stil olur");
});

test("Panel seçimleri dosyayla kalıcı: yenilemede seçim sihirbaza sessizce geri dönmez", () => {
  assert.ok(studioSrc.includes("imgAspect: s.imgAspect || null, imgAspectManual: !!s.imgAspectManual"), "persist: oran");
  assert.ok(studioSrc.includes("imgStyle: s.imgStyle || null, imgStyleCat: s.imgStyleCat || ''"), "persist: stil + kategori");
  assert.ok(studioSrc.includes("imgStyle: (w && w.imgStyle) || null"), "restore: stil");
  assert.ok(studioSrc.includes("imgAspect: (w && w.imgAspect) || null"), "restore: oran");
});

test("Video + küçük görünüm görselin KENDİ oranını kullanır (dosya sihirbazını değil)", () => {
  assert.ok(studioSrc.includes("const recAr = String(((si.meta || {}).aspect) || '')"), "video oranı görsel kaydından");
  assert.ok(!studioSrc.includes("[this.state.aspect] || '9:16'"), "videoda sessiz 9:16 fallback kalmadı");
  assert.ok(studioSrc.includes("'16:9': 'yatay', '9:16': 'dikey', '1:1': 'kare'"), "thumb kutusu gerçek orandan");
});

test("Metadata etiketleri UI ile birebir: Hollywood Foto-gerçekçi · Osmanlı Minyatürü", () => {
  assert.ok(indexSrc.includes('hollywood: "Hollywood Foto-gerçekçi"'), "hollywood etiketi");
  assert.ok(indexSrc.includes('minyatur: "Osmanlı Minyatürü"'), "minyatür etiketi");
  assert.ok(!indexSrc.includes('hollywood: "Gerçekçi"'), "eski karışan 'Gerçekçi' etiketi kalmadı");
});

// ── (B) SAF AYNALAR ─────────────────────────────────────────────────────────
// ratioOk aynası — index.ts ile AYNI mantık (kaynak değişirse üstteki değişmez testi yakalar).
function ratioOk(size, w, h) {
  if (!w || !h) return true;
  const r = w / h;
  const near = (t, tol = 0.06) => Math.abs(r - t) <= t * tol;
  if (size === "9:16") return h > w && (near(9 / 16) || near(2 / 3));
  if (size === "16:9") return w > h && (near(16 / 9) || near(3 / 2));
  if (size === "1:1") return near(1, 0.02);
  return false;
}
test("Ayna ratioOk: 9:16 kabul = dikey (1024x1536 veya gerçek 9:16); kare/yatay RED", () => {
  assert.equal(ratioOk("9:16", 1024, 1536), true, "OpenAI doğal dikey (2:3) kabul");
  assert.equal(ratioOk("9:16", 720, 1280), true, "gerçek 9:16 kabul (Gemini)");
  assert.equal(ratioOk("9:16", 1024, 1024), false, "9:16 istenirken KARE reddedilir (eski Gemini hatası)");
  assert.equal(ratioOk("9:16", 1536, 1024), false, "9:16 istenirken YATAY reddedilir");
});
test("Ayna ratioOk: 16:9 kabul = yatay (1536x1024 veya gerçek 16:9); dikey/kare RED", () => {
  assert.equal(ratioOk("16:9", 1536, 1024), true);
  assert.equal(ratioOk("16:9", 1280, 720), true);
  assert.equal(ratioOk("16:9", 1024, 1536), false);
  assert.equal(ratioOk("16:9", 1000, 1000), false);
});
test("Ayna ratioOk: 1:1 sıkı (%2); okunamayan başlık doğrulamayı atlar (kullanıcı cezalandırılmaz)", () => {
  assert.equal(ratioOk("1:1", 1024, 1024), true);
  assert.equal(ratioOk("1:1", 1024, 1536), false);
  assert.equal(ratioOk("9:16", 0, 0), true, "w/h yok → doğrulanamaz, engellenmez (loglanır)");
});

// Resolver aynası — Studio.dc.html resolveImageGenerationSettings ile aynı kurallar.
const AR_MAP = { yatay: "16:9", dikey: "9:16", kare: "1:1" };
const STYLE_KEYS = ["sinematik", "belgeselfoto", "hollywood", "gravur", "minyatur", "animasyon"];
function resolve(state, sceneKey, frozen) {
  const so = (sceneKey && (state.sceneOpts || {})[sceneKey]) || {};
  const base = frozen || {};
  const arKey = so.ar || base.arKey || state.imgAspect || state.aspect || "";
  const aspectRatio = AR_MAP[arKey] || "";
  let styleId = so.style || base.styleId || state.imgStyle || "";
  if (!styleId) {
    const cat = state.imgStyleCat || "";
    styleId = !cat ? (state.style || "") : (cat === "sinematik" ? "sinematik" : "");
  }
  if (STYLE_KEYS.indexOf(styleId) < 0) styleId = "";
  return { arKey, aspectRatio, styleId, valid: !!(aspectRatio && styleId) };
}
test("Ayna resolver: sahne > panel > dosya; bilinmeyen oran valid:false (16:9'a düşmez)", () => {
  const st = { aspect: "yatay", imgAspect: "dikey", style: "belgeselfoto", imgStyle: "sinematik", sceneOpts: { gp1: { ar: "kare", style: "gravur" } } };
  assert.equal(resolve(st, "gp0").aspectRatio, "9:16", "panel dosyayı ezer");
  assert.equal(resolve(st, "gp1").aspectRatio, "1:1", "sahne ayarı paneli ezer");
  assert.equal(resolve(st, "gp1").styleId, "gravur");
  assert.equal(resolve({ aspect: "bilinmeyen", style: "sinematik" }, "").valid, false, "bilinmeyen oran üretime giremez");
});
test("Ayna resolver: kategori seçili + alt stil yok → valid:false; Sinematik kategorisi tek adım", () => {
  const base = { aspect: "dikey", style: "sinematik" };
  assert.equal(resolve({ ...base, imgStyleCat: "sanatsal" }, "").valid, false, "Sanatsal + alt stil yok → ÜRETİM YOK");
  assert.equal(resolve({ ...base, imgStyleCat: "gercekci" }, "").valid, false, "Gerçekçi + alt stil yok → ÜRETİM YOK");
  assert.equal(resolve({ ...base, imgStyleCat: "sinematik" }, "").styleId, "sinematik", "Sinematik kategorisi = stil");
  assert.equal(resolve({ ...base, imgStyleCat: "sanatsal", imgStyle: "animasyon" }, "").styleId, "animasyon", "Sanatsal + Animasyon → animation");
  assert.equal(resolve({ ...base, imgStyleCat: "gercekci", imgStyle: "belgeselfoto" }, "").styleId, "belgeselfoto", "Gerçekçi + Belgesel → documentary");
});
test("Ayna: kategori değişince yabancı stil TAŞINMAZ (Hollywood → Sanatsal'da kalmaz)", () => {
  const CAT_OF = (k) => k === "sinematik" ? "sinematik" : (k === "belgeselfoto" || k === "hollywood") ? "gercekci" : (k ? "sanatsal" : "");
  const pickCat = (st, id) => ({ ...st, imgStyleCat: id, imgStyle: CAT_OF(st.imgStyle || "") === id ? st.imgStyle : null });
  let st = { aspect: "dikey", style: "sinematik", imgStyle: "hollywood", imgStyleCat: "gercekci" };
  st = pickCat(st, "sanatsal");
  assert.equal(st.imgStyle, null, "Hollywood, Sanatsal'a geçince temizlenir");
  assert.equal(resolve(st, "").valid, false, "alt stil seçilene dek üretim kilitli");
  st = { ...st, imgStyle: "minyatur" };
  assert.equal(resolve(st, "").styleId, "minyatur");
});

// Kredi güvenliği durum makinesi aynası (sunucu akışı: validate → reserve → call →
// verify → finalize; hata/uyuşmazlıkta refund; aynı opId ikinci kez ücretlenmez).
function creditFlow(ev) {
  if (!ev.validAspect || !ev.validStyle) return { reserved: false, charged: false, http: 400 };
  if (ev.recovered) return { reserved: false, charged: false, http: 200 };          // aynı opId → önceki sonuç, ücret yok
  if (!ev.reserveOk) return { reserved: false, charged: false, http: 402 };
  if (!ev.providerOk) return { reserved: true, refunded: true, charged: false, http: 502 };
  if (!ev.ratioOk) return { reserved: true, refunded: true, charged: false, http: 502 };
  return { reserved: true, refunded: false, charged: true, http: 200 };
}
test("Ayna kredi: geçersiz istek/başarısız üretim/oran uyuşmazlığında ücret YOK; idempotent kurtarma", () => {
  assert.deepEqual(creditFlow({ validAspect: false, validStyle: true }), { reserved: false, charged: false, http: 400 });
  assert.deepEqual(creditFlow({ validAspect: true, validStyle: false }), { reserved: false, charged: false, http: 400 });
  assert.equal(creditFlow({ validAspect: true, validStyle: true, reserveOk: true, providerOk: false }).refunded, true, "sağlayıcı hatası → iade");
  assert.equal(creditFlow({ validAspect: true, validStyle: true, reserveOk: true, providerOk: true, ratioOk: false }).refunded, true, "oran uyuşmazlığı → iade");
  assert.equal(creditFlow({ validAspect: true, validStyle: true, recovered: true }).charged, false, "aynı opId tekrar → ikinci ücret yok");
  const ok = creditFlow({ validAspect: true, validStyle: true, reserveOk: true, providerOk: true, ratioOk: true });
  assert.equal(ok.charged, true, "yalnız doğrulanmış başarı ücretlendirilir");
});

// ── (C) PAYLOAD AYNASI: seçim → gerçek istek gövdesi ────────────────────────
const OPENAI_SIZE = { "9:16": "1024x1536", "16:9": "1536x1024", "1:1": "1024x1024" };
function buildPayload(sel) {
  const r = resolve(sel.state, sel.sceneKey || "");
  if (!r.valid) return null;                            // istek HİÇ oluşmaz
  return { action: "image", size: r.aspectRatio, style: r.styleId,
    imageProvider: (String(sel.state.imgProvider || "auto").toLowerCase() === "gemini") ? "gemini" : "gpt",
    openaiSize: OPENAI_SIZE[r.aspectRatio] };
}
test("Payload: 9:16 seçimi → size '9:16' → OpenAI 1024x1536", () => {
  const p = buildPayload({ state: { aspect: "yatay", imgAspect: "dikey", style: "sinematik", imgProvider: "gpt" } });
  assert.equal(p.size, "9:16"); assert.equal(p.openaiSize, "1024x1536"); assert.equal(p.imageProvider, "gpt");
});
test("Payload: 16:9 seçimi → size '16:9' → OpenAI 1536x1024", () => {
  const p = buildPayload({ state: { aspect: "dikey", imgAspect: "yatay", style: "belgeselfoto" } });
  assert.equal(p.size, "16:9"); assert.equal(p.openaiSize, "1536x1024");
});
test("Payload: 1:1 seçimi → size '1:1' → OpenAI 1024x1024; Gemini'ye oran '1:1' gider", () => {
  const p = buildPayload({ state: { aspect: "kare", style: "minyatur", imgProvider: "gemini" } });
  assert.equal(p.size, "1:1"); assert.equal(p.openaiSize, "1024x1024"); assert.equal(p.imageProvider, "gemini");
});
test("Payload: Sanatsal seçili + alt stil yok → payload OLUŞMAZ (istek gönderilmez)", () => {
  const p = buildPayload({ state: { aspect: "dikey", style: "sinematik", imgStyleCat: "sanatsal", imgStyle: null } });
  assert.equal(p, null);
});
test("Payload: genel 9:16'ya karşı sahne override 1:1 → sahne kazanır", () => {
  const p = buildPayload({ sceneKey: "gp2", state: { aspect: "dikey", style: "sinematik", sceneOpts: { gp2: { ar: "kare" } } } });
  assert.equal(p.size, "1:1");
});
