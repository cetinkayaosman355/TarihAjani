// ============================================================================
// STABİLİZASYON Faz 3 — GÖRSEL RETRY HATTI STATİK DOĞRULAMASI
// Çalıştır:  node supabase/functions/studio-generate/retry_logic.test.mjs
//
// Bu dosya İKİ şey doğrular:
//   (A) generateImage retry/fallback KARAR MANTIĞI — index.ts'teki orchestrator'ın
//       BİREBİR aynası (aşağıda). Çağrı sayısı senaryoları burada sınanır.
//       ⚠ index.ts değişirse bu ayna da güncellenmelidir.
//   (B) GERÇEK kaynak dosyalarda (index.ts, Studio.dc.html) Faz 3 değişmezleri
//       (invariants) yerinde mi — kaynak metni okunarak kontrol edilir.
//
// Deno kurulu olmadığından (edge fn Deno.serve içerir, Node'a import edilemez)
// mantık aynası + kaynak taraması yöntemi kullanıldı. Node 22 ile çalışır.
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");

// ── (A) index.ts orchestrator AYNASI ────────────────────────────────────────
function classifyImgErr(status, timeout, body) {
  const b = (body || "").toLowerCase();
  const modelMissing = status === 404 || b.includes("model_not_found") || b.includes("does not exist")
    || b.includes("no such model") || b.includes("unknown model") || b.includes("invalid model");
  if (timeout) return { cls: "TIMEOUT", transient: true, modelMissing: false };
  if (status === 429) return { cls: "RATE_LIMIT", transient: true, modelMissing: false };
  if (status >= 500) return { cls: "PROVIDER_ERROR", transient: true, modelMissing: false };
  if (status === 401 || status === 403) return { cls: "AUTH_ERROR", transient: false, modelMissing: false };
  if (modelMissing) return { cls: "INVALID_REQUEST", transient: false, modelMissing: true };
  if (status === 400) {
    if (b.includes("moderation") || b.includes("safety") || b.includes("content_policy")
        || b.includes("content policy") || b.includes("rejected") || b.includes("blocked")) {
      return { cls: "MODERATION", transient: false, modelMissing: false };
    }
    return { cls: "INVALID_REQUEST", transient: false, modelMissing: false };
  }
  return { cls: "PROVIDER_ERROR", transient: false, modelMissing: false };
}

// script: her API çağrısında sırayla dönecek yanıtlar. { url } | { status, body } | { timeout:true }
function runChain(chain, script) {
  const MAX_CALLS = 3;
  let calls = 0;
  const doCall = () => script[calls - 1] || { status: 500, body: "script-exhausted" };
  for (let mi = 0; mi < chain.length; mi++) {
    const isPrimary = mi === 0;
    let transientTries = 0;
    while (calls < MAX_CALLS) {
      calls++;
      const res = doCall();
      if (res.url) return { url: res.url, calls };
      const ci = classifyImgErr(res.status || 0, !!res.timeout, res.body || "");
      if (ci.transient && transientTries < 1 && calls < MAX_CALLS) { transientTries++; continue; }
      const goFallback = isPrimary && (mi + 1 < chain.length) && (ci.modelMissing || ci.transient);
      if (goFallback) break;
      return { url: "", calls };
    }
    if (calls >= MAX_CALLS) break;
  }
  return { url: "", calls };
}

const CHAIN = ["gpt-image-1.5", "gpt-image-1"];   // [birincil, yedek]

test("Kalıcı 400 (geçersiz istek) → toplam 1 çağrı, üretim yok, yedeğe geçilmez", () => {
  const r = runChain(CHAIN, [{ status: 400, body: "invalid size param" }]);
  assert.equal(r.calls, 1);
  assert.equal(r.url, "");
});

test("Kalıcı 400 (moderasyon) → toplam 1 çağrı (aynı prompt yedekte de reddedilir)", () => {
  const r = runChain(CHAIN, [{ status: 400, body: "request rejected by content_policy" }]);
  assert.equal(r.calls, 1);
  assert.equal(r.url, "");
});

