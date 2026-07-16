// Tarih Ajanı — Studio içerik üretimi + ARAŞTIRMA (grounding) + SUNUCU KREDİ (anti-hile)
// Akış: 1) konuyu web'de ARAŞTIR (Claude web_search) → 2) araştırmayı omurga alıp ÜRET →
//       3) sahne/JSON doğrula, azsa yeniden dene → 4) başarılıysa krediyi düş.
// Deploy: Edge Functions > studio-generate > bu kodu yapıştır > Deploy
// Secrets: OPENAI_API_KEY ve/veya ANTHROPIC_API_KEY (araştırma için ANTHROPIC önerilir)
//   SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY otomatik gelir (kredi düşme için gerekli)
//
// Kredi mantığı: ücret client'tan DEĞİL, sunucudaki formülden gelir (anti-hile).
//   action:"generate" -> süre kaydırmalı "s<saniye>" (30-600): kredi = max(30, round((20+sn/4)/5)*5)
//     örn. 30sn=30 · 2dk=50 · 5dk=95 · 10dk=170 kredi
//   action:"image" -> 12 kredi · action:"regen" -> 5 kredi · diğer/boş -> 0 (ücretsiz)
// Ücretli çağrıda kullanıcı JWT'si (Authorization: Bearer <user token>) gerekir.
// Yetersiz bakiyede 402 döner; üretim yapılmaz. Kredi ÜRETİM BAŞARILI olduktan sonra düşülür.
// Yanıt: { ok:true, result, text, charged:boolean, credits:number }

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const TONE: Record<string, string> = {
  gizemli: "gizemli, merak uyandıran, karanlık ve sürükleyici",
  merakli: "meraklı, sorularla ilerleyen, keşif hissi veren",
  gercekci: "gerçekçi, belgeye dayalı, ölçülü ve güvenilir",
  hollywood: "sinematik, yüksek tempolu, Hollywood fragmanı enerjisinde",
  animasyon: "canlı, renkli, animasyon anlatımına uygun, sıcak",
};

function buildPrompt(b: any): string {
  const tone = TONE[b.tone] || TONE["gercekci"];
  const outs = (b.outputs && b.outputs.length ? b.outputs : ["senaryo", "seslendirme", "baslik", "promptlar", "yayin"]);
  const map: Record<string, string> = {
    senaryo: "## SENARYO\nSahne sahne, girişte güçlü bir kanca ve sonda 'Ajanın Hükmü' kapanışı ile.",
    seslendirme: "## SESLENDİRME METNİ\nDoğal, akıcı, " + (b.voice || "nötr") + " bir anlatıcıya uygun; nefes/duraklama işaretleriyle.",
    baslik: "## BAŞLIK & AÇIKLAMA\n5 alternatif başlık + YouTube açıklaması + etiketler.",
    promptlar: "## GÖRSEL / SAHNE PROMPTLARI\nHer ana sahne için İngilizce, foto-gerçekçi görsel üretim promptu.",
    yayin: "## YAYIN PAKETİ\nYouTube başlığı/açıklaması + Instagram Reels metni + kapak fikri.",
  };
  const sections = outs.map((o: string) => map[o]).filter(Boolean).join("\n\n");
  return `Sen "Tarih Ajanı" için içerik üreten uzman bir tarih anlatıcısısın. Her iddia belgeye dayanmalı; söylenti değil kanıt. Üslup: ${tone}.

KONU: ${b.topic}

Aşağıdaki bölümleri Türkçe, eksiksiz ve doğrudan kullanılabilir şekilde üret:

${sections}`;
}

async function callOpenAI(prompt: string, maxTokens?: number, jsonMode?: boolean): Promise<string> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY secret eksik.");
  const payload: Record<string, unknown> = {
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: maxTokens || 4000,
  };
  // Üretimde OpenAI'yi katı JSON moduna zorla (prompt "JSON" içerdiği için geçerli)
  if (jsonMode) payload.response_format = { type: "json_object" };
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("OpenAI: " + (await r.text()));
  const d = await r.json();
  return d.choices?.[0]?.message?.content ?? "";
}

