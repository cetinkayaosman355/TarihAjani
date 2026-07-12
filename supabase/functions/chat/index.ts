// ============================================================
// TARİH AJANI — "chat" edge function (canlı sohbet)
// Ziyaretçi eylemleri (anon):
//   send   {thread, name?, email?, text}  → mesaj bırakır
//   fetch  {thread, afterId?}             → kendi konuşmasını çeker
// Yönetici eylemleri (password = ADMIN_PASSWORD):
//   threads                → son konuşmaların listesi
//   messagesOf {thread}    → bir konuşmanın tüm mesajları
//   reply {thread, text}   → 'ajan' olarak yanıt yazar
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
    return json({ ok: true, id: ins.data.id });
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