test("429 ardından başarı → 2 çağrı (aynı model bir kez daha)", () => {
  const r = runChain(CHAIN, [{ status: 429, body: "rate limit" }, { url: "data:image/jpeg;base64,AAAA" }]);
  assert.equal(r.calls, 2);
  assert.ok(r.url);
});

test("Birincil model YOK + yedek başarı → 2 çağrı", () => {
  const r = runChain(CHAIN, [{ status: 404, body: "the model gpt-image-1.5 does not exist" }, { url: "data:image/jpeg;base64,BBBB" }]);
  assert.equal(r.calls, 2);
  assert.ok(r.url);
});

test("Birincil geçici İKİ deneme + yedek başarı → 3 çağrı", () => {
  const r = runChain(CHAIN, [{ status: 429, body: "rl" }, { status: 500, body: "server" }, { url: "data:image/jpeg;base64,CCCC" }]);
  assert.equal(r.calls, 3);
  assert.ok(r.url);
});

test("Sürekli geçici hata → MUTLAK EN FAZLA 3 çağrı", () => {
  const r = runChain(CHAIN, [{ status: 429 }, { status: 429 }, { status: 429 }, { status: 429 }, { status: 429 }]);
  assert.equal(r.calls, 3);
  assert.equal(r.url, "");
});

test("Normal başarı → tek çağrı", () => {
  const r = runChain(CHAIN, [{ url: "data:image/jpeg;base64,DDDD" }]);
  assert.equal(r.calls, 1);
  assert.ok(r.url);
});

// ── Faz 4: Gemini TEK model zinciri (yedek yok) — çağrı bütçesi aynı orchestrator ──
const GEMINI = ["gemini-2.5-flash-image"];   // varsayılan Gemini zinciri (tek model)

test("Gemini tek model: normal başarı → 1 çağrı", () => {
  const r = runChain(GEMINI, [{ url: "data:image/png;base64,GGGG" }]);
  assert.equal(r.calls, 1);
  assert.ok(r.url);
});

test("Gemini tek model: 429 → başarı → 2 çağrı (aynı model bir kez daha)", () => {
  const r = runChain(GEMINI, [{ status: 429, body: "RESOURCE_EXHAUSTED" }, { url: "data:image/png;base64,HHHH" }]);
  assert.equal(r.calls, 2);
  assert.ok(r.url);
});

test("Gemini tek model: kalıcı 400 → 1 çağrı (yedek yok, boş çağrı üretmez)", () => {
  const r = runChain(GEMINI, [{ status: 400, body: "INVALID_ARGUMENT" }]);
  assert.equal(r.calls, 1);
  assert.equal(r.url, "");
});

test("Gemini tek model: sürekli geçici hata → MUTLAK EN FAZLA 2 çağrı (tek model, yedek yok)", () => {
  const r = runChain(GEMINI, [{ status: 500 }, { status: 500 }, { status: 500 }]);
  assert.equal(r.calls, 2);
  assert.equal(r.url, "");
});

test("Gemini güvenlik engeli (200 ama görsel yok → 400 blocked) → MODERATION, 1 çağrı", () => {
  // callGemini blockReason'ı status=400 body='blocked: SAFETY' olarak döndürür
  assert.equal(classifyImgErr(400, false, "blocked: SAFETY").cls, "MODERATION");
  const r = runChain(GEMINI, [{ status: 400, body: "blocked: SAFETY" }]);
  assert.equal(r.calls, 1);
  assert.equal(r.url, "");
});

test("Hata sınıfları doğru atanır", () => {
  assert.equal(classifyImgErr(429, false, "").cls, "RATE_LIMIT");
  assert.equal(classifyImgErr(401, false, "").cls, "AUTH_ERROR");
  assert.equal(classifyImgErr(403, false, "").cls, "AUTH_ERROR");
  assert.equal(classifyImgErr(400, false, "bad param").cls, "INVALID_REQUEST");
  assert.equal(classifyImgErr(400, false, "blocked by safety").cls, "MODERATION");
  assert.equal(classifyImgErr(500, false, "").cls, "PROVIDER_ERROR");
  assert.equal(classifyImgErr(0, true, "timeout").cls, "TIMEOUT");
});

