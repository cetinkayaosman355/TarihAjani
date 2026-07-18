-- ============================================================
-- TARİH AJANI — Kredi sistemi Aşama 1: İKİ KOVA + SİPARİŞ + İDEMPOTENS
-- Amaç: mevcut (canlı) sistemi BOZMADAN B'nin güçlü yanlarını ekle.
--   • Satın alınan kredi (topup) ay dönünce YANMAZ  ← en kritik açık kapanır
--   • Ödeme sonrası kredi OTOMATİK + idempotent yüklenir (apply_paid_order)
--   • Harcamada çift-düşme koruması (op_locks + p_idem'li overload)
-- Geriye uyumlu: edge function'ın çağırdığı 3-arg spend_credits ve
-- refresh_profile_credits İMZALARI korunur; yalnız içleri iki-kovalı olur.
-- Tekrar çalıştırmak güvenlidir.
-- ============================================================

-- 1) TOPUP KOVASI — satın alınan, ASLA yanmayan kredi
alter table public.profiles
  add column if not exists topup_credits int not null default 0;

-- 2) İDEMPOTENS KİLİDİ
create table if not exists public.op_locks (
  idempotency_key text primary key,
  user_id         uuid,
  created_at      timestamptz not null default now()
);
alter table public.op_locks enable row level security;  -- politika yok = kimse göremez

-- 3) SİPARİŞ TABLOSU (checkout + webhook buradan geçer)
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete restrict,
  product_code        text not null,
  amount_try          numeric(10,2) not null,           -- katalogdan kopyalanır, callback'ten DEĞİL
  currency            text not null default 'TRY',
  provider            text not null default 'shopier',
  provider_payment_id text,
  status              text not null default 'pending'
                      check (status in ('pending','paid','failed','refunded')),
  raw_callback        jsonb,
  created_at          timestamptz not null default now(),
  paid_at             timestamptz
);
create index if not exists orders_user_idx   on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);
alter table public.orders enable row level security;
drop policy if exists orders_own_read on public.orders;
create policy orders_own_read on public.orders for select using (auth.uid() = user_id);

-- 4) ÜRÜN KATALOĞU — checkout için sunucu-doğrulamalı alanlar
alter table public.products
  add column if not exists code    text,
  add column if not exists kind    text,       -- credit_pack | membership | ebook | ...
  add column if not exists credits int not null default 0,
  add column if not exists tier    text,
  add column if not exists active  boolean not null default true;
-- code boşsa slug'ı code yap (varsa slug kolonu)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='products' and column_name='slug') then
    update public.products set code = slug where code is null;
  end if;
end $$;

-- ============================================================
-- 5) HARCAMA — İKİ KOVA (önce üyelik/yanacak, sonra topup/kalıcı)
--    3-arg imza KORUNUR (edge function bunu çağırıyor). new_credits = TOPLAM.
-- ============================================================
create or replace function public.spend_credits(p_user uuid, p_amount int, p_reason text)
returns table (ok boolean, new_credits int)
language plpgsql security definer set search_path = public as $$
declare v_sub int; v_top int; use_sub int; use_top int;
begin
  if p_amount is null or p_amount <= 0 then
    return query select false, 0; return;
  end if;
  select credits, coalesce(topup_credits,0) into v_sub, v_top
    from profiles where id = p_user for update;
  if v_sub is null then return query select false, 0; return; end if;
  if v_sub + v_top < p_amount then
    return query select false, v_sub + v_top; return;
  end if;
  use_sub := least(v_sub, p_amount);          -- önce yanacak olandan
  use_top := p_amount - use_sub;              -- kalan kalıcıdan
  update profiles
     set credits = credits - use_sub,
         topup_credits = coalesce(topup_credits,0) - use_top
   where id = p_user;
  if use_sub > 0 then
    insert into credit_log (user_id, delta, reason) values (p_user, -use_sub, p_reason);
  end if;
  if use_top > 0 then
    insert into credit_log (user_id, delta, reason) values (p_user, -use_top, p_reason || ':topup');
  end if;
  return query select true, (v_sub + v_top - p_amount);
end $$;

-- 5b) İDEMPOTENT overload — aynı işlem (aynı job/anahtar) iki kez düşmez.
--     Edge function ileride job kimliğini p_idem olarak geçirebilir (opsiyonel).
create or replace function public.spend_credits(p_user uuid, p_amount int, p_reason text, p_idem text)
returns table (ok boolean, new_credits int)
language plpgsql security definer set search_path = public as $$
declare v_total int; r_ok boolean; r_new int;
begin
  if p_idem is not null then
    begin
      insert into op_locks (idempotency_key, user_id) values (p_idem, p_user);
    exception when unique_violation then
      select credits + coalesce(topup_credits,0) into v_total from profiles where id = p_user;
      return query select true, coalesce(v_total,0); return;   -- zaten düşüldü
    end;
  end if;
  select s.ok, s.new_credits into r_ok, r_new from public.spend_credits(p_user, p_amount, p_reason) s;
  -- Harcama başarısızsa (yetersiz kredi) kilidi bırak → aynı anahtarla tekrar denenebilsin
  if p_idem is not null and not r_ok then
    delete from op_locks where idempotency_key = p_idem;
  end if;
  return query select r_ok, r_new;