// Üretim çıktısını JSON'a çevirmeyi dene (client ile aynı temizleme); olmazsa null.
function tryParseJson(text: string): any | null {
  const clean = String(text).replace(/^[\s\S]*?\{/, "{").replace(/\}[^}]*$/, "}");
  try { return JSON.parse(clean); } catch { return null; }
}

// -1: geçersiz JSON · 0..N: gorsel_promptlar öğe sayısı
function sceneCount(text: string): number {
  const o = tryParseJson(text);
  if (!o || typeof o !== "object") return -1;
  return Array.isArray(o.gorsel_promptlar) ? o.gorsel_promptlar.length : 0;
}

// Sırayla denenir; "model bulunamadı" hatasında bir sonrakine geçer.
// Ö-06: claude-sonnet-5 en önde — önceki Opus kalitesine yakın çıktı ve
// 31.08.2026'ya kadar tanıtım fiyatıyla sonnet-4-6'dan bile ucuz.
const CLAUDE_MODELS = [
  "claude-sonnet-5",
  "claude-sonnet-4-6",
  "claude-sonnet-4-5",
  "claude-sonnet-4-20250514",
];

async function callClaude(prompt: string, maxTokens?: number): Promise<string> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY secret eksik.");
  let lastErr = "";
  for (const model of CLAUDE_MODELS) {
    let tokens = Math.min(maxTokens || 4000, 16000);
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          max_tokens: tokens,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (r.ok) {
        const d = await r.json();
        return (d.content || []).map((c: any) => c.text || "").join("\n");
      }
      const txt = await r.text();
      lastErr = txt;
      if (txt.includes("not_found_error")) break;
      if (txt.includes("max_tokens") && tokens > 8000) { tokens = 8000; continue; }
      throw new Error("Claude: " + txt);
    }
  }
  throw new Error("Claude: kullanılabilir model bulunamadı — " + lastErr);
}

// Kredi ücretleri SUNUCUDA sabit; client değiştiremez.
// Üretim maliyeti süre kademesine göre; sahne yenileme sabit.
// Süre kaydırmalı: client "s<saniye>" gönderir (30-600); eski anahtarlar geriye dönük.
// Kredi ve sahne CLIENT ile AYNI formül — ama değer sunucuda hesaplanır (anti-hile).
const IMAGE_COST = 12;        // ilk 20 sahne görseli
const IMAGE_COST_BULK = 8;    // 21. sahneden itibaren (kademeli indirim)
function secsOf(duration: string): number {
  const m = /^s(\d+)$/.exec(duration || "");
  if (m) return Math.min(600, Math.max(30, parseInt(m[1], 10)));
  return ({ sn30: 30, dk1: 90, dk4: 270, dk8: 600 } as Record<string, number>)[duration] ?? 270;
}
function costFor(action: string, duration: string, imgIndex = 0): number {
  if (action === "generate") {
    const sec = secsOf(duration);
    return Math.max(30, Math.round((20 + sec / 4) / 5) * 5);
  }
  // Kademeli görsel: ilk 20 sahne görseli 12 KR, 21. sahneden itibaren 8 KR
  if (action === "image") return (Number(imgIndex) || 0) >= 20 ? IMAGE_COST_BULK : IMAGE_COST;
  if (action === "regen") return 5;
  return 0;
}
// Seslendirme: 1000 karakter ≈ 1 dk ses ≈ 5 KR (taban 10) — client ile aynı formül
function ttsCostOf(chars: number): number {
  return Math.max(10, Math.ceil(chars / 1000) * 5);
}
// Kapak hariç beklenen sahne — CLIENT fmtFor ile AYNI formül: 120·sn/(600+sn)
// (30→6, 90→16, 4dk→37, 8dk→53, 10dk→60). Sahne promptları ayrı 'scenes'
// çağrılarında bölüm bölüm üretildiği için yüksek sayı sorun değil.
function sceneFor(sec: number): number {
  return Math.max(6, Math.round(120 * sec / (600 + sec)));
}

