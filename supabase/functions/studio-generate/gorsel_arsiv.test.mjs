// ============================================================================
// PR A — GÖRSEL KALICILIĞI (hesaba bağlı arşiv) + GEÇMİŞ ÜRETİMLER
// Çalıştır:  node supabase/functions/studio-generate/gorsel_arsiv.test.mjs
//
// (A) Migration: studio_images tablosu + sütunlar + RLS + idempotent tekillik.
// (B) index.ts: başarılı görsel studio_images'e (upsert, best-effort) yazılır.
// (C) Studio.dc.html: bağlar gönderilir, sunucudan RLS ile okunur, galeri birleşir,
//     hidrasyon, bağımsız grup; EKSİK metadata ekranı çökertmez.
// (D) Saf mantık aynaları: galeri tekilleştirme, satır→kayıt güvenli dönüşüm, kind.
// ============================================================================
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const indexSrc = readFileSync(join(HERE, "index.ts"), "utf8");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");
const migPath = join(REPO, "supabase", "migrations", "20260720_studio_gorsel_arsiv.sql");

// ── (A) Migration ───────────────────────────────────────────────────────────
test("Migration: studio_images tablosu + gerekli bağlar + RLS + idempotent tekillik", () => {
  assert.ok(existsSync(migPath), "migration dosyası olmalı");
  const m = readFileSync(migPath, "utf8");
  assert.ok(/create table if not exists public\.studio_images/i.test(m), "studio_images tablosu");
  for (const col of ["user_id", "op_id", "file_id", "scene_key", "kind", "provider", "model", "style", "aspect", "resolution", "storage_url", "bytes", "spent_credits", "created_at"]) {
    assert.ok(new RegExp("\\b" + col + "\\b").test(m), "sütun eksik: " + col);
  }
  assert.ok(/unique\s*\(user_id,\s*op_id\)/i.test(m), "idempotent tekillik (user_id, op_id)");
  assert.ok(/enable row level security/i.test(m), "RLS açık");
  assert.ok(/for select using \(auth\.uid\(\) = user_id\)/i.test(m), "kullanıcı yalnız KENDİ görsellerini okur");
  assert.ok(/kind in \('scene','cover','standalone'\)/i.test(m), "kind check (scene/cover/standalone)");
});

// ── (B) index.ts server insert ──────────────────────────────────────────────
test("index.ts: başarılı görsel studio_images'e yazılır (idempotent, best-effort)", () => {
  assert.ok(indexSrc.includes('admin.from("studio_images").upsert('), "studio_images'e upsert");
  assert.ok(indexSrc.includes('onConflict: "user_id,op_id"'), "idempotent (op_id) — çift satır yok");
  assert.ok(indexSrc.includes("storage_url: url") && indexSrc.includes("spent_credits: cost"), "storage URL + harcanan kredi yazılır");
  assert.ok(indexSrc.includes('b.fileId') && indexSrc.includes('b.sceneKey') && indexSrc.includes('b.storyTitle'), "hikâye/sahne bağları gövdeden okunur");
  assert.ok(indexSrc.includes('url.indexOf("data:") !== 0'), "yalnız kalıcı Storage URL arşivlenir (data: değil)");
  // best-effort: arşiv hatası üretimi bozmamalı (try/catch sarmalı)
  const at = indexSrc.indexOf('admin.from("studio_images")');
  const seg = indexSrc.slice(at - 450, at + 800);
  assert.ok(seg.includes("try {") && seg.includes("catch"), "arşiv yazımı try/catch (üretimi bozmaz)");
  assert.ok(seg.includes("üretimi bozma") || seg.includes("best-effort"), "yorumda best-effort niyeti");
});

// ── (C) Studio.dc.html client ───────────────────────────────────────────────
test("Studio.dc.html: bağlar gönderilir + sunucudan RLS ile okunur + galeri birleşir", () => {
  assert.ok(studioSrc.includes("sceneKey, kind)") || studioSrc.includes("provider, sceneKey, kind"), "imageServer sceneKey/kind alır");
  assert.ok(studioSrc.includes("fileId:") && studioSrc.includes("storyTitle:") && studioSrc.includes("kind:"), "istek gövdesinde arşiv bağları");
  assert.ok(studioSrc.includes("from('studio_images')") && studioSrc.includes("async loadServerImages("), "sunucudan görsel listeler (RLS)");
  assert.ok(studioSrc.includes("_galleryItems()"), "yerel + sunucu galeri birleşimi");
  assert.ok(studioSrc.includes("_hydrateSceneImgs("), "hikâye açılışında sahne görselleri sunucudan doldurulur");
  assert.ok(studioSrc.includes("hasStandalone") && studioSrc.includes("standaloneImages") && studioSrc.includes("BAĞIMSIZ GÖRSELLER"), "Bağımsız Görseller grubu");
  assert.ok(!studioSrc.includes("bu cihazda kalıcı saklanır"), "yanıltıcı 'bu cihazda' metni kaldırıldı");
});

