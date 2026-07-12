// ============================================================
// TARİH AJANI — "chat" edge function (canlı sohbet + AJAN ASİSTAN)
// Ziyaretçi eylemleri (anon):
//   send   {thread, name?, email?, text}  → mesaj bırakır; AJAN ASİSTAN
//          (gpt-4o-mini) uygunsa anında yanıtlar, yanıt cevapla döner
//   fetch  {thread, afterId?}             → kendi konuşmasını çeker
// Yönetici eylemleri (password = ADMIN_PASSWORD):
//   threads                → son konuşmaların listesi
//   messagesOf {thread}    → bir konuşmanın tüm mesajları
//   reply {thread, text}   → 'ajan' olarak yanıt yazar (insan)
// Asistan kuralları: son 10 dk içinde İNSAN yanıtı varsa susar (devralma);
// konuşma başına en fazla 40 asistan yanıtı; yanıtlar kısa (≤260 token).
// Asistan mesajları name='ASISTAN' ile işaretlenir.
// Secrets: ADMIN_PASSWORD, OPENAI_API_KEY
// Tablo: public.chat_messages — RLS açık, anon politika YOK;
// erişim yalnız bu fonksiyon (service role) üzerinden.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const THREAD_RE = /^[a-zA-Z0-9-]{8,64}$/;

/* ── AJAN ASİSTAN (gpt-4o-mini) ── */