// Gerçek görsel üretimi — OpenAI gpt-image-1.5 (base64 → data URI, süresiz).
// Başarısız olursa dall-e-3'e (url) düşer. Boş dönerse üretim başarısız sayılır.
async function generateImage(prompt: string, size: string): Promise<string> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key || !prompt.trim()) return "";
  // gpt-image oranları: kare / yatay (3:2) / dikey (2:3)
  const gSize = size === "9:16" ? "1024x1536" : size === "16:9" ? "1536x1024" : "1024x1024";

  // gpt-image tek denemesi. Başarı → data URI; başarısızsa hatayı LOG'la (Supabase
  // function loglarında görünür, teşhis için) ve boş dön ki sıradaki yol denensin.
  async function tryGptImage(model: string): Promise<string> {
    try {
      const r = await fetchT("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: prompt.slice(0, 30000),
          n: 1,
          size: gSize,
          quality: "high",              // kalite > maliyet (ChatGPT ile aynı kademe;
                                        // medium kalabalık sahnede saydam/hayalet insan üretiyordu)
          output_format: "jpeg",        // daha küçük data URI (png ~çok büyük)
          output_compression: 88,
          moderation: "low",            // tarihî sahne (savaş/ölüm) yanlış engelini azalt
        }),
      }, 120_000);
      if (r.ok) {
        const d = await r.json();
        const b64 = d.data?.[0]?.b64_json;
        if (b64) return "data:image/jpeg;base64," + b64;
        const u = d.data?.[0]?.url;
        if (u) return u;
        return "";
      }
      // 429/5xx → geçici; çağıran taraf tekrar dener. 4xx (model yok/moderasyon) → kalıcı.
      const body = await r.text().catch(() => "");
      console.error(`generateImage ${model} HTTP ${r.status}: ${body.slice(0, 300)}`);
      return r.status === 429 || r.status >= 500 ? "RETRY" : "";
    } catch (e) {
      console.error(`generateImage ${model} exception: ${String(e).slice(0, 200)}`);
      return "RETRY";   // ağ/zaman aşımı → tekrar denenebilir
    }
  }

  // Model zinciri: önce en kaliteli gpt-image-1.5, hesapta yoksa gpt-image-1'e düş.
  // Geçici hatada (RETRY) bir kez daha dene — anlık 429/500'ler kullanıcıya hata
  // olarak yansımasın (kalite ve güvenilirlik önce).
  for (const model of ["gpt-image-1.5", "gpt-image-1"]) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const out = await tryGptImage(model);
      if (out && out !== "RETRY") return out;
      if (out !== "RETRY") break;   // kalıcı hata (model yok/moderasyon) → sıradaki modele geç
    }
  }

  // Son yedek: dall-e-3. URL'si ~1 saatte ölür → K-03: burada İNDİRİP kalıcı
  // data URI olarak döndürürüz; kullanıcı arşivinde görsel asla kaybolmaz.
  const dSize = size === "9:16" ? "1024x1792" : size === "16:9" ? "1792x1024" : "1024x1024";
  try {
    const r = await fetchT("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "dall-e-3", prompt: prompt.slice(0, 3800), n: 1, size: dSize, quality: "hd" }),
    }, 90_000);
    if (r.ok) {
      const d = await r.json();
      const u = d.data?.[0]?.url ?? "";
      if (u) {
        try {
          const img = await fetchT(u, {}, 60_000);
          if (img.ok) {
            const bytes = new Uint8Array(await img.arrayBuffer());
            let bin = "";
            for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
            return "data:image/png;base64," + btoa(bin);
          }
        } catch (_e) { /* indirilemezse geçici URL yine de döner */ }
        return u;
      }
    } else {
      const body = await r.text().catch(() => "");
      console.error(`generateImage dall-e-3 HTTP ${r.status}: ${body.slice(0, 300)}`);
    }
  } catch (e) { console.error(`generateImage dall-e-3 exception: ${String(e).slice(0, 200)}`); }
  return "";
}

