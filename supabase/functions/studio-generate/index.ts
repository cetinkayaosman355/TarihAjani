// Tarih Ajanı — Studio içerik üretimi + SUNUCU TARAFI KREDİ DÜŞME (anti-hile)
// Deploy: Edge Functions > studio-generate > bu kodu yapıştır > Deploy
// Secrets: OPENAI_API_KEY ve/veya ANTHROPIC_API_KEY (mevcut)
//   SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY otomatik gelir (kredi düşme için gerekli)
//
// Kredi mantığı: ücret client'tan DEĞİL, sunucudaki action->cost eşlemesinden gelir.
//   action:"generate" -> 100 kredi   ·   action:"regen" -> 5 kredi   ·   diğer/boş -> 0 (ücretsiz)
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

async function callOpenAI(prompt: string, maxTokens?: number): Promise<string> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY secret eksik.");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: maxTokens || 4000,
    }),
  });
  if (!r.ok) throw new Error("OpenAI: " + (await r.text()));
  const d = await r.json();
  return d.choices?.[0]?.message?.content ?? "";
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
const DURATION_COST: Record<string, number> = { sn30: 30, dk1: 60, dk4: 100, dk8: 150 };
function costFor(action: string, duration: string): number {
  if (action === "generate") return DURATION_COST[duration] ?? 100;
  if (action === "regen") return 5;
  return 0;
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

    // Üretim
    const provider = (b.provider || b.model || "openai").toLowerCase();
    const useClaude = provider === "claude" || provider === "anthropic";
    const result = useClaude ? await callClaude(prompt, b.max_tokens) : await callOpenAI(prompt, b.max_tokens);

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
