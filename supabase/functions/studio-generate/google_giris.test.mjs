// ============================================================================
// GOOGLE İLE GİRİŞ — Uyelik.dc.html üzerinde Supabase OAuth (Google)
// Şifresiz tek dokunuş giriş: signInWithOAuth({provider:'google'}) + dönüş yolu.
// Çalıştır: node --test supabase/functions/studio-generate/google_giris.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Uyelik.dc.html"), "utf8");

test("Google girişi: signInWithOAuth handler mevcut", () => {
  assert.ok(src.includes("googleLogin:"), "googleLogin handler'ı");
  assert.ok(src.includes("signInWithOAuth("), "Supabase OAuth çağrısı");
  assert.ok(src.includes("provider: 'google'"), "Google sağlayıcı");
});

test("Dönüş yolu: aynı sayfaya döner ve next korunur", () => {
  assert.ok(src.includes("redirectTo"), "redirectTo verilir");
  assert.ok(src.includes("this._next ? '?next='"), "next parametresi korunur");
});

test("UI: Google butonu + G logosu + VEYA ayırıcı", () => {
  assert.ok(src.includes("{{ googleLogin }}"), "buton handler'a bağlı");
  assert.ok(src.includes("GOOGLE İLE DEVAM ET"), "buton etiketi");
  assert.ok(src.includes(">VEYA<"), "ayırıcı");
  assert.ok(src.includes('fill="#EA4335"') && src.includes('fill="#4285F4"'), "Google G logosu (SVG)");
});

test("Güvenli: Supabase hazır değilse kilitlenmez", () => {
  const i = src.indexOf("googleLogin:");
  const seg = src.slice(i, i + 900);
  assert.ok(seg.includes("if (!this.sb)"), "sb yoksa erken çıkış");
});
