// ============================================================================
// OTONOM DESTEK AJANI — tanılama + jest (günlük tavan 2 işlem / 40 kredi)
// Çalıştır: node --test supabase/functions/studio-generate/destek_ajani.test.mjs
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
const sqlSrc = readFileSync(join(REPO, "supabase", "migrations", "20260721c_destek_jest.sql"), "utf8");

// ── (A) BACKEND: support ucu + guardrail ────────────────────────────────────
test("Backend: support ucu allowlist + authed + lookup/goodwill modları", () => {
  assert.ok(indexSrc.includes('"imgreclaim", "support"'), "support allowlist'te");
  assert.ok(indexSrc.includes('act === "imgreclaim" || act === "support"'), "support için giriş/admin şart");
  assert.ok(indexSrc.includes('if (act === "support")'), "handler mevcut");
  assert.ok(indexSrc.includes('if (mode === "lookup")'), "salt-okunur tanılama");
  assert.ok(indexSrc.includes("produced, charged, refundableReservation"), "üretildi/kredi düştü/iade-edilebilir döner");
});

test("Backend: jest sırası — önce güvenli iade, sonra tavanlı jest, sonra eskalasyon", () => {
  // 1) ücretsiz tekrar (para yok)
  assert.ok(indexSrc.includes('if (kind === "retry") return json({ ok: true, action: "retry"'), "retry: ücretsiz tekrar");
  // 2) asılı rezervasyon → güvenli iade (tavansız)
  assert.ok(indexSrc.includes("if (refundableReservation)") && indexSrc.includes('action: "refund_reserved"'), "asılı rezervasyon güvenli iade");
  // 3) kesinleşmiş ücret → goodwill_grant (günlük tavan)
  assert.ok(indexSrc.includes('rpc("goodwill_grant"'), "jest kredisi RPC");
  assert.ok(indexSrc.includes('Deno.env.get("TA_GOODWILL_DAILY_OPS")) || 2'), "günlük işlem tavanı 2 (varsayılan)");
  assert.ok(indexSrc.includes('Deno.env.get("TA_GOODWILL_DAILY_AMT")) || 40'), "günlük kredi tavanı 40 (varsayılan)");
  assert.ok(indexSrc.includes("Math.min(40, Number(resv?.amount)"), "jest tutarı op bedeliyle ve 40 ile sınırlı");
  assert.ok(indexSrc.includes('action: "escalate"'), "tavan/deyince insana devret");
});

test("Migration: goodwill_grant idempotent + günlük tavan + yalnız service_role", () => {
  assert.ok(sqlSrc.includes("function public.goodwill_grant(") , "RPC mevcut");
  assert.ok(sqlSrc.includes("'goodwill:' || p_user::text || ':' || coalesce(p_op,'')"), "op başına idempotent kilit");
  assert.ok(sqlSrc.includes("reason like 'goodwill:%' and created_at >= date_trunc('day', now())"), "günlük sayım");
  assert.ok(sqlSrc.includes("v_ops >= greatest(0, p_daily_ops)"), "işlem tavanı");
  assert.ok(sqlSrc.includes("least(p_amount, greatest(0, p_daily_amt) - v_sum)"), "kredi tavanı");
  assert.ok(sqlSrc.includes("unique_violation"), "yarış kapanır (tek jest)");
  assert.ok(sqlSrc.includes("to service_role"), "yalnız edge function");
});

// ── (B) FRONTEND: ajan direktifi + uygulama ─────────────────────────────────
test("Frontend: ajan [[GOODWILL:...]] direktifi verir; sistem uygular (kullanıcı görmez)", () => {
  assert.ok(studioSrc.includes("[[GOODWILL:retry:OPID]]") && studioSrc.includes("[[GOODWILL:refund:OPID]]"), "sistem prompt direktifleri öğretir");
  assert.ok(studioSrc.includes("GÜNLÜK TAVAN (kullanıcı başına 2 işlem / 40 kredi)"), "ajana tavan bildirilir");
  assert.ok(studioSrc.includes("raw.match(/\\[\\[GOODWILL:(refund|retry):([a-zA-Z0-9_-]+)\\]\\]/)"), "istemci direktifi ayrıştırır");
  assert.ok(studioSrc.includes('raw.replace(/\\[\\[GOODWILL:[^\\]]*\\]\\]/g'), "direktif kullanıcıya GÖSTERİLMEZ (temizlenir)");
  assert.ok(studioSrc.includes("_applyGoodwill(gw[1], gw[2])"), "direktif uygulanır");
  assert.ok(studioSrc.includes("async support(mode, opId, kind)"), "support çağırıcı");
});

test("Frontend: jest sonucu kullanıcıya net söylenir + bakiye güncellenir", () => {
  assert.ok(studioSrc.includes("krediyi hesabına iade ettim"), "iade mesajı");
  assert.ok(studioSrc.includes("Ücretsiz yeniden üretim hakkını tanımladım"), "retry mesajı");
  assert.ok(studioSrc.includes("otomatik iade sınırına takıldık"), "eskalasyon mesajı");
  assert.ok(studioSrc.includes("this.setState({ credits: res.credits }"), "bakiye güncellenir");
  // ajan hangi op olduğunu bilir (reportCtx)
  assert.ok(studioSrc.includes("AKTİF SORUN BAĞLAMI"), "op bağlamı prompta girer");
});

// ── (C) SAF AYNA: günlük tavan mantığı ──────────────────────────────────────
function goodwill(state, op, amount, dailyOps = 2, dailyAmt = 40) {
  if (state.grantedOps.has(op)) return { ok: true, granted: 0, code: "already" };
  if (state.opsToday >= dailyOps) return { ok: false, granted: 0, code: "daily_ops" };
  const grant = Math.min(amount, dailyAmt - state.sumToday);
  if (grant <= 0) return { ok: false, granted: 0, code: "daily_amt" };
  state.grantedOps.add(op); state.opsToday += 1; state.sumToday += grant;
  return { ok: true, granted: grant, code: "granted" };
}
test("Ayna: op başına tek jest (idempotent)", () => {
  const st = { grantedOps: new Set(), opsToday: 0, sumToday: 0 };
  assert.equal(goodwill(st, "op1", 12).granted, 12);
  assert.equal(goodwill(st, "op1", 12).code, "already");
  assert.equal(st.sumToday, 12);
});
test("Ayna: günde 2 işlem tavanı", () => {
  const st = { grantedOps: new Set(), opsToday: 0, sumToday: 0 };
  assert.equal(goodwill(st, "a", 8).code, "granted");
  assert.equal(goodwill(st, "b", 8).code, "granted");
  assert.equal(goodwill(st, "c", 8).code, "daily_ops");
});
test("Ayna: 40 kredi tavanı — üçüncü büyük jest kırpılır/engellenir", () => {
  const st = { grantedOps: new Set(), opsToday: 0, sumToday: 0 };
  assert.equal(goodwill(st, "a", 20, 5, 40).granted, 20);
  assert.equal(goodwill(st, "b", 20, 5, 40).granted, 20);   // toplam 40
  assert.equal(goodwill(st, "c", 20, 5, 40).code, "daily_amt");   // tavan dolu
});
