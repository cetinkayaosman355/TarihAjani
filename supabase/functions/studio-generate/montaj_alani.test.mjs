// ============================================================================
// FAZ 2 (kısım 3): MONTAJ / BİRLEŞTİRME ALANI
// Belgesel sahnelerini sırala (▲▼), gereksizi çıkar (👁/🚫). Video yalnız DAHİL
// sahneleri, kullanıcı sırasıyla alır. Düzenleme dosya-bazlı (başka dosyaya sızmaz).
// Çalıştır: node --test supabase/functions/studio-generate/montaj_alani.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("Montaj: sıra + dahil/çıkar _docScenes'e uygulanır", () => {
  assert.ok(src.includes("_docMergedIndices()"), "kullanıcı sırası");
  assert.ok(src.includes("_docMove(gi, dir)"), "yukarı/aşağı taşı");
  assert.ok(src.includes("_docToggleInclude(gi)"), "dahil/çıkar");
  assert.ok(src.includes("const excl = new Set(this._docActiveExcl())"), "_docScenes çıkarılanları atlar");
  assert.ok(src.includes("for (const i of this._docMergedIndices())"), "video kullanıcı sırasını alır");
});

test("En az 2 sahne korunur (hepsi çıkarılamaz)", () => {
  assert.ok(src.includes("filter(i => !excl.has(i)).length <= 2") && src.includes("En az 2 sahne gerekli"), "2 sahne alt sınırı");
});

test("Düzenleme dosya-bazlı: başka dosyaya sızmaz", () => {
  assert.ok(src.includes("_docActiveOrder()") && src.includes("_docActiveExcl()"), "aktif dosya süzgeci");
  assert.ok(src.includes("this.state.docMontageFile === this.state.fileNo"), "yalnız düzenlenen dosyaya ait");
  assert.ok(src.includes("docMontageFile: this.state.fileNo"), "düzenlemede dosya damgası yazılır");
});

test("Montaj UI: açılır liste + sıra/çıkar düğmeleri + sahne sayısı", () => {
  assert.ok(src.includes("MONTAJ SIRASI"), "başlık");
  assert.ok(src.includes("docSceneRows:") && src.includes('list="{{ docSceneRows }}"'), "sahne satırları");
  assert.ok(src.includes("toggleDocMontage") && src.includes("docMontageOpen"), "açılır/kapanır");
  assert.ok(src.includes("toggleIcon: r.included ? '👁' : '🚫'"), "dahil/çıkar ikonu");
});