// ── Kredi güvenliği: idempotency + iade (SQL reserve_credits desenini yansıtır) ──
test("Aynı opId ile ikinci rezervasyon YENİ kredi düşmez (idempotent)", () => {
  // reserve_credits: 'select * where job=p_job; if found → var olanı döndür'
  const reservations = new Map();
  let debited = 0;
  const reserve = (opId, amount) => {
    if (reservations.has(opId)) return { reserved: reservations.get(opId) !== "refunded", fresh: false };
    reservations.set(opId, "reserved"); debited += amount; return { reserved: true, fresh: true };
  };
  const a = reserve("op-1", 12);
  const b = reserve("op-1", 12);   // tekrar deneme AYNI opId
  assert.equal(a.fresh, true);
  assert.equal(b.fresh, false);
  assert.equal(debited, 12);       // yalnız BİR kez düşüldü
});

test("Başarısızlıkta iade korunur (reserved=true & url yok → refund)", () => {
  const decideRefund = (reserved, url) => reserved && !url;
  assert.equal(decideRefund(true, ""), true);
  assert.equal(decideRefund(true, "data:..."), false);
  assert.equal(decideRefund(false, ""), false);
});

// ── (B) GERÇEK KAYNAK DOSYA DEĞİŞMEZLERİ ────────────────────────────────────
const indexSrc = readFileSync(join(HERE, "index.ts"), "utf8");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("index.ts: birincil model varsayılanı gpt-image-1.5, yedek gpt-image-1", () => {
  assert.ok(indexSrc.includes('Deno.env.get("TA_IMAGE_PRIMARY_MODEL") || "gpt-image-1.5"'));
  assert.ok(indexSrc.includes('Deno.env.get("TA_IMAGE_FALLBACK_MODEL") || "gpt-image-1"'));
});

test("index.ts: gpt-image-2 varsayılan zincirden ÇIKARILDI, dall-e-3 KALDIRILDI", () => {
  assert.ok(!indexSrc.includes('"gpt-image-2,gpt-image-1.5,gpt-image-1"'), "eski TA_IMAGE_MODELS zinciri kalmamalı");
  assert.ok(!indexSrc.includes('model: "dall-e-3"') && !indexSrc.includes('"dall-e-3"'), "dall-e-3 API yedeği kaldırılmalı");
});

test("index.ts: MUTLAK çağrı tavanı 3 + CREDIT_SYSTEM_UNAVAILABLE 503 + hata sınıfları", () => {
  assert.ok(indexSrc.includes("const MAX_CALLS = 3;"));
  assert.ok(indexSrc.includes("CREDIT_SYSTEM_UNAVAILABLE"));
  for (const c of ["RATE_LIMIT", "AUTH_ERROR", "INVALID_REQUEST", "MODERATION", "PROVIDER_ERROR", "TIMEOUT"]) {
    assert.ok(indexSrc.includes(c), "hata sınıfı eksik: " + c);
  }
});

test("index.ts: ücretli görselde rezervasyon yoksa 503 döner, spendSafe'e sessiz düşüş YOK", () => {
  // image bloğunda artık '=== "gorsel"' başarı yolunda spendSafe çağrısı olmamalı
  const imgBlock = indexSrc.slice(indexSrc.indexOf('String(b.action || "") === "image"'), indexSrc.indexOf('GÖRSEL DÜZENLEME'));
  assert.ok(imgBlock.includes("!res.reserved"), "rezervasyon-yok koruması olmalı");
  assert.ok(imgBlock.includes("503"), "503 dönüşü olmalı");
  assert.ok(!imgBlock.includes('spendSafe(admin, userId, cost, "gorsel")'), "image başarı yolunda spendSafe sessiz düşüşü kalmamalı");
});