// deno-lint-ignore no-explicit-any
async function aiReply(db: any, thread: string): Promise<string | null> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return null;

  // konuşma geçmişi (son 24 mesaj yeter)
  const hist = await db.from("chat_messages")
    .select("sender,name,text,created_at")
    .eq("thread", thread).order("id", { ascending: false }).limit(24);
  if (hist.error || !hist.data) return null;
  const msgs = [...hist.data].reverse();

  // devralma: son 10 dk içinde İNSAN (name!=='ASISTAN') yanıtı varsa sus
  const now = Date.now();
  for (const m of msgs) {
    if (m.sender === "ajan" && m.name !== "ASISTAN" &&
        now - new Date(m.created_at).getTime() < 10 * 60 * 1000) return null;
  }
  // maliyet freni: konuşma başına en fazla 40 asistan yanıtı
  if (msgs.filter((m) => m.name === "ASISTAN").length >= 40) return null;

  // güncel fiyatlar — asistan yalnız buradakileri söyler
  const prods = await db.from("products").select("title,price").limit(40);
  const priceList = (prods.data || [])
    .map((p: { title: string; price: unknown }) => `- ${p.title}: ${p.price} TL`)
    .join("\n") || "- (fiyat listesi şu an boş; fiyat için /urunler sayfasına yönlendir)";

  const system = `Sen "Ajan Asistan"sın — tarihajani.com'un satış ve destek asistanı.
Tarih Ajanı; tarih hikâyeleri, vaka dosyaları, e-kitaplar, içerik üretim eğitimi ve Studio (yapay zekâ destekli üretim aracı) sunan Türkçe bir platform.
ÜSLUP: dedektif/ajan temasına uygun, samimi ve net. EN FAZLA 2-3 kısa cümle. Emoji nadiren.
GÖREV: soruyu yanıtla, doğru sayfaya/ürüne yönlendir, satın almaya nazikçe teşvik et; ısrarcı olma.
BİLGİ:
- Üyelik (/uyelik): Ücretsiz üyelik 30 deneme kredisi verir. Paralı paketler: Gözlemci, Ajan, Başmüfettiş (aylık/yıllık). Her paralı seviyede Studio kredisi ve 44 dosyalık hazır hikâye arşivi (/arsiv) var; Eğitim Akademisi ve e-kitap hediyeleri Ajan seviyesiyle gelir.
- Güncel ürün fiyatları (TL):
${priceList}
- Satın alma: /urunler → ürün → satış sayfası. Ödeme: kredi kartı (Shopier) veya havale/EFT. Dijital ürünlerde erişim onay sonrası açılır.
- Studio (/studio): konudan seslendirme metni, sahne/görsel promptları ve gerçek görsel üretir; süre 30 sn – 10 dk.
- Oyunlar (/zaman-tuneli): Satranç 1402 (Timur vs Bayezid) ve Mangala — ücretsiz.
- İnsan desteği: ziyaretçi insanla görüşmek isterse e-postasını bırakmasını söyle; ekip iletisim@tarihajani.com üzerinden döner.
KURALLAR: Bilmediğini uydurma; fiyat olarak YALNIZ listedekileri söyle. Konu dışı sorulara tek cümle nazik cevap verip siteye dön. Kişisel veri isteme (dönüş için e-posta hariç).`;

  const chat = msgs.slice(-16).map((m) => ({
    role: m.sender === "ziyaretci" ? "user" : "assistant",
    content: String(m.text || "").slice(0, 800),
  }));

  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 260,
        temperature: 0.6,
        messages: [{ role: "system", content: system }, ...chat],
      }),
      signal: ctl.signal,
    });
    if (!r.ok) return null;
    const d = await r.json();
    const text = d?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {
    return json({ ok: false, error: "Geçersiz istek gövdesi" }, 400);
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const action = String(body.action || "");

  /* ── ziyaretçi eylemleri ── */

  if (action === "send") {
    const thread = String(body.thread || "");
    const text = String(body.text || "").trim().slice(0, 600);
    if (!THREAD_RE.test(thread)) return json({ ok: false, error: "Geçersiz oturum" }, 400);
    if (!text) return json({ ok: false, error: "Mesaj boş" }, 400);
    // taşkın koruması: bir konuşmada en fazla 300 mesaj
    const cnt = await db.from("chat_messages")
      .select("id", { count: "exact", head: true }).eq("thread", thread);
    if ((cnt.count || 0) >= 300) return json({ ok: false, error: "Konuşma sınırına ulaşıldı" }, 429);
    const ins = await db.from("chat_messages").insert({
      thread,
      sender: "ziyaretci",
      name: String(body.name || "").trim().slice(0, 80),
      email: String(body.email || "").trim().slice(0, 120),
      text,
    }).select("id").single();
    if (ins.error) return json({ ok: false, error: ins.error.message }, 500);

    // AJAN ASİSTAN: uygunsa anında yanıtla (hata olsa da send başarılıdır)
    let reply: { id: number; text: string } | null = null;
    try {
      const answer = await aiReply(db, thread);
      if (answer) {
        const bot = await db.from("chat_messages")
          .insert({ thread, sender: "ajan", name: "ASISTAN", text: answer })
          .select("id").single();
        if (!bot.error && bot.data) reply = { id: bot.data.id, text: answer };
      }
    } catch { /* asistan hatası mesaj göndermeyi engellemez */ }

    return json({ ok: true, id: ins.data.id, reply });
  }

  if (action === "fetch") {
    const thread = String(body.thread || "");
    const afterId = Number(body.afterId) || 0;
    if (!THREAD_RE.test(thread)) return json({ ok: false, error: "Geçersiz oturum" }, 400);
    const q = await db.from("chat_messages")
      .select("id,sender,text,created_at")
      .eq("thread", thread).gt("id", afterId)
      .order("id", { ascending: true }).limit(200);
    if (q.error) return json({ ok: false, error: q.error.message }, 500);
    return json({ ok: true, messages: q.data || [] });
  }

  /* ── yönetici eylemleri ── */

  const pass = Deno.env.get("ADMIN_PASSWORD");
  if (!pass || body.password !== pass) {
    return json({ ok: false, error: "Şifre hatalı" }, 401);
  }

  if (action === "threads") {
    const q = await db.from("chat_messages")
      .select("id,thread,sender,name,email,text,created_at")
      .order("id", { ascending: false }).limit(400);
    if (q.error) return json({ ok: false, error: q.error.message }, 500);
    const map = new Map<string, Record<string, unknown>>();
    for (const m of q.data || []) {
      const t = map.get(m.thread) || { thread: m.thread, name: "", email: "", count: 0 };
      t.count = (t.count as number) + 1;
      if (!t.last) { t.last = m.text; t.lastAt = m.created_at; t.lastSender = m.sender; }
      if (!t.name && m.name) t.name = m.name;
      if (!t.email && m.email) t.email = m.email;
      map.set(m.thread, t);
    }
    return json({ ok: true, threads: [...map.values()].slice(0, 50) });
  }

  if (action === "messagesOf") {
    const thread = String(body.thread || "");
    if (!THREAD_RE.test(thread)) return json({ ok: false, error: "Geçersiz oturum" }, 400);
    const q = await db.from("chat_messages")
      .select("id,sender,name,email,text,created_at")
      .eq("thread", thread).order("id", { ascending: true }).limit(500);
    if (q.error) return json({ ok: false, error: q.error.message }, 500);
    return json({ ok: true, messages: q.data || [] });
  }

  if (action === "reply") {
    const thread = String(body.thread || "");
    const text = String(body.text || "").trim().slice(0, 1000);
    if (!THREAD_RE.test(thread)) return json({ ok: false, error: "Geçersiz oturum" }, 400);
    if (!text) return json({ ok: false, error: "Yanıt boş" }, 400);
    const ins = await db.from("chat_messages")
      .insert({ thread, sender: "ajan", text })
      .select("id").single();
    if (ins.error) return json({ ok: false, error: ins.error.message }, 500);
    return json({ ok: true, id: ins.data.id });
  }

  return json({ ok: false, error: "Bilinmeyen eylem: " + action }, 400);
});
