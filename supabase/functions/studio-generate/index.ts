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
const CLAUDE_MODELS = [
  "claude-sonnet-4-6",
  "claude-sonnet-4-5",
  "claude-sonnet-4-20250514",
  "claude-3-7-sonnet-latest",
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
const IMAGE_COST = 12;
function secsOf(duration: string): number {
  const m = /^s(\d+)$/.exec(duration || "");
  if (m) return Math.min(600, Math.max(30, parseInt(m[1], 10)));
  return ({ sn30: 30, dk1: 90, dk4: 270, dk8: 600 } as Record<string, number>)[duration] ?? 270;
}
function costFor(action: string, duration: string): number {
  if (action === "generate") {
    const sec = secsOf(duration);
    return Math.max(30, Math.round((20 + sec / 4) / 5) * 5);
  }
  if (action === "image") return IMAGE_COST;
  if (action === "regen") return 5;
  return 0;
}
// Kapak hariç beklenen sahne: kısa videoda 6 sn/sahne, uzadıkça seyrekleşir (tavan 40)
function sceneFor(sec: number): number {
  if (sec <= 90) return Math.max(6, Math.ceil(sec / 6));
  if (sec <= 180) return Math.ceil(sec / 8);
  if (sec <= 360) return Math.ceil(sec / 12);
  return Math.min(40, Math.ceil(sec / 16));
}

// Gerçek görsel üretimi — OpenAI gpt-image-1.5 (base64 → data URI, süresiz).
// Başarısız olursa dall-e-3'e (url) düşer. Boş dönerse üretim başarısız sayılır.
async function generateImage(prompt: string, size: string): Promise<string> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key || !prompt.trim()) return "";
  // gpt-image oranları: kare / yatay (3:2) / dikey (2:3)
  const gSize = size === "9:16" ? "1024x1536" : size === "16:9" ? "1536x1024" : "1024x1024";
  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-image-1.5",
        prompt: prompt.slice(0, 30000),
        n: 1,
        size: gSize,
        quality: "medium",            // dengeli kalite/maliyet
        output_format: "jpeg",        // daha küçük data URI (png ~çok büyük)
        output_compression: 82,
        moderation: "low",            // tarihî sahne (savaş/ölüm) yanlış engelini azalt
      }),
    });
    if (r.ok) {
      const d = await r.json();
      const b64 = d.data?.[0]?.b64_json;
      if (b64) return "data:image/jpeg;base64," + b64;
      const u = d.data?.[0]?.url;
      if (u) return u;
    }
  } catch (_e) { /* dall-e-3'e düş */ }
  // Yedek: dall-e-3 (url döner, ~1 saat geçerli)
  const dSize = size === "9:16" ? "1024x1792" : size === "16:9" ? "1792x1024" : "1024x1024";
  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "dall-e-3", prompt: prompt.slice(0, 3800), n: 1, size: dSize }),
    });
    if (r.ok) {
      const d = await r.json();
      return d.data?.[0]?.url ?? "";
    }
  } catch (_e) { /* boş dön */ }
  return "";
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
    try {
      const r = await fetchT("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": aKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1400,
          messages: [{ role: "user", content: q }],
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
        }),
      }, 35_000);
      if (r.ok) {
        const d = await r.json();
        const txt = (d.content || []).map((c: any) => (c && c.type === "text") ? c.text : "").join("\n").trim();
        if (txt) return txt;
      }
    } catch (_e) { /* aşağıdaki yedeğe düş */ }
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const b = await req.json();
    const prompt = (b.prompt && String(b.prompt).trim()) ? String(b.prompt) : (b.topic ? buildPrompt(b) : "");
    if (!prompt) return json({ ok: false, error: "Konu veya prompt gir." }, 400);

    const cost = costFor(String(b.action || ""), String(b.duration || ""));

    // Ücretli çağrı → kullanıcıyı doğrula ve bakiyeyi ön-kontrol et (üretimden önce)
    let admin: any = null, userId = "";
    if (cost > 0) {
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
      if (!url) return json({ ok: false, error: "Görsel üretilemedi. Lütfen tekrar deneyin (kredi düşülmedi)." }, 502);
      if (cost > 0 && admin && userId) {
        const { data: sp } = await admin.rpc("spend_credits", { p_user: userId, p_amount: cost, p_reason: "gorsel" });
        const spRow = Array.isArray(sp) ? sp[0] : sp;
        const credits = spRow && typeof spRow.new_credits === "number" ? spRow.new_credits : undefined;
        return json({ ok: true, url, charged: true, credits });
      }
      return json({ ok: true, url, charged: false });
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
    const gen = () => useClaude ? callClaude(genPrompt, b.max_tokens) : callOpenAI(genPrompt, b.max_tokens, isGen);
    const wantScenes = isGen ? sceneFor(secsOf(String(b.duration || ""))) : 0;

    let result = await gen();
    // Üretimde geçerli JSON şart. Sahne-eksiği tekrarı YALNIZ kısa formatlarda (sn30/dk1):
    // uzun dosyada ikinci tam üretim gateway zaman sınırını (504) aşıyor.
    if (isGen) {
      const sc = sceneCount(result);
      const retryable = sc < 0 || (sc < wantScenes && wantScenes <= 12);
      if (retryable) {
        const retry = await gen();
        if (sceneCount(retry) > sc) result = retry;
      }
      if (sceneCount(result) < 0) {
        return json({ ok: false, error: "Yapay zekâ geçerli JSON döndürmedi. Lütfen tekrar deneyin (kredi düşülmedi)." }, 502);
      }
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
