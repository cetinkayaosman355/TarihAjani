// ============================================================================
// MERKEZİ STİL + KART META (teknik şeffaflık) — STATİK DOĞRULAMA
// Çalıştır:  node supabase/functions/studio-generate/style_meta.test.mjs
//
// (A) styleTemplate aynası: yalnız seçilen stilin şablonu; stiller karışmaz.
// (B) imageInfo aynası: PNG/JPEG başlığından çözünürlük + biçim + bayt.
// (C/D) Gerçek index.ts + Studio.dc.html değişmezleri.
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const indexSrc = readFileSync(join(HERE, "index.ts"), "utf8");
const studioSrc = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

// ── (A) styleTemplate aynası ────────────────────────────────────────────────
const STYLE_TEMPLATES = {
  sinematik: "dark moody cinematic film still ...",
  hollywood: "ultra-photorealistic cinematic still ...",
  belgeselfoto: "clean realistic documentary photograph ...",
  gravur: "vintage engraving illustration ...",
  minyatur: "traditional Ottoman-Persian miniature illustration ...",
  animasyon: "high-quality 3D animated feature film still ...",
};
function styleTemplate(id) {
  const t = STYLE_TEMPLATES[String(id || "").trim().toLowerCase()];
  return t ? ("\n\nSTYLE (only this style applies): " + t + ".") : "";
}
test("Stil: yalnız seçilen stilin şablonu eklenir; stiller KARIŞMAZ", () => {
  const g = styleTemplate("gravur");
  assert.ok(g.includes("engraving"), "gravür şablonu");
  assert.ok(!g.includes("documentary") && !g.includes("miniature") && !g.includes("3D animated"), "başka stil karışmamalı");
  assert.equal(styleTemplate("banana"), "", "geçersiz stil → boş");
  assert.equal(styleTemplate(""), "", "boş stil → boş");
});

// ── (B) imageInfo aynası (PNG/JPEG boyut + bayt) ────────────────────────────
function imageInfo(dataUri) {
  const out = { w: 0, h: 0, bytes: 0, fmt: "" };
  const m = /^data:image\/([a-z0-9.+-]+);base64,(.*)$/i.exec(dataUri || "");
  if (!m) return out;
  out.fmt = m[1].toLowerCase() === "jpg" ? "jpeg" : m[1].toLowerCase();
  let bin;
  try { bin = Buffer.from(m[2], "base64").toString("binary"); } catch { return out; }
  out.bytes = bin.length;
  const b = (i) => bin.charCodeAt(i) & 0xff;
  if (out.bytes > 24 && b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) {
    out.fmt = "png";
    out.w = (b(16) << 24) | (b(17) << 16) | (b(18) << 8) | b(19);
    out.h = (b(20) << 24) | (b(21) << 16) | (b(22) << 8) | b(23);
    return out;
  }
  if (out.bytes > 4 && b(0) === 0xff && b(1) === 0xd8) {
    out.fmt = "jpeg";
    let i = 2;
    while (i + 9 < out.bytes) {
      if (b(i) !== 0xff) { i++; continue; }
      const marker = b(i + 1);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        out.h = (b(i + 5) << 8) | b(i + 6);
        out.w = (b(i + 7) << 8) | b(i + 8);
        return out;
      }
      const len = (b(i + 2) << 8) | b(i + 3);
      if (len < 2) break;
      i += 2 + len;
    }
  }
  return out;
}
function pngDataUri(w, h) {
  const buf = Buffer.alloc(40);
  buf[0] = 0x89; buf[1] = 0x50; buf[2] = 0x4e; buf[3] = 0x47; buf[4] = 0x0d; buf[5] = 0x0a; buf[6] = 0x1a; buf[7] = 0x0a;
  buf.writeUInt32BE(13, 8); buf.write("IHDR", 12); buf.writeUInt32BE(w, 16); buf.writeUInt32BE(h, 20);
  return "data:image/png;base64," + buf.toString("base64");
}
function jpegDataUri(w, h) {
  const buf = Buffer.alloc(20);
  buf[0] = 0xff; buf[1] = 0xd8; buf[2] = 0xff; buf[3] = 0xc0; buf[4] = 0x00; buf[5] = 0x11; buf[6] = 0x08;
  buf.writeUInt16BE(h, 7); buf.writeUInt16BE(w, 9);
  return "data:image/jpeg;base64," + buf.toString("base64");
}
test("imageInfo: PNG boyut + biçim + bayt doğru", () => {
  const info = imageInfo(pngDataUri(1024, 1536));
  assert.equal(info.w, 1024); assert.equal(info.h, 1536); assert.equal(info.fmt, "png");
  assert.ok(info.bytes >= 40);
});
test("imageInfo: JPEG boyut + biçim doğru", () => {
  const info = imageInfo(jpegDataUri(1536, 1024));
  assert.equal(info.w, 1536); assert.equal(info.h, 1024); assert.equal(info.fmt, "jpeg");
});
test("imageInfo: data URI değilse boş (üretim etkilenmez)", () => {
  const info = imageInfo("https://x/y.png");
  assert.equal(info.w, 0); assert.equal(info.bytes, 0);
});