test("index.ts: Faz 4 Gemini sağlayıcısı — endpoint/model/anahtar/parse doğru", () => {
  assert.ok(indexSrc.includes('Deno.env.get("TA_IMAGE_PROVIDER") || "openai"'), "TA_IMAGE_PROVIDER anahtarı olmalı (varsayılan openai)");
  assert.ok(indexSrc.includes('generativelanguage.googleapis.com/v1beta/models/${model}:generateContent'), "resmi Gemini generateContent endpoint'i olmalı");
  assert.ok(indexSrc.includes('Deno.env.get("TA_GEMINI_IMAGE_MODEL") || "gemini-2.5-flash-image"'), "varsayılan Gemini modeli gemini-2.5-flash-image olmalı");
  assert.ok(indexSrc.includes('"x-goog-api-key": gkey'), "Gemini API anahtarı x-goog-api-key header ile geçmeli");
  assert.ok(indexSrc.includes('Deno.env.get("GEMINI_API_KEY")'), "GEMINI_API_KEY okunmalı");
  assert.ok(indexSrc.includes("responseModalities"), "responseModalities gönderilmeli");
  assert.ok(indexSrc.includes("inlineData") && indexSrc.includes("inline_data"), "yanıt inlineData/inline_data'dan okunmalı");
});

test("index.ts: provider=gemini iken OpenAI OTOMATİK ÇAĞRILMAZ (erken return)", () => {
  // generateImage GÖVDESİ içinde sırayı kontrol et (global 'const key' başka fonksiyonlarda da var)
  const fnStart = indexSrc.indexOf("async function generateImage(");
  const fnEnd = indexSrc.indexOf("async function generateSpeech(");
  const body = indexSrc.slice(fnStart, fnEnd);
  const gemBranch = body.indexOf('if (provider === "gemini")');
  const gemReturn = body.indexOf('return await runImageChain(gchain, "gemini"');
  const openaiBranch = body.indexOf("OPENAI YOLU (VARSAYILAN)");
  const openaiCall = body.indexOf('fetchT("https://api.openai.com');
  assert.ok(fnStart >= 0 && fnEnd > fnStart, "generateImage gövdesi bulunmalı");
  assert.ok(gemBranch >= 0 && gemReturn > gemBranch, "gemini dalı olmalı ve runImageChain ile bitmeli");
  assert.ok(openaiBranch > gemReturn, "OpenAI dalı gemini return'ünden SONRA gelmeli (gemini iken erişilmez)");
  assert.ok(openaiCall > gemReturn, "OpenAI API çağrısı gemini return'ünden SONRA (gemini iken çağrılmaz)");
});

test("index.ts: ortak orchestrator + Faz 3 değişmezleri korunur", () => {
  assert.ok(indexSrc.includes("async function runImageChain("), "ortak orchestrator olmalı");
  assert.ok(indexSrc.includes("const MAX_CALLS = 3;"), "MUTLAK çağrı tavanı 3 korunmalı");
  assert.ok(indexSrc.includes('runImageChain(chain, "openai"'), "OpenAI yolu da ortak orchestrator'ı kullanmalı");
});

test("Studio.dc.html: toplu sahne üretimi concurrency=1", () => {
  assert.ok(studioSrc.includes("}, 1, (fin) => this.setState({ batchDone: fin }));"),
    "genAllScenes runPool concurrency 1 olmalı");
});

test("Studio.dc.html: imageServer istemci-tarafı retry döngüsü KALDIRILDI", () => {
  const start = studioSrc.indexOf("async imageServer(");
  const end = studioSrc.indexOf("_cropAspectBlob(");
  const body = studioSrc.slice(start, end);
  assert.ok(start >= 0 && end > start, "imageServer bulunmalı");
  assert.ok(!body.includes("for (let attempt = 0; attempt < 3; attempt++)"), "istemci retry döngüsü kalmamalı");
  assert.ok(!body.includes("1200 * (attempt + 1)"), "istemci backoff kalmamalı");
  assert.ok(body.includes("RETRY FIRTINASI DURDURULDU"), "Faz 3 notu olmalı");
});
