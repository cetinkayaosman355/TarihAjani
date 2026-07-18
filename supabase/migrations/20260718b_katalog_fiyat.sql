-- ============================================================
-- TARİH AJANI — Kredi sistemi Aşama 2a: KATALOG + FİYAT (karar verildi)
--   • tier_defs → sürdürülebilir fiyat/kota (B modeli, marj %63–68)
--   • products → kredi paketleri + üyelikler (aylık + YILLIK %10 indirim)
--   • apply_paid_order → yıllık üyelik için period_months desteği
-- Aşama 1'den SONRA çalıştırılır. Tekrar çalıştırmak güvenlidir.
-- ============================================================

-- 0) Üyelik süresi kolonu (aylık=1, yıllık=12)
alter table public.products
  add column if not exists period_months int not null default 1;

-- 1) SEVİYE FİYAT/KOTA — sürdürülebilir (kredi başı 0,57–0,67 ₺)
insert into public.tier_defs (id, name, price_monthly, quota, features) values
  ('gozlemci',    'Gözlemci',     399,  600,  array['Aylık 600 kredi','Studio erişimi','Arşiv']),
  ('ajan',        'Ajan',         899,  1500, array['Aylık 1.500 kredi','Öncelikli üretim','Akademi']),
  ('basmufettis', 'Başmüfettiş',  1699, 3000, array['Aylık 3.000 kredi','En yüksek öncelik','Tüm arşiv + akademi'])
on conflict (id) do update
  set price_monthly = excluded.price_monthly, quota = excluded.quota, features = excluded.features;

-- 2) ÜRÜN KATALOĞU (sunucu-doğrulamalı; fiyat buradan okunur)
--    NOT: products slug=PK varsayıldı; kolonlar Aşama 1'de eklendi.
--    Bir NOT NULL kolon hatası alırsan products tanımını (\d products) paylaş, uyarlayayım.
insert into public.products (slug, code, kind, title, price, credits, tier, period_months, active) values
  -- Kredi paketleri (kalıcı topup) — en yüksek marj
  ('KP-60',   'KP-60',   'credit_pack', 'Keşif Zarfı — 60 kredi',       69,   60,   null, 1,  true),
  ('KP-200',  'KP-200',  'credit_pack', 'Saha Çantası — 200 kredi',     209,  200,  null, 1,  true),
  ('KP-500',  'KP-500',  'credit_pack', 'Ajan Sandığı — 500 kredi',     479,  500,  null, 1,  true),
  ('KP-1200', 'KP-1200', 'credit_pack', 'Arşiv Kasası — 1.200 kredi',   1049, 1200, null, 1,  true),
  -- Üyelikler — aylık
  ('UY-GOZ',  'UY-GOZ',  'membership',  'Gözlemci — aylık',             399,  0,    'gozlemci',    1,  true),
  ('UY-AJN',  'UY-AJN',  'membership',  'Ajan — aylık',                 899,  0,    'ajan',        1,  true),
  ('UY-BSM',  'UY-BSM',  'membership',  'Başmüfettiş — aylık',          1699, 0,    'basmufettis', 1,  true),
  -- Üyelikler — YILLIK (%10 indirim: 12 ay × %90)
  ('UY-GOZ-YIL', 'UY-GOZ-YIL', 'membership', 'Gözlemci — yıllık (%10 indirim)',    4309,  0, 'gozlemci',    12, true),
  ('UY-AJN-YIL', 'UY-AJN-YIL', 'membership', 'Ajan — yıllık (%10 indirim)',        9709,  0, 'ajan',        12, true),
  ('UY-BSM-YIL', 'UY-BSM-YIL', 'membership', 'Başmüfettiş — yıllık (%10 indirim)', 18349, 0, 'basmufettis', 12, true)
on conflict (slug) do update
  set code = excluded.code, kind = excluded.kind, title = excluded.title, price = excluded.price,
      credits = excluded.credits, tier = excluded.tier, period_months = excluded.period_months, active = excluded.active;

-- 3) apply_paid_order — yıllık üyelikte expires_at = now() + period_months ay
create or replace function public.apply_paid_order(p_order uuid, p_payment_id text, p_raw jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype; pr public.products%rowtype; v_key text; v_quota int; v_months int;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then return json_build_object('ok', false, 'error', 'order_not_found'); end if;
  if o.status = 'paid' then return json_build_object('ok', true, 'replayed', true); end if;
  if o.status <> 'pending' then
    return json_build_object('ok', false, 'error', 'bad_status', 'status', o.status);
  end if;

  select * into pr from public.products where code = o.product_code and coalesce(active,true) = true;
  if not found then return json_build_object('ok', false, 'error', 'product_inactive'); end if;

  update public.orders set status = 'paid', paid_at = now(),
         provider_payment_id = p_payment_id, raw_callback = p_raw
   where id = p_order;

  v_key := 'order:' || p_order::text;
  begin
    insert into op_locks (idempotency_key, user_id) values (v_key, o.user_id);
  exception when unique_violation then
    return json_build_object('ok', true, 'replayed', true);
  end;

  if pr.kind = 'credit_pack' then
    update profiles set topup_credits = coalesce(topup_credits,0) + coalesce(pr.credits,0)
     where id = o.user_id;
    insert into credit_log (user_id, delta, reason) values (o.user_id, coalesce(pr.credits,0), 'credit_pack');

  elsif pr.kind = 'membership' then
    select quota into v_quota from tier_defs where id = pr.tier;
    v_months := greatest(1, coalesce(pr.period_months, 1));
    update profiles
       set tier = pr.tier,
           monthly_quota = coalesce(v_quota, monthly_quota),
           credits = coalesce(v_quota, 0),                       -- ilk ay hakkı ATANIR (topup korunur)
           credits_reset_at = now(),
           expires_at = now() + (v_months || ' months')::interval  -- yıllık = 12 ay
     where id = o.user_id;
    insert into credit_log (user_id, delta, reason) values (o.user_id, coalesce(v_quota,0), 'membership_start');
    -- Yıllık boyunca refresh_profile_credits her 30 günde aylık kotayı yeniden atar.
  end if;

  return json_build_object('ok', true, 'product', pr.code, 'kind', pr.kind, 'months', coalesce(pr.period_months,1));
end $$;
revoke execute on function public.apply_paid_order(uuid, text, jsonb) from public, anon, authenticated;