// ── (C) GERÇEK index.ts ─────────────────────────────────────────────────────
test("index.ts: merkezi STYLE_TEMPLATES (6 stil) + styleTemplate + generateImage'a style", () => {
  for (const k of ["sinematik", "hollywood", "belgeselfoto", "gravur", "minyatur", "animasyon"]) {
    assert.ok(new RegExp(k + ":").test(indexSrc), "stil eksik: " + k);
  }
  assert.ok(indexSrc.includes("function styleTemplate("), "styleTemplate olmalı");
  assert.ok(indexSrc.includes("+ styleTemplate(style) + NO_SPLIT"), "stil promptun başına eklenmeli (merkezi)");
  assert.ok(indexSrc.includes("style?: string): Promise<string>"), "generateImage style parametresi almalı");
});
test("index.ts: imageInfo parser + META 9 alan yanıtta döner", () => {
  assert.ok(indexSrc.includes("function imageInfo("), "imageInfo parser olmalı");
  const mBlk = indexSrc.slice(indexSrc.indexOf("const meta = {"), indexSrc.indexOf("const meta = {") + 400);
  for (const f of ["provider:", "model:", "style:", "format:", "aspect:", "resolution:", "bytes:", "ms:", "cost"]) {
    assert.ok(mBlk.includes(f), "meta alanı eksik: " + f);
  }
  assert.ok(indexSrc.includes("credits: res.credits, meta }") || indexSrc.includes("charged: false, meta }"), "meta yanıtta dönmeli");
  assert.ok(indexSrc.includes("diag.model = model") && indexSrc.includes("diag.provider = provider"), "gerçek model/sağlayıcı meta'ya geçmeli");
});

// ── (D) GERÇEK Studio.dc.html ───────────────────────────────────────────────
test("Studio.dc.html: stil ANAHTARI sunucuya gider; istemci prompt'a stil BAKMAZ", () => {
  assert.ok(studioSrc.includes("style: style || (this.state.imgStyle || this.state.style)"), "istek gövdesinde style anahtarı");
  assert.ok(!studioSrc.includes("this.imgStylePhrase("), "istemci stil şablonu çağrısı kalmamalı (merkezi)");
  assert.ok(!studioSrc.includes("imgStylePhrase(id)"), "istemci stil şablonu tanımı kaldırılmalı");
  assert.ok(studioSrc.includes("withAspect(p, arKey) {"), "withAspect artık styleKey almamalı");
});
test("Studio.dc.html: imageServer meta döner; kart meta satırları gösterir", () => {
  assert.ok(studioSrc.includes("return { url: data.url, meta: data.meta || null };"), "imageServer {url, meta} dönmeli");
  assert.ok(studioSrc.includes("_imgMetaRows(m)"), "meta satır formatlayıcı olmalı");
  assert.ok(studioSrc.includes("hasMeta: metaRows.length > 0"), "kart VM meta bayrağı");
  assert.ok(studioSrc.includes("{{ iq.hasMeta }}") && studioSrc.includes("{{ mr.k }}") && studioSrc.includes("{{ mr.v }}"), "kart şablonu meta bloğu");
  // 9 alan etiketleri formatlayıcıda
  for (const lbl of ["Sağlayıcı", "Model", "Stil", "Biçim", "Kadraj", "Çözünürlük", "Boyut", "Süre", "Kredi"]) {
    assert.ok(studioSrc.includes("'" + lbl + "'"), "meta etiketi eksik: " + lbl);
  }
});
