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

test("Montaj ücreti: süreye göre reserve→finalize/refund (backend belgesel action)", () => {
  const index = readFileSync(join(HERE, "index.ts"), "utf8");
  assert.ok(index.includes('act === "belgesel"'), "belgesel action");
  assert.ok(index.includes('"belgesel"') && index.includes("ALLOWED_ACTIONS"), "belgesel izinli action");
  assert.ok(index.includes("TA_BELGESEL_KR_PER_MIN"), "dakika başı KR (env ile ayarlanır)");
  assert.ok(index.includes('Math.ceil(secs / 60)') && index.includes("reserveOp(admin, userId, belCost"), "süreye göre rezerve");
  assert.ok(index.includes('mode === "finalize"') && index.includes('mode === "refund"'), "finalize + iade");
  // frontend: render öncesi rezerve, başarıda finalize, hatada iade
  assert.ok(src.includes("_belgeselCharge('reserve'") && src.includes("_belgeselCharge('finalize'") && src.includes("_belgeselCharge('refund'"), "istemci reserve/finalize/refund akışı");
  assert.ok(src.includes("_docEstSeconds()"), "süre tahmini (metinden)");
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

test("UI: Belgesel Video paneli + altyazı stilleri/müzik + ilerleme", () => {
  assert.ok(src.includes("🎞 Belgesel Video"), "panel başlığı");
  assert.ok(src.includes("docSubStyles") && src.includes("toggleDocMusic"), "altyazı stili + müzik seçeneği");
  assert.ok(src.includes("BELGESEL VİDEOYU OLUŞTUR"), "oluştur düğmesi");
  assert.ok(src.includes("docBarStyle"), "ilerleme çubuğu");
  assert.ok(src.includes("docDownload: () => this.dlVideo(s.docUrl)"), "indirme doğru .mp4/.webm");
});

test("Altyazı stilleri: minimal/serit/vurgu/none + GÜVENLİ konum (alt UI'ye girmez)", () => {
  // Stil seçenekleri
  assert.ok(src.includes("['minimal', 'Minimal'], ['serit', 'Şerit'], ['vurgu', 'Vurgu'], ['none', 'Yok']"), "4 altyazı stili");
  // Küçük boyut + güvenli konum (dikey videoda alt ~%20 UI'ye girmez → yPos 0.77-0.80)
  assert.ok(src.includes("yPos: 0.80") && src.includes("yPos: 0.77"), "güvenli dikey konum");
  assert.ok(src.includes("fs: 0.0225") || src.includes("minimal:") , "minimal küçük boyut");
  // startDocVideo stili geçirir
  assert.ok(src.includes("subStyle: this.state.docSubStyle || 'minimal'"), "seçilen altyazı stili montaja geçer");
});
