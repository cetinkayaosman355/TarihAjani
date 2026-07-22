// ============================================================================
// YÖNETMEN PROMPT SİSTEMİ — kesilme düzeltmesi + video promptu şeffaflığı
// Kök sorun: AI her sahne promptuna upuzun stil öneki + anti-artifact yazınca
// JSON şişip token sınırında KESİLİYOR → sahne açıklaması gidiyor → jenerik
// portre. Çözüm: AI yalnız sahne İÇERİĞİ yazar; stil+oran+anti sistem sarar.
// Çalıştır: node --test supabase/functions/studio-generate/yonetmen_prompt.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("Kesilme düzeltmesi: AI yalnız sahne içeriği yazar, stili sistem sarar", () => {
  assert.ok(src.includes("_wrapScenePrompt(content, cfg)"), "sistem sarmalayıcı");
  assert.ok(src.includes("YALNIZCA sahnenin İÇERİĞİNİ yaz"), "AI'ya içerik-yalnız yönergesi");
  assert.ok(src.includes("prompt şişer ve KESİLİR"), "neden açıklaması AI'ya verildi");
  assert.ok(src.includes("this._wrapScenePrompt(x.prompt, cfg)"), "ayrıştırma sonrası sarılır");
});

test("Çift stil eklemez: AI kuralı unutup stil yazsa bile sarmalayıcı korur", () => {
  const i = src.indexOf("_wrapScenePrompt(content, cfg)");
  const seg = src.slice(i, i + 600);
  assert.ok(seg.includes("startsWith(head)") && seg.includes("return c;"), "zaten stil varsa dokunmaz");
  assert.ok(seg.includes("cfg.stilStr") && seg.includes("cfg.anti"), "stil + anti otomatik");
});

test("Yönetmen kuralları korunuyor (çeşitlilik + bakış kuralı hâlâ promptta)", () => {
  assert.ok(src.includes("görseller BİRBİRİNİN AYNISI olmasın"), "çeşitlilik kuralı");
  assert.ok(src.includes("Özneler kameraya/lense BAKMAZ"), "bakış kuralı");
  assert.ok(src.includes("BEAT YÖNETİMİ"), "beat yönetimi");
  assert.ok(src.includes("wide establishing shot") && src.includes("extreme close-up"), "çekim türü döngüsü");
});

test("Video promptu şeffaflığı: modalda uygulanacak hareket gösterilir + boş uyarısı", () => {
  assert.ok(src.includes("_videoModalMotion()"), "modal hareket promptu yardımcısı");
  assert.ok(src.includes("UYGULANACAK KAMERA HAREKETİ"), "modalda gösterilir");
  assert.ok(src.includes("videoModalNoMotion"), "boş prompt durumu");
  assert.ok(src.includes("video promptu boş — hareket jenerik"), "boşsa net uyarı");
});

test("Video promptu gerçekten kullanılıyor (video_promptlar[i] → sunucu)", () => {
  assert.ok(src.includes("prompt = (vp[i] && vp[i].prompt) || (gp[i] && gp[i].prompt) || ''"), "sahne video promptu alınır");
  assert.ok(src.includes("action: 'video', image: imageUrl, prompt: prompt"), "prompt sunucuya gider");
});