// Gerçek seslendirme — OpenAI gpt-4o-mini-tts (mp3). Uzun metin ≤3800
// karakterlik parçalara bölünür (en fazla 3 parça ≈ 11 dk), mp3'ler art
// arda eklenir (mp3 çerçeveleri ardışık oynatılabilir). Boş dönüş = hata.
const TTS_VOICES = new Set(["onyx", "ash", "nova", "sage", "alloy", "echo", "shimmer"]);
async function generateSpeech(text: string, voice: string): Promise<Uint8Array | null> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key || !text.trim()) return null;
  const v = TTS_VOICES.has(voice) ? voice : "onyx";
  // cümle sınırlarından bölmeye çalış
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length && chunks.length < 3) {
    if (rest.length <= 3800) { chunks.push(rest); break; }
    let cut = rest.lastIndexOf(". ", 3800);
    if (cut < 2000) cut = 3800;
    chunks.push(rest.slice(0, cut + 1));
    rest = rest.slice(cut + 1).trim();
  }
  async function ttsOnce(model: string, voice2: string, input: string): Promise<Uint8Array | null> {
    const body: Record<string, unknown> = { model, voice: voice2, input, response_format: "mp3" };
    if (model === "gpt-4o-mini-tts") {
      body.instructions = "Türkçe belgesel anlatıcısı: sakin, derin, sürükleyici. Dedektif dosyası okur gibi; özel adlarda hafif duraklama, gerilim cümlelerinde tempo.";
    }
    try {
      const r = await fetchT("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }, 90_000);
      if (!r.ok) return null;
      return new Uint8Array(await r.arrayBuffer());
    } catch (_e) { return null; }
  }
  const parts: Uint8Array[] = [];
  for (const c of chunks) {
    // önce yönergeli yeni model; hesapta kapalıysa klasik tts-1'e düş
    let part = await ttsOnce("gpt-4o-mini-tts", v, c);
    if (!part) {
      const v1 = ({ ash: "onyx", sage: "nova" } as Record<string, string>)[v] || v;
      part = await ttsOnce("tts-1", v1, c);
    }
    if (!part) return null;
    parts.push(part);
  }
  if (!parts.length) return null;
  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}
// ElevenLabs seslendirme — yalnızca izinli ses kimlikleri (istismarı önler; site
// ELEVENLABS_API_KEY'ini kullanır). Türkçeyi doğru okuyan eleven_multilingual_v2.
const ELEVEN_ALLOWED = new Set(["j82ax9yhzfYwq9lDvRWL"]); // Kadir Kayışcı
async function generateSpeechEleven(text: string, voiceId: string): Promise<Uint8Array | null> {
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key || !text.trim() || !ELEVEN_ALLOWED.has(voiceId)) return null;
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length && chunks.length < 5) {
    if (rest.length <= 2500) { chunks.push(rest); break; }
    let cut = rest.lastIndexOf(". ", 2500);
    if (cut < 1200) cut = 2500;
    chunks.push(rest.slice(0, cut + 1));
    rest = rest.slice(cut + 1).trim();
  }
  const parts: Uint8Array[] = [];
  for (const c of chunks) {
    try {
      const r = await fetchT("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId + "?output_format=mp3_44100_128", {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg" },
        body: JSON.stringify({
          text: c,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
        }),
      });
      if (!r.ok) return null;
      parts.push(new Uint8Array(await r.arrayBuffer()));
    } catch (_e) { return null; }
  }
  if (!parts.length) return null;
  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}
// Motor yönlendirici: engine='eleven' + izinli voiceId → ElevenLabs; yoksa/başarısızsa → OpenAI.
async function synthSpeech(text: string, b: Record<string, unknown>): Promise<Uint8Array | null> {
  if (String(b.engine || "") === "eleven" && ELEVEN_ALLOWED.has(String(b.voiceId || ""))) {
    const out = await generateSpeechEleven(text, String(b.voiceId));
    if (out) return out;
  }
  return generateSpeech(text, String(b.voice || ""));
}
// Ses ÖNİZLEME metni (kısa ~5 sn) — ücretsiz, kredi düşmez, kullanıcı sesi seçmeden dinler
const PREVIEW_TEXT = "Tarih Ajanı dosyayı açıyor. Bu ses, senin anlatıcın olabilir.";
function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