end $$;

-- ============================================================
-- 6) KREDİ TANIMLA — artık TOPUP kovasına (paket = kalıcı, yanmaz)
-- ============================================================
create or replace function public.grant_credits(p_user uuid, p_amount int, p_reason text)
returns int
language plpgsql security definer set search_path = public as $$
declare v_total int;
begin
  update profiles set topup_credits = coalesce(topup_credits,0) + p_amount
   where id = p_user
   returning credits + coalesce(topup_credits,0) into v_total;
  insert into credit_log (user_id, delta, reason) values (p_user, p_amount, p_reason);
  return coalesce(v_total, 0);
end $$;

-- ============================================================
-- 7) BAKİYE/KOTA YENİLE — imza KORUNUR; credits = TOPLAM döner.
--    Aylık yenileme YALNIZ üyelik kovasını (credits) atar; topup'a DOKUNMAZ.
-- ============================================================
create or replace function public.refresh_profile_credits(p_user uuid)
returns table (tier text, monthly_quota int, credits int, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_row profiles%rowtype; v_gozlemci_quota int;
begin
  select * into v_row from profiles where id = p_user;
  if not found then return; end if;

  -- Üyelik süresi dolduysa gözlemci'ye düşür
  if v_row.expires_at is not null and v_row.expires_at < now() and v_row.tier <> 'gozlemci' then
    select quota into v_gozlemci_quota from tier_defs where id = 'gozlemci';
    update profiles
       set tier = 'gozlemci', monthly_quota = coalesce(v_gozlemci_quota, 1000), expires_at = null
     where id = p_user;
  end if;

  -- 30 gün geçtiyse ÜYELİK kotasını yenile (topup korunur)
  select * into v_row from profiles where id = p_user;
  if v_row.credits_reset_at is null or v_row.credits_reset_at < now() - interval '30 days' then
    update profiles set credits = v_row.monthly_quota, credits_reset_at = now() where id = p_user;
    insert into credit_log (user_id, delta, reason) values (p_user, v_row.monthly_quota, 'aylik_kota_yenileme');
  end if;

  return query select p.tier, p.monthly_quota,
                      (p.credits + coalesce(p.topup_credits,0)) as credits,   -- TOPLAM
                      p.expires_at
                 from profiles p where p.id = p_user;
end $$;

-- ============================================================
-- 8) SİPARİŞİ UYGULA — webhook buradan geçer.
--    Ne verileceği YALNIZ orders.product_code + products'tan okunur.
--    Callback'ten gelen tutar/ürün bilgisine ASLA bakılmaz. İdempotent.
-- ============================================================
create or replace function public.apply_paid_order(p_order uuid, p_payment_id text, p_raw jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype; pr public.products%rowtype; v_key text; v_quota int;
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
    -- Paket = KALICI kredi (topup)
    update profiles set topup_credits = coalesce(topup_credits,0) + coalesce(pr.credits,0)
     where id = o.user_id;
    insert into credit_log (user_id, delta, reason) values (o.user_id, coalesce(pr.credits,0), 'credit_pack');

  elsif pr.kind = 'membership' then
    select quota into v_quota from tier_defs where id = pr.tier;
    update profiles
       set tier = pr.tier,
           monthly_quota = coalesce(v_quota, monthly_quota),
           credits = coalesce(v_quota, 0),                 -- ilk ay üyelik hakkı ATANIR
           credits_reset_at = now(),
           expires_at = now() + interval '1 month'
     where id = o.user_id;
    insert into credit_log (user_id, delta, reason) values (o.user_id, coalesce(v_quota,0), 'membership_start');
    -- Not: tier_defs.quota kredisi topup'ı ETKİLEMEZ; satın alınan kredi korunur.
  end if;

  return json_build_object('ok', true, 'product', pr.code, 'kind', pr.kind);
end $$;

-- 9) Yeni fonksiyonları istemci DOĞRUDAN çağıramasın (yalnız service_role)
revoke execute on function public.spend_credits(uuid, int, text, text) from public, anon, authenticated;
revoke execute on function public.apply_paid_order(uuid, text, jsonb)   from public, anon, authenticated;
-- (3-arg spend_credits, grant_credits, refresh_profile_credits zaten revoke'lu)
