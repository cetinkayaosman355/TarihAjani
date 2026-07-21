// ============================================================================
// BELGESEL VİDEO (Ken Burns) — tarayıcıda montaj, az kredi
// Sahne görselleri + seslendirme + altyazı → tek video; AI-video kredisi YOK.
// (Tarayıcı API'leri node'da çalıştırılamaz → kaynak/akış yapısal olarak doğrulanır.)
// Çalıştır: node --test supabase/functions/studio-generate/belgesel_video.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("Motor: sahne toplama + montaj + tetikleyici mevcut", () => {
  assert.ok(src.includes("buildDocVideo(opts, onProg)"), "montaj motoru");
  assert.ok(src.includes("_docScenes()"), "sahne toplayıcı");
  assert.ok(src.includes("startDocVideo()"), "UI tetikleyici");
  assert.ok(src.includes("_recorderMime()"), "MediaRecorder mime seçimi (mp4→webm yedek)");
});

test("Az kredi: yalnız görsel + seslendirme kullanılır, AI-video (Kling/Grok) çağrılmaz", () => {
  // Sahne görseli sceneImgs'ten, metin gorsel_promptlar[].anlatim'dan gelir
  assert.ok(src.includes("gp[i].anlatim || gp[i].sahne"), "altyazı/ses metni anlatımdan");
  assert.ok(src.includes("(si['gp' + i] || {}).url"), "sahne görseli mevcut üretimden");
  // Seslendirme mevcut ttsServer ile (ayrı AI-video submit YOK)
  const eng = src.slice(src.indexOf("async buildDocVideo"), src.indexOf("async buildDocVideo") + 3500);
  assert.ok(eng.includes("this.ttsServer("), "seslendirme mevcut TTS ile");
  assert.ok(!eng.includes("submitVideo") && !eng.includes("videoServer"), "AI-video sağlayıcısı çağrılmaz");
});

test("Tarayıcı montajı: Canvas captureStream + WebAudio + MediaRecorder", () => {
  assert.ok(src.includes("canvas.captureStream(30)"), "tuval akışı");
  assert.ok(src.includes("createMediaStreamDestination"), "ses akışı");
  assert.ok(src.includes("new MediaRecorder("), "kayıt");
  assert.ok(src.includes("requestAnimationFrame(draw)"), "çizim döngüsü");
  assert.ok(src.includes("1.05 + 0.10 * lp"), "Ken Burns yavaş zoom");
});

test("UI: Belgesel Video paneli + altyazı/müzik seçenekleri + ilerleme", () => {
  assert.ok(src.includes("🎞 Belgesel Video"), "panel başlığı");
  assert.ok(src.includes("toggleDocSubs") && src.includes("toggleDocMusic"), "altyazı + müzik seçeneği");
  assert.ok(src.includes("BELGESEL VİDEOYU OLUŞTUR"), "oluştur düğmesi");
  assert.ok(src.includes("docBarStyle"), "ilerleme çubuğu");
  assert.ok(src.includes("docDownload: () => this.dlVideo(s.docUrl)"), "indirme doğru .mp4/.webm");
});