// ── ARAŞTIRMA BİRİMİ (grounding) ───────────────────────────────────────
// Üretimden ÖNCE konuyu web'de araştırıp doğrulanmış bir "araştırma dosyası" çıkarır.
// Claude'un sunucu-tarafı web_search aracını kullanır; yoksa modelin bilgisine düşer.
// Tek-atış üretime göre çok daha derin, somut ve doğru çıktı sağlar (farkımız burası).
// Verilen ms içinde bitmeyen fetch'i iptal eder (504 zaman aşımına karşı bütçe koruması)
async function fetchT(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { ...init, signal: ac.signal }); }
  finally { clearTimeout(t); }
}

async function researchBrief(topic: string): Promise<string> {
  const q = `Sen "Tarih Ajanı" için çalışan titiz bir tarih araştırmacısısın. KONU: "${topic}".
Güvenilir kaynaklara dayanarak KISA ama YOĞUN bir araştırma dosyası çıkar:
- Doğrulanmış temel gerçekler (kişi, yer, tarih, sayı — mümkünse kaynak adıyla)
- Az bilinen çarpıcı ayrıntılar ve şaşırtıcı açılar (güçlü kanca potansiyeli)
- Yaygın efsane ↔ gerçek ayrımı
- Anlatıyı zenginleştirecek 4-6 somut sahne/görsel fikri
Türkçe, madde madde yaz. UYDURMA yok; emin olmadığını "rivayete göre" diye işaretle.`;
  // Araştırma toplam bütçesi ~35 sn: bitmezse üretim araştırmasız devam eder
  // (504 zaman aşımı yaşamamak üretimin kendisinden önemli).
  const aKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (aKey) {
    // Ö-06: önce sonnet-5 + yeni arama aracı (sonuçları akıllıca filtreler);
    // hesapta yoksa eski model+araç ikilisine düşer — araştırma asla tamamen kaybolmaz.
    const attempts = [
      { model: "claude-sonnet-5", tool: "web_search_20260209" },
      { model: "claude-sonnet-4-6", tool: "web_search_20260209" },
      { model: "claude-sonnet-4-5", tool: "web_search_20250305" },
    ];
    for (const a of attempts) {
      try {
        const r = await fetchT("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "x-api-key": aKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
          body: JSON.stringify({
            model: a.model,
            max_tokens: 1400,
            messages: [{ role: "user", content: q }],
            tools: [{ type: a.tool, name: "web_search", max_uses: 3 }],
          }),
        }, 22_000);
        if (r.ok) {
          const d = await r.json();
          const txt = (d.content || []).map((c: any) => (c && c.type === "text") ? c.text : "").join("\n").trim();
          if (txt) return txt;
        } else {
          const body = await r.text().catch(() => "");
          // model/araç bu hesapta yok → sıradaki ikiliye geç; başka hata → yedek OpenAI
          if (!/not_found|model|tool/i.test(body)) break;
        }
      } catch (_e) { break; /* zaman aşımı → araştırma bütçesini koru */ }
    }
  }
  try {
    const r = await fetchT("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: q }], temperature: 0.5, max_tokens: 1200 }),
    }, 20_000);
    if (r.ok) { const d = await r.json(); return (d.choices?.[0]?.message?.content ?? "").trim(); }
  } catch (_e) { /* araştırmasız devam */ }
  return "";
}

// data URI → ham bayt (görsel düzenleme girişi için)
function dataUriToBytes(uri: string): { bytes: Uint8Array; type: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(uri || "");
  if (!m) return null;
  try {
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes, type: m[1] };
  } catch { return null; }
}

