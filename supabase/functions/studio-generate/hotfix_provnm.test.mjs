// ============================================================================
// P0 HOTFIX — renderVals çökmesi: this._provNm is not a function
// Çalıştır:  node supabase/functions/studio-generate/hotfix_provnm.test.mjs
//
// KÖK NEDEN: genAllLabel içinde this._provNm() ÇAĞRILIYOR ama _provNm helper'ı
// merge sırasında kaybolmuş (0 tanım) → her renderVals() throw → tüm Studio down.
// Bu test: (1) _provNm KAYNAKTA tanımlı, (2) kullanılan yerde tanımı da var,
// (3) metadata eksik/eski kayıtlarda kart formatlayıcı ASLA throw etmez ('-'/'Bilinmiyor').
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

// ── Kaynak değişmezleri: _provNm HEM kullanılıyor HEM tanımlı ────────────────
test("Studio.dc.html: _provNm HEM kullanılıyor HEM tanımlı (regresyon kilidi)", () => {
  assert.ok(studioSrc.includes("this._provNm("), "genAllLabel _provNm çağırıyor");
  assert.ok(studioSrc.includes("_provNm(p) {"), "_provNm helper'ı studio scope'unda TANIMLI olmalı");
});
test("Studio.dc.html: metadata helper'ları tanımlı (kayıp yok)", () => {
  assert.ok(studioSrc.includes("_imgMetaCard(m) {"), "_imgMetaCard tanımlı");
  assert.ok(studioSrc.includes("_modelLabel(id) {"), "_modelLabel tanımlı");
  assert.ok(!studioSrc.includes("this._imgMetaRows("), "kaldırılmış _imgMetaRows çağrısı kalmamalı");
});

// ── _provResolve + _provNm aynası (PR-2): 'auto' arayüz kavramı, sunucuya GERÇEK
// motor gider; ad yalnız gerçek motorlar için — ASLA throw etmez, string döner ──
function provResolve(p, state) {
  const k = String(p || (state && state.imgProvider) || "").toLowerCase();
  if (k === "gemini") return "gemini";
  if (k === "gpt") return "gpt";
  return "gpt";   // '', 'auto', 'higgs', bilinmeyen → varsayılan gerçek motor
}
function provNm(p, state) {
  return ({ gpt: "GPT", gemini: "Gemini" })[provResolve(p, state)] || "GPT";
}
test("_provResolve: 'auto' sunucuya sızmaz — her girişte gerçek motor", () => {
  assert.equal(provResolve("auto"), "gpt", "auto → gpt (varsayılan gerçek motor)");
  assert.equal(provResolve(""), "gpt");
  assert.equal(provResolve("gemini"), "gemini");
  assert.equal(provResolve(null, { imgProvider: "auto" }), "gpt", "state'te auto olsa da gerçek motor");
  assert.equal(provResolve("higgs"), "gpt", "pasif/bilinmeyen sağlayıcı istekte gpt'ye çözülür");
});
test("_provNm: bilinen motorlar + güvenli varsayılan (throw yok)", () => {
  assert.equal(provNm("gpt"), "GPT");
  assert.equal(provNm("gemini"), "Gemini");
  assert.equal(provNm("auto"), "GPT", "Otomatik → çözümlenen motor adı");
  assert.equal(provNm(undefined, {}), "GPT", "state.imgProvider yoksa GPT");
  assert.equal(provNm(null, { imgProvider: "gemini" }), "Gemini", "state'ten okur");
  assert.equal(provNm("bilinmeyen"), "GPT", "bilinmeyen → güvenli GPT (throw yok)");
});

// ── _imgMetaCard aynası: eksik/eski kayıt sayfayı ÇÖKERTMEZ ──────────────────
function modelLabel(id) {
  const key = String(id || "").trim().toLowerCase();
  return ({ "gpt-image-1": "GPT Image 1", "gpt-image-1.5": "GPT Image 1.5", "gemini-2.5-flash-image": "Gemini 2.5 Flash Image" })[key] || String(id || "");
}
function imgMetaCard(m) {
  if (!m) return { has: false, prov: "", style: "", rows: [] };
  const dash = (v) => (v === undefined || v === null || v === "") ? "-" : String(v);
  const kb = m.bytes ? (m.bytes >= 1048576 ? (m.bytes / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(m.bytes / 1024)) + " KB") : "";
  const sn = m.ms ? (m.ms / 1000).toFixed(1) + " sn" : "";
  const rows = [
    ["Model", m.model ? modelLabel(m.model) : "-"], ["Kadraj", dash(m.aspect)], ["Çözünürlük", dash(m.resolution)],
    ["Format", dash(m.format)], ["Dosya Boyutu", dash(kb)], ["Üretim Süresi", dash(sn)],
    ["Harcanan Kredi", (typeof m.cost === "number" ? m.cost + " KR" : "-")]
  ].map(r => ({ k: r[0], v: String(r[1]) }));
  const prov = m.provider ? String(m.provider) : "Bilinmiyor";
  const style = m.style ? String(m.style) : "";
  return { has: true, prov, style, rows };
}

test("GPT metadata tam → doğru render (prov GPT, model kullanıcı-dostu)", () => {
  const c = imgMetaCard({ provider: "GPT", model: "gpt-image-1.5", style: "Sinematik", aspect: "9:16", resolution: "1024×1536", format: "PNG", bytes: 3_100_000, ms: 12000, cost: 20 });
  assert.equal(c.has, true);
  assert.equal(c.prov, "GPT");
  assert.equal(c.style, "Sinematik");
  assert.equal(c.rows.find(r => r.k === "Model").v, "GPT Image 1.5");
  assert.equal(c.rows.find(r => r.k === "Çözünürlük").v, "1024×1536");
  assert.equal(c.rows.find(r => r.k === "Harcanan Kredi").v, "20 KR");
});
test("Gemini metadata tam → doğru render", () => {
  const c = imgMetaCard({ provider: "Gemini", model: "gemini-2.5-flash-image", style: "Belgesel", aspect: "16:9", resolution: "1536×1024", format: "PNG", bytes: 2_800_000, ms: 9000, cost: 12 });
  assert.equal(c.prov, "Gemini");
  assert.equal(c.rows.find(r => r.k === "Model").v, "Gemini 2.5 Flash Image");
  assert.equal(c.rows.find(r => r.k === "Kadraj").v, "16:9");
});
test("ESKİ/EKSİK kayıt sayfayı çökertmez: null → gizli; boş meta → '-'/'Bilinmiyor'", () => {
  assert.doesNotThrow(() => imgMetaCard(null));
  assert.equal(imgMetaCard(null).has, false, "meta yoksa kart gizli (çökme yok)");
  assert.doesNotThrow(() => imgMetaCard({}));
  const empty = imgMetaCard({});
  assert.equal(empty.has, true);
  assert.equal(empty.prov, "Bilinmiyor", "sağlayıcı bilinmiyorsa 'Bilinmiyor'");
  assert.equal(empty.rows.find(r => r.k === "Model").v, "-", "model bilinmiyorsa '-'");
  assert.ok(empty.rows.every(r => typeof r.v === "string" && r.v.length > 0), "hiçbir alan boş bırakılmaz");
  // Kısmi eski kayıt (yalnız sağlayıcı) → diğer alanlar '-'
  const partial = imgMetaCard({ provider: "GPT" });
  assert.equal(partial.prov, "GPT");
  assert.equal(partial.rows.find(r => r.k === "Format").v, "-");
});
