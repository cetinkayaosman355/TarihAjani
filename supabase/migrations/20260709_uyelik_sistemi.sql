-- ============================================================
-- TARİH AJANI — Üyelik / Seviye / Kota sistemi (Adım 1)
-- Supabase Dashboard → SQL Editor'e OLDUĞU GİBİ yapıştırıp Run deyin.
-- Tekrar çalıştırmak güvenlidir (if not exists / on conflict).
-- ============================================================

-- 1) profiles tablosuna yeni kolonlar
alter table public.profiles
  add column if not exists tier text not null default 'gozlemci',
  add column if not exists monthly_quota int not null default 1000,
  add column if not exists credits int not null default 0,
  add column if not exists credits_reset_at timestamptz,
  add column if not exists billing text not null default 'ay',
  add column if not exists expires_at timestamptz;

-- 2) Seviye tanımları (fiyat/kota tek yerden yönetilir)
create table if not exists public.tier_defs (
  id text primary key,
  name text not null,
  price_monthly int not null,
  quota int not null,
  features text[] not null default '{}'
);

insert into public.tier_defs (id, name, price_monthly, quota, features) values
  ('gozlemci',    'Gözlemci',     599,  1000,  array['Aylık 1.000 kredi', 'Studio erişimi']),
  ('ajan',        'Ajan',         1299, 5000,  array['Aylık 5.000 kredi', 'Öncelikli üretim']),
  ('basmufettis', 'Başmüfettiş',  1999, 15000, array['Aylık 15.000 kredi', 'Ekip kullanımı', 'Öncelikli destek'])
on conflict (id) do nothing;

-- 3) Kredi hareket kaydı
create table if not exists public.credit_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta int not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists credit_log_user_idx on public.credit_log (user_id, created_at desc);

-- 4) RLS: tier_defs herkes okur; credit_log'u kullanıcı yalnız kendi satırlarını okur,
--    yazma yalnızca service_role (edge function) üzerinden olur.
alter table public.tier_defs enable row level security;
drop policy if exists tier_defs_read on public.tier_defs;
create policy tier_defs_read on public.tier_defs for select using (true);

alter table public.credit_log enable row level security;
drop policy if exists credit_log_own_read on public.credit_log;
create policy credit_log_own_read on public.credit_log for select using (auth.uid() = user_id);

-- 5) ATOMİK harcama — bakiye kontrolü ve düşme tek adımda (hile önleme)
create or replace function public.spend_credits(p_user uuid, p_amount int, p_reason text)
returns table (ok boolean, new_credits int)
language plpgsql security definer set search_path = public as $$
declare v_credits int;
begin
  update profiles set credits = credits - p_amount
   where id = p_user and credits >= p_amount
   returning credits into v_credits;
  if v_credits is null then
    select credits into v_credits from profiles where id = p_user;
    return query select false, coalesce(v_credits, 0);
  end if;
  insert into credit_log (user_id, delta, reason) values (p_user, -p_amount, p_reason);
  return query select true, v_credits;
end $$;

-- 6) Vade + aylık kota yenileme (her balance çağrısında; cron gerekmez)
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

  -- 30 gün geçtiyse kotayı yenile
  select * into v_row from profiles where id = p_user;
  if v_row.credits_reset_at is null or v_row.credits_reset_at < now() - interval '30 days' then
    update profiles set credits = v_row.monthly_quota, credits_reset_at = now() where id = p_user;
    insert into credit_log (user_id, delta, reason) values (p_user, v_row.monthly_quota, 'aylik_kota_yenileme');
  end if;

  return query select p.tier, p.monthly_quota, p.credits, p.expires_at
                 from profiles p where p.id = p_user;
end $$;

-- 7) Kredi tanımlama (admin/ödeme onayı için)
create or replace function public.grant_credits(p_user uuid, p_amount int, p_reason text)
returns int
language plpgsql security definer set search_path = public as $$
declare v_credits int;
begin
  update profiles set credits = credits + p_amount where id = p_user returning credits into v_credits;
  insert into credit_log (user_id, delta, reason) values (p_user, p_amount, p_reason);
  return v_credits;
end $$;

-- 8) Bu fonksiyonları istemciler DOĞRUDAN çağıramasın (yalnız service_role / edge function)
revoke execute on function public.spend_credits(uuid, int, text) from public, anon, authenticated;
revoke execute on function public.refresh_profile_credits(uuid) from public, anon, authenticated;
revoke execute on function public.grant_credits(uuid, int, text) from public, anon, authenticated;

-- 9) Yeni kayıt olan her kullanıcı için profiles satırı garanti edilsin
--    (mevcut bir trigger varsa çakışmaz; on conflict ile sessizce geçer)
create or replace function public.ensure_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into profiles (id) values (new.id) on conflict (id) do nothing;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists ensure_profile_trg on auth.users;
create trigger ensure_profile_trg after insert on auth.users
  for each row execute function public.ensure_profile();