// Gerçek görsel DÜZENLEME — OpenAI /images/edits (gpt-image-1). Mevcut görseli
// korur, yalnız istenen değişikliği uygular (sıfırdan yeni görsel ÜRETMEZ).
const EDIT_COST = 8;
async function editImage(imageUri: string, prompt: string, size: string): Promise<string> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key || !prompt.trim()) return "";
  const parsed = dataUriToBytes(imageUri);
  if (!parsed) return "";   // yalnız data URI (üretilen görseller) düzenlenebilir
  const gSize = size === "9:16" ? "1024x1536" : size === "16:9" ? "1536x1024" : "1024x1024";
  const ext = parsed.type.indexOf("png") >= 0 ? "png" : "jpg";
  const fd = new FormData();
  fd.append("model", "gpt-image-1");
  fd.append("prompt", prompt.slice(0, 30000));
  fd.append("size", gSize);
  fd.append("n", "1");
  fd.append("image", new Blob([parsed.bytes], { type: parsed.type }), "image." + ext);
  try {
    const r = await fetchT("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: fd,
    }, 120_000);
    if (r.ok) {
      const d = await r.json();
      const b64 = d.data?.[0]?.b64_json;
      if (b64) return "data:image/png;base64," + b64;
      const u = d.data?.[0]?.url;
      if (u) return u;
    }
  } catch (_e) { /* boş dön */ }
  return "";
}

// ── G-01: hız limiti — bellek içi, edge örneği başına (patlama koruması) ──
const RL = new Map<string, { n: number; t: number }>();
function rateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  if (RL.size > 5000) RL.clear();
  const e = RL.get(key);
  if (!e || now - e.t > 60_000) { RL.set(key, { n: 1, t: now }); return false; }
  e.n++;
  return e.n > limit;
}