// ── (D) Saf mantık aynaları ─────────────────────────────────────────────────
function galleryItems(savedImgs, srvImages) {
  const seen = new Set(); const out = [];
  for (const rec of [...(savedImgs || []), ...(srvImages || [])]) {
    if (!rec || !rec.url || seen.has(rec.url)) continue;
    seen.add(rec.url); out.push(rec);
  }
  out.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return out;
}
test("Galeri: yerel + sunucu URL'e göre TEKİL; yerel kayıt kazanır (vidUrl korunur)", () => {
  const local = [{ url: "u1", ts: 2, vidUrl: "v1" }];
  const srv = [{ url: "u1", ts: 5 }, { url: "u2", ts: 3 }];
  const g = galleryItems(local, srv);
  assert.equal(g.length, 2, "u1 tekilleşir");
  assert.equal(g.find(x => x.url === "u1").vidUrl, "v1", "yerel (vidUrl) korunur");
  assert.deepEqual(g.map(x => x.url), ["u2", "u1"], "ts'e göre sıralı (u2 ts3 > u1 ts2)");
});

function srvRowToRec(r, fallbackAr) {
  if (!r || !r.storage_url) return null;
  const ar = r.aspect === "16:9" ? "yatay" : r.aspect === "1:1" ? "kare" : (r.aspect === "9:16" ? "dikey" : (fallbackAr || "dikey"));
  const meta = { provider: r.provider || "", model: r.model || "", style: r.style || "", aspect: r.aspect || "", resolution: r.resolution || "", bytes: (typeof r.bytes === "number" ? r.bytes : 0), cost: (typeof r.spent_credits === "number" ? r.spent_credits : undefined) };
  return { id: "srv_" + (r.op_id || "x"), url: r.storage_url, prompt: r.prompt || "", ar, meta, ts: r.created_at ? Date.parse(r.created_at) : Date.now(), fileId: r.file_id || "", kind: r.kind || "standalone", sceneKey: r.scene_key || "", story: r.story_title || "" };
}
test("EKSİK metadata satırı ekranı çökertmez (güvenli dönüşüm)", () => {
  assert.equal(srvRowToRec(null), null, "boş satır → null (atlanır)");
  assert.equal(srvRowToRec({ op_id: "o1" }), null, "storage_url yoksa → null");
  const rec = srvRowToRec({ storage_url: "https://x/y.png" });   // yalnız URL
  assert.ok(rec && rec.url === "https://x/y.png");
  assert.equal(rec.kind, "standalone", "kind yoksa standalone");
  assert.equal(rec.meta.provider, "", "eksik alan boş — throw yok");
  assert.equal(rec.meta.bytes, 0);
});

function kindOf(sceneKey) {
  return sceneKey === "kapak" ? "cover" : (/^[a-z]+\d+$/.test(sceneKey || "") ? "scene" : "standalone");
}
test("kind türetme: kapak→cover, gp3→scene, boş→standalone (Bağımsız)", () => {
  assert.equal(kindOf("kapak"), "cover");
  assert.equal(kindOf("gp3"), "scene");
  assert.equal(kindOf("gp0"), "scene");
  assert.equal(kindOf(""), "standalone");
  assert.equal(kindOf(undefined), "standalone");
});

function hydrate(fileNo, base, srvImages) {
  const out = Object.assign({}, base || {});
  if (!fileNo) return out;
  for (const rec of (srvImages || [])) {
    if (rec && rec.fileId === fileNo && rec.sceneKey) {
      const cur = out[rec.sceneKey] || {};
      if (!cur.url) out[rec.sceneKey] = Object.assign({}, cur, { url: rec.url, meta: rec.meta, done: true });
    }
  }
  return out;
}
test("Hidrasyon: sunucu sahne görselleri kartlara dolar; var olan yerel URL EZİLMEZ", () => {
  const srv = [{ fileId: "F1", sceneKey: "gp0", url: "s0" }, { fileId: "F1", sceneKey: "gp1", url: "s1" }, { fileId: "F2", sceneKey: "gp0", url: "z0" }];
  const base = { gp0: { url: "localA", done: true } };
  const out = hydrate("F1", base, srv);
  assert.equal(out.gp0.url, "localA", "yerel URL korunur (ezilmez)");
  assert.equal(out.gp1.url, "s1", "eksik sahne sunucudan dolar");
  assert.ok(!("z0" in out), "başka dosyanın görseli sızmaz");
});
