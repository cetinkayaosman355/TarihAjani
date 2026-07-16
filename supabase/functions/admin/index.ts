// ============================================================
// TARİH AJANI — "admin" edge function (yönetici paneli sunucu yarısı)
// Tek istemcisi Admin.dc.html'dir. Eylemler (hepsi password ile):
//   list            → profiles + orders + products + expenses
//   setAccess       {id, value}
//   setOrderStatus  {id, status}
//   updateProduct   {slug, title, price, pay_url?}   ← pay_url YENİ:
//                    ürün başına Shopier/ödeme bağlantısı (kart akışı)
//   addExpense      {title, amount, note}
//   delExpense      {id}
// Secret: ADMIN_PASSWORD (credits fonksiyonuyla aynı şifre)
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {
    return json({ ok: false, error: "Geçersiz istek gövdesi" }, 400);
  }

  const pass = Deno.env.get("ADMIN_PASSWORD");
  if (!pass || body.password !== pass) {
    return json({ ok: false, error: "Şifre hatalı" }, 401);
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const action = String(body.action || "");

  if (action === "list") {
    // Tablolardan biri yoksa paneli düşürme: hatalı olan boş liste döner
    const [profiles, orders, products, expenses] = await Promise.all([
      db.from("profiles").select("*").order("created_at", { ascending: false }),
      db.from("orders").select("*").order("created_at", { ascending: false }),
      db.from("products").select("*").order("slug", { ascending: true }),
      db.from("expenses").select("*").order("created_at", { ascending: false }),
    ]);
    return json({
      ok: true,
      profiles: profiles.data || [],
      orders: orders.data || [],
      products: products.data || [],
      expenses: expenses.data || [],
    });
  }

  if (action === "setAccess") {
    const { error } = await db.from("profiles")
      .update({ has_access: body.value === true })
      .eq("id", body.id);
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true });
  }

  if (action === "setOrderStatus") {
    const status = String(body.status || "pending");
    const { error } = await db.from("orders")
      .update({ status })
      .eq("id", body.id);
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, status });
  }

  if (action === "updateProduct") {
    const slug = String(body.slug || "").trim();
    if (!slug) return json({ ok: false, error: "slug eksik" }, 400);
    const patch: Record<string, unknown> = {
      title: String(body.title || ""),
      price: body.price,
    };
    // pay_url yalnız gönderildiyse dokunulur; boş metin = linki kaldır
    if ("pay_url" in body) {
      const u = String(body.pay_url || "").trim();
      patch.pay_url = u || null;
    }
    const upd = await db.from("products").update(patch).eq("slug", slug).select("slug");
    if (upd.error) return json({ ok: false, error: upd.error.message }, 500);
    if (!upd.data || upd.data.length === 0) {
      // satır yoksa oluştur (yıllık paket gibi yeni slug'lar için)
      const ins = await db.from("products").insert({ slug, ...patch });
      if (ins.error) return json({ ok: false, error: ins.error.message }, 500);
    }
    return json({ ok: true });
  }

  if (action === "addExpense") {
    const amount = Number(body.amount) || 0;
    const title = String(body.title || "").trim();
    if (!title || amount <= 0) return json({ ok: false, error: "Başlık ve tutar gerekli" }, 400);
    const { error } = await db.from("expenses")
      .insert({ title, amount, note: String(body.note || "") });
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true });
  }

  if (action === "delExpense") {
    const { error } = await db.from("expenses").delete().eq("id", body.id);
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ ok: false, error: "Bilinmeyen eylem: " + action }, 400);
});