// ── Ö-08: telemetri — her üretimin sonucu tabloya yazılır ("hata payı sıfır"
// hedefinin ölçüm aracı). Tablo yoksa/başarısızsa sessizce geçer, üretimi etkilemez.
let LOGC: any = null;
function logRun(row: Record<string, unknown>) {
  try {
    if (!LOGC) {
      const u = Deno.env.get("SUPABASE_URL"), k = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!u || !k) return;
      LOGC = createClient(u, k);
    }
    LOGC.from("uretim_log").insert(row).then(() => {}, () => {});
  } catch (_e) { /* telemetri asla üretimi bozmaz */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const t0 = Date.now();
  try {
    const b = await req.json();
    const act = String(b.action || "");
    // Hız limiti: kimliksiz/ücretsiz istekler dakikada 30, tümü 90 (IP başına)
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
    if (rateLimited("all:" + ip, 90)) return json({ ok: false, error: "Çok fazla istek — bir dakika sonra tekrar dene." }, 429);
    const isEdit = act === "edit";
    const prompt = (b.prompt && String(b.prompt).trim()) ? String(b.prompt) : (b.topic ? buildPrompt(b) : "");
    // TTS'in prompt/konusu yok, yalnız seslendirme METNİ var — bu kontrolden muaf
    if (!prompt && act !== "tts") return json({ ok: false, error: "Konu veya prompt gir." }, 400);

    const isPreview = act === "tts" && b.preview === true;   // ücretsiz ses önizlemesi
    const ttsText = String(b.text || "").trim().slice(0, 11500);
    const cost = isPreview ? 0 : (act === "tts"
      ? ttsCostOf(ttsText.length)
      : isEdit
        ? (b.free ? 0 : EDIT_COST)
        : costFor(act, String(b.duration || ""), Number(b.imgIndex) || 0));

    // G-01: ücretsiz AI uçları daha sıkı sınırlı (dakikada 30) — bot/istismar
    // bizim OpenAI/Anthropic faturamızı şişiremesin.
    if (cost === 0 && rateLimited("free:" + ip, 30)) {
      return json({ ok: false, error: "Çok fazla istek — bir dakika sonra tekrar dene." }, 429);
    }

    // Ücretli çağrı → kullanıcıyı doğrula ve bakiyeyi ön-kontrol et.
    // Düzenleme ücretsiz olsa bile giriş şarttır (istismarı önler).
    let admin: any = null, userId = "";
    if (cost > 0 || isEdit) {
      const SB_URL = Deno.env.get("SUPABASE_URL");
      const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!SB_URL || !SVC) return json({ ok: false, error: "Sunucu yapılandırması eksik (service role)." }, 500);
      admin = createClient(SB_URL, SVC);
      const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      const { data: ud } = await admin.auth.getUser(jwt);
      if (!ud?.user) return json({ ok: false, error: "Üretim için giriş yap." }, 401);
      userId = ud.user.id;
      // vade/aylık kota tazele + bakiye oku
      const { data: prof } = await admin.rpc("refresh_profile_credits", { p_user: userId });
      const row = Array.isArray(prof) ? prof[0] : prof;
      const bal = row && typeof row.credits === "number" ? row.credits : 0;
      if (bal < cost) return json({ ok: false, error: "Yetersiz kredi", credits: bal }, 402);
    }

    // GÖRSEL ÜRETİMİ — metin üretiminden ayrı akış (başarılıysa kredi düşer)
    if (String(b.action || "") === "image") {
      const url = await generateImage(String(b.prompt || ""), String(b.size || ""));
      logRun({ action: "image", ok: !!url, ms: Date.now() - t0, user_id: userId || null, err: url ? null : "uretilemedi" });
      if (!url) return json({ ok: false, error: "Görsel üretilemedi. Lütfen tekrar deneyin (kredi düşülmedi)." }, 502);
      if (cost > 0 && admin && userId) {
        const { data: sp } = await admin.rpc("spend_credits", { p_user: userId, p_amount: cost, p_reason: "gorsel" });
        const spRow = Array.isArray(sp) ? sp[0] : sp;
        const credits = spRow && typeof spRow.new_credits === "number" ? spRow.new_credits : undefined;
        return json({ ok: true, url, charged: true, credits });
      }
      return json({ ok: true, url, charged: false });
    }

    // GÖRSEL DÜZENLEME — mevcut görseli korur, istenen değişikliği uygular
    if (isEdit) {
      const url = await editImage(String(b.image || ""), String(b.prompt || ""), String(b.size || ""));
      if (!url) return json({ ok: false, error: "Görsel düzenlenemedi. Lütfen tekrar deneyin (kredi düşülmedi)." }, 502);
      if (cost > 0 && admin && userId) {
        const { data: sp } = await admin.rpc("spend_credits", { p_user: userId, p_amount: cost, p_reason: "gorsel_duzenle" });
        const spRow = Array.isArray(sp) ? sp[0] : sp;
        const credits = spRow && typeof spRow.new_credits === "number" ? spRow.new_credits : undefined;
        return json({ ok: true, url, charged: true, credits });
      }
      return json({ ok: true, url, charged: false });
    }

    // SES ÖNİZLEME — ücretsiz, kredi düşmez, giriş gerekmez; kısa örnek data URI döner
    if (isPreview) {
      const bytes = await synthSpeech(PREVIEW_TEXT, b);
      if (!bytes) return json({ ok: false, error: "Önizleme üretilemedi." }, 502);
      return json({ ok: true, url: "data:audio/mpeg;base64," + bytesToB64(bytes), charged: false });
    }

    // SESLENDİRME ÜRETİMİ — mp3 üret, Storage'a yükle, başarılıysa kredi düş
    if (String(b.action || "") === "tts") {
      if (!ttsText) return json({ ok: false, error: "Seslendirme metni boş." }, 400);
      const bytes = await synthSpeech(ttsText, b);
      logRun({ action: "tts", ok: !!bytes, ms: Date.now() - t0, user_id: userId || null, err: bytes ? null : "uretilemedi" });
      if (!bytes) return json({ ok: false, error: "Ses üretilemedi. Lütfen tekrar deneyin (kredi düşülmedi)." }, 502);
      let url = "";
      if (admin) {
        try {
          const path = (userId || "anon") + "/" + Date.now() + ".mp3";
          const up = await admin.storage.from("studio-ses")
            .upload(path, bytes, { contentType: "audio/mpeg", upsert: false });
          if (!up.error) {
            const pub = admin.storage.from("studio-ses").getPublicUrl(path);
            url = pub?.data?.publicUrl || "";
          }
        } catch (_e) { /* data URI'ye düş */ }
      }
      if (!url) {
        // bucket yoksa küçük dosyalar data URI olarak döner (≤2.5MB)
        if (bytes.length > 2_500_000) {
          return json({ ok: false, error: "Ses dosyası büyük ve 'studio-ses' Storage bucket'ı yok — kurulum SQL'ini çalıştırın (kredi düşülmedi)." }, 500);
        }
        let bin = "";
        for (let i = 0; i < bytes.length; i += 32768) {
          bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
        }
        url = "data:audio/mpeg;base64," + btoa(bin);
      }
      if (cost > 0 && admin && userId) {
        const { data: sp } = await admin.rpc("spend_credits", { p_user: userId, p_amount: cost, p_reason: "seslendirme" });
        const spRow = Array.isArray(sp) ? sp[0] : sp;
        const credits = spRow && typeof spRow.new_credits === "number" ? spRow.new_credits : undefined;
        return json({ ok: true, url, charged: true, credits, cost });
      }
      return json({ ok: true, url, charged: false, cost });
    }

    // Üretim (metin)
    const provider = (b.provider || b.model || "openai").toLowerCase();
    const useClaude = provider === "claude" || provider === "anthropic";
    const isGen = String(b.action || "") === "generate";
    const topic = String(b.topic || "").trim();
    // Üretimden önce ARAŞTIR (grounding) → sonra üret. Tek kredi, çok daha derin/doğru çıktı.
    let genPrompt = prompt;
    if (isGen && topic) {
      const brief = await researchBrief(topic);
      if (brief) {
        genPrompt = `ARAŞTIRMA DOSYASI — Tarih Ajanı araştırma birimi.
Aşağıdaki doğrulanmış bilgileri ve açıları anlatının OMURGASI yap; bunların dışında bilgi UYDURMA. Kaynaklara sadık kal, somut ayrıntıları (isim, tarih, yer, sayı) metne işle.

${brief}

=== ÜRETİM GÖREVİ ===
${prompt}`;
      }
    }
    // G-01: token tavanı sunucuda — ücretsiz uçlarda istemci 16k isteyemez
    const capTok = Math.min(Number(b.max_tokens) || 4000, isGen ? 16000 : 4000);
    const gen = () => useClaude ? callClaude(genPrompt, capTok) : callOpenAI(genPrompt, capTok, isGen);

    let result = await gen();
    // Sahne promptları AYRI 'scenes' çağrılarında bölüm bölüm üretiliyor; taslakta
    // sahne olmadığından burada YALNIZ geçerli JSON şart. (Sahne-sayısı tekrarı
    // kaldırıldı — eskiden kısa videoda gereksiz çift üretime yol açıyordu.)
    if (isGen) {
      if (sceneCount(result) < 0) {
        const retry = await gen();
        if (sceneCount(retry) >= 0) result = retry;
      }
      if (sceneCount(result) < 0) {
        logRun({ action: "generate", ok: false, ms: Date.now() - t0, user_id: userId || null, err: "gecersiz_json" });
        return json({ ok: false, error: "Yapay zekâ geçerli JSON döndürmedi. Lütfen tekrar deneyin (kredi düşülmedi)." }, 502);
      }
      logRun({ action: "generate", ok: true, ms: Date.now() - t0, user_id: userId || null });
    }

    // Üretim başarılı → krediyi ATOMİK düş (başarısız üretim kredi yakmaz)
    if (cost > 0 && admin && userId) {
      const { data: sp } = await admin.rpc("spend_credits", { p_user: userId, p_amount: cost, p_reason: b.action });
      const spRow = Array.isArray(sp) ? sp[0] : sp;
      const credits = spRow && typeof spRow.new_credits === "number" ? spRow.new_credits : undefined;
      return json({ ok: true, result, text: result, charged: true, credits });
    }

    return json({ ok: true, result, text: result, charged: false });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
