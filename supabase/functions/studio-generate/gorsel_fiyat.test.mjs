// ============================================================================
// GÖRSEL MODEL BAZLI FİYAT: GPT Image 2=20 · 1.5=12 · 1=8 · Gemini=12
// + KISMİ KESİNLEŞTİRME (yedeğe düşünce fark iade — "gerçek maliyet")
// Çalıştır: node --test supabase/functions/studio-generate/gorsel_fiyat.test.mjs
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
const sqlSrc = readFileSync(join(REPO, "supabase", "migrations", "20260721b_gorsel_model_fiyat.sql"), "utf8");

// ── (A) KAYNAK DEĞİŞMEZLERİ ─────────────────────────────────────────────────
test("Backend: model bazlı fiyat 20/12/8", () => {
  assert.ok(indexSrc.includes('if (m === "gpt-image-2") return 20'), "GPT Image 2 = 20");
  assert.ok(indexSrc.includes('if (m === "gpt-image-1.5") return 12'), "GPT Image 1.5 = 12");
  assert.ok(indexSrc.includes('if (m === "gpt-image-1") return 8'), "GPT Image 1 = 8");
  assert.ok(indexSrc.includes("function imgRequestPrice("), "istenen fiyat çözücü");
  assert.ok(indexSrc.includes("? imgRequestPrice(b)"), "image rezerve fiyatı model bazlı");
});

test("Backend: GERÇEK MALİYET — üretilen modele göre settle (fark iade)", () => {
  assert.ok(indexSrc.includes("async function settleOp("), "settle yardımcısı");
  assert.ok(indexSrc.includes('rpc("settle_reservation"'), "settle RPC çağrısı");
  assert.ok(indexSrc.includes('rpc("finalize_reservation"'), "settle yoksa finalize'a düşer (geriye uyum)");
  assert.ok(indexSrc.includes("const actualCost = (cost > 0)"), "gerçek maliyet üretilen modelden");
  assert.ok(indexSrc.includes("Math.min(cost,"), "gerçek maliyet rezerveyi AŞAMAZ");
  assert.ok(indexSrc.includes("await settleOp(admin, userId, opId, actualCost)"), "başarıda settle ile kesinleşir");
  assert.ok(indexSrc.includes("cost: actualCost, meta })"), "yanıt gerçek maliyeti döner");
});

test("Migration: settle_reservation kısmi iade + idempotent + yalnız service_role", () => {
  assert.ok(sqlSrc.includes("function public.settle_reservation(p_user uuid, p_job text, p_final int)"), "settle imzası");
  assert.ok(sqlSrc.includes("refund_tot := r.amount - keep_amt"), "fazla ayrılan hesaplanır");
  assert.ok(sqlSrc.includes("r.status <> 'reserved'"), "idempotent (yalnız reserved)");
  assert.ok(sqlSrc.includes("refund_top := least(refund_tot, r.used_top)"), "önce topup kovadan iade");
  assert.ok(sqlSrc.includes("to service_role"), "yalnız edge function çağırır");
});

test("Frontend: IMG_COST model bazlı (panel/sahne motoru)", () => {
  assert.ok(studioSrc.includes("IMG_PRICE(prov)"), "model fiyat çözücü");
  assert.ok(studioSrc.includes("{ gpt: 20, gpt1: 8, gemini: 12 }"), "istemci fiyat tablosu sunucuyla aynı");
  assert.ok(studioSrc.includes("IMG_COST(idx, prov)"), "IMG_COST motoru dikkate alır");
  assert.ok(studioSrc.includes("(this.resolveImageGenerationSettings(kind + i) || {}).resolvedProvider"), "sahne kartı kendi motorunun fiyatını gösterir");
  assert.ok(studioSrc.includes("GPT Image 2 · 20 KR, GPT Image 1 · 8 KR"), "kullanıcı diliyle fiyat açıklaması");
});

// ── (B) SAF AYNALAR ─────────────────────────────────────────────────────────
const price = (m) => m === "gpt-image-2" ? 20 : m === "gpt-image-1.5" ? 12 : m === "gpt-image-1" ? 8 : 12;
test("Ayna: her modelin fiyatı", () => {
  assert.equal(price("gpt-image-2"), 20);
  assert.equal(price("gpt-image-1.5"), 12);
  assert.equal(price("gpt-image-1"), 8);
  assert.equal(price("gemini-x"), 12);
});
// settle aynası: reserve(req) → produce(actual) → charge=min(req,actual), refund=req-charge
function settle(reqModel, usedModel) {
  const reserved = price(reqModel);
  const actual = Math.min(reserved, price(usedModel));
  return { charged: actual, refunded: reserved - actual };
}
test("Ayna: GPT Image 2 istendi, gpt-image-2 üretti → 20 düşer, iade yok", () => {
  assert.deepEqual(settle("gpt-image-2", "gpt-image-2"), { charged: 20, refunded: 0 });
});
test("Ayna: GPT Image 2 istendi, yedeğe (gpt-image-1) düşüldü → yalnız 8 düşer, 12 iade", () => {
  assert.deepEqual(settle("gpt-image-2", "gpt-image-1"), { charged: 8, refunded: 12 });
});
test("Ayna: GPT Image 2 → gpt-image-1.5 yedeği → 12 düşer, 8 iade", () => {
  assert.deepEqual(settle("gpt-image-2", "gpt-image-1.5"), { charged: 12, refunded: 8 });
});
test("Ayna: GPT Image 1 elle seçildi → 8 düşer (rezerve=gerçek)", () => {
  assert.deepEqual(settle("gpt-image-1", "gpt-image-1"), { charged: 8, refunded: 0 });
});
