// ============================================================================
// KOMPOZİSYON PARİTESİ (GPT ↔ Gemini) — STATİK DOĞRULAMA
// Çalıştır:  node supabase/functions/studio-generate/composition.test.mjs
//
// Amaç: her iki sağlayıcı da aynı ölçek/kadraj hissini versin (Gemini fazla
// zoom-out üretiyordu). Yönerge prompt'un SONUNA eklenir; ORTAK 'p' üzerinden
// hem OpenAI hem Gemini yoluna gider. YALNIZ kompozisyon; boyut/kalite değişmez.
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const indexSrc = readFileSync(join(HERE, "index.ts"), "utf8");
const gi = indexSrc.slice(indexSrc.indexOf("async function generateImage("), indexSrc.indexOf("async function generateSpeech("));

test("index.ts: kompozisyon yönergesinin TÜM maddeleri prompt'a eklenir", () => {
  const musts = [
    "primary subjects occupy approximately 60-75% of the frame",
    "medium shot by default",
    "avoid excessive headroom",
    "avoid large empty space above the subjects",
    "cinematic close-medium framing unless the prompt explicitly requests a wide establishing shot",
  ];
  for (const m of musts) assert.ok(gi.includes(m), "eksik kompozisyon maddesi: " + m);
});

test("index.ts: yönerge ORTAK prompt 'p'ye eklenir → hem OpenAI hem Gemini alır", () => {
  // p, sağlayıcı dallarından ÖNCE kurulur ve COMPOSITION içerir → iki yol da aynı yönergeyi alır
  assert.ok(gi.includes("+ NO_SPLIT + VERTICAL_SAFE + COMPOSITION;"), "COMPOSITION ortak p'ye eklenmiş olmalı");
  const pIdx = gi.indexOf("+ COMPOSITION;");
  const geminiIdx = gi.indexOf('if (provider === "gemini")');
  const openaiCall = gi.indexOf('fetchT("https://api.openai.com');
  assert.ok(pIdx > 0 && geminiIdx > pIdx, "p (COMPOSITION dahil) gemini dalından önce kurulmalı");
  assert.ok(openaiCall > pIdx, "p (COMPOSITION dahil) OpenAI çağrısından önce kurulmalı");
});

test("index.ts: kompozisyon YALNIZ prompt'u etkiler — boyut/kalite DEĞİŞMEZ", () => {
  // desteklenen standart boyutlar ve quality=high yerinde
  assert.ok(gi.includes('const gStd = OPENAI_SIZE[size] || "'), "boyutlar merkezi eşlemeden gelmeli (OPENAI_SIZE)");
  assert.ok(gi.includes("const gSize = gStd;"), "API'ye standart boyut gitmeli (değişmedi)");
  assert.ok(gi.includes('quality: "high"'), "quality high korunmalı");
  assert.ok(gi.includes('(Deno.env.get("TA_IMAGE_FORMAT") || "png")'), "çıktı biçimi (png) değişmemeli");
  // COMPOSITION yalnız 'p' (prompt) içinde geçer; boyut/kalite alanlarına sızmamalı
  assert.ok(!/size:\s*[^,]*COMPOSITION/.test(gi) && !/quality:\s*[^,]*COMPOSITION/.test(gi), "COMPOSITION boyut/kalite alanına girmemeli");
});

test("index.ts: 9:16 dikey güvenli-kadraj talimatı KORUNUR (kompozisyonla çakışmaz)", () => {
  assert.ok(gi.includes("central safe area") && gi.includes("VERTICAL 9:16 COMPOSITION"), "9:16 güvenli-kadraj korunmalı");
});
