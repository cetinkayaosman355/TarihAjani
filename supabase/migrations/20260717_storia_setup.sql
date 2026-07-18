-- ============================================================
-- STORIA — Bağımsız backend kurulumu (tek dosya)
-- YENİ bir Supabase projesinde: Dashboard → SQL Editor → New query →
-- bu dosyanın TAMAMINI yapıştır → Run. Tekrar çalıştırmak güvenlidir.
-- (Tarih Ajanı projesiyle KARIŞTIRMA — Storia için AYRI proje aç.)
-- ============================================================

-- 1) profiles — kullanıcı hesap/kredi bilgisi (yoksa oluşturulur)
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  tier             text not null default 'kesif',
  monthly_quota    int  not null default 0,
  credits          int  not null default 0,
  credits_reset_at timestamptz,
  billing          text not null default 'ay',
  expires_at       timestamptz,
  created_at       timestamptz not null default now()
);

-- Var olan bir profiles tablosuna eksik kolonları ekle (idempotent)
alter table public.profiles
  add column if not exists tier text not null default 'kesif',
  add column if not exists monthly_quota int not null default 0,
  add column if not exists credits int not null default 0,
  add column if not exists credits_reset_at timestamptz,
  add column if not exists billing text not null default 'ay',
  add column if not exists expires_at timestamptz;

alter table public.profiles enable row level security;
drop policy if exists profiles_own_read on public.profiles;
create policy profiles_own_read on public.profiles for select using (auth.uid() = id);
-- Yazma yalnız service_role (edge function) üzerinden — kullanıcı kredisini kendisi değiştiremez.

-- 2) Paket tanımları (fiyat/kota tek yerden)
create table if not exists public.tier_defs (
  id text primary key,
  name text not null,
  price_monthly int not null,
  quota int not null,
  features text[] not null default '{}'
);

insert into public.tier_defs (id, name, price_monthly, quota, features) values
  ('kesif',       'Keşif',        0,    0,     array['Hoş geldin kredisi', 'Temel özellikler']),
  ('yaratici',    'Yaratıcı',     599,  1000,  array['Aylık 1.000 kredi', 'Tüm formatlar']),
  ('profesyonel', 'Profesyonel',  1299, 5000,  array['Aylık 5.000 kredi', 'Öncelikli üretim', 'Premium sesler']),
  ('studio',      'Stüdyo',       1999, 15000, array['Aylık 15.000 kredi', 'Ekip kullanımı', 'Öncelikli destek'])
on conflict (id) do update set name = excluded.name, price_monthly = excluded.price_monthly,
  quota = excluded.quota, features = excluded.features;

-- 3) Kredi hareket kaydı
create table if not exists public.credit_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta int not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists credit_log_user_idx on public.credit_log (user_id, created_at desc);

alter table public.tier_defs enable row level security;
drop policy if exists tier_defs_read on public.tier_defs;
create policy tier_defs_read on public.tier_defs for select using (true);

alter table public.credit_log enable row level security;
drop policy if exists credit_log_own_read on public.credit_log;
create policy credit_log_own_read on public.credit_log for select using (auth.uid() = user_id);

-- 4) Üretilen dosya geçmişi (cihazlar arası senkron — son N dosyanın metni)
create table if not exists public.studio_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  history    jsonb       not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.studio_state enable row level security;
drop policy if exists studio_state_select_own on public.studio_state;
create policy studio_state_select_own on public.studio_state for select using (auth.uid() = user_id);
drop policy if exists studio_state_insert_own on public.studio_state;
create policy studio_state_insert_own on public.studio_state for insert with check (auth.uid() = user_id);
drop policy if exists studio_state_update_own on public.studio_state;
create policy studio_state_update_own on public.studio_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5) Üretim telemetrisi (yalnız service role yazar/okur)
create table if not exists public.uretim_log (
  id      bigint generated always as identity primary key,
  ts      timestamptz not null default now(),
  action  text not null,
  ok      boolean not null,
  ms      integer,
  err     text,
  user_id uuid
);
create index if not exists uretim_log_ts_idx on public.uretim_log (ts desc);
alter table public.uretim_log enable row level security;

-- 6) Medya için herkese açık Storage bucket'ı (üretilen mp3/görsel + iş kurtarma)
insert into storage.buckets (id, name, public)
values ('storia-media', 'storia-media', true)
on conflict (id) do update set public = true;

-- 7) ATOMİK harcama — bakiye kontrolü ve düşme tek adımda (hile önleme)
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

-- 8) Vade + aylık kota yenileme (her balance çağrısında; cron gerekmez)
create or replace function public.refresh_profile_credits(p_user uuid)
returns table (tier text, monthly_quota int, credits int, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_row profiles%rowtype; v_free_quota int;
begin
  select * into v_row from profiles where id = p_user;
  if not found then return; end if;

  -- Üyelik süresi dolduysa ücretsiz pakete düşür
  if v_row.expires_at is not null and v_row.expires_at < now() and v_row.tier <> 'kesif' then
    select quota into v_free_quota from tier_defs where id = 'kesif';
    update profiles set tier = 'kesif', monthly_quota = coalesce(v_free_quota, 0), expires_at = null where id = p_user;
  end if;

  -- Ücretli pakette 30 gün geçtiyse kotayı yenile (ücretsiz pakette kota 0 → yenileme yok)
  select * into v_row from profiles where id = p_user;
  if v_row.monthly_quota > 0 and (v_row.credits_reset_at is null or v_row.credits_reset_at < now() - interval '30 days') then
    update profiles set credits = v_row.monthly_quota, credits_reset_at = now() where id = p_user;
    insert into credit_log (user_id, delta, reason) values (p_user, v_row.monthly_quota, 'aylik_kota_yenileme');
  end if;

  return query select p.tier, p.monthly_quota, p.credits, p.expires_at from profiles p where p.id = p_user;
end $$;

-- 9) Kredi tanımlama (admin/ödeme onayı için)
create or replace function public.grant_credits(p_user uuid, p_amount int, p_reason text)
returns int
language plpgsql security definer set search_path = public as $$
declare v_credits int;
begin
  update profiles set credits = credits + p_amount where id = p_user returning credits into v_credits;
  insert into credit_log (user_id, delta, reason) values (p_user, p_amount, p_reason);
  return v_credits;
end $$;

-- 10) İstemciler bu fonksiyonları DOĞRUDAN çağıramasın (yalnız service_role / edge function)
revoke execute on function public.spend_credits(uuid, int, text) from public, anon, authenticated;
revoke execute on function public.refresh_profile_credits(uuid) from public, anon, authenticated;
revoke execute on function public.grant_credits(uuid, int, text) from public, anon, authenticated;

-- 11) Yeni kayıt → profiles satırı + HOŞ GELDİN kredisi (150)
create or replace function public.ensure_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into profiles (id, email, tier, monthly_quota, credits, credits_reset_at)
    values (new.id, new.email, 'kesif', 0, 150, now())
    on conflict (id) do nothing;
    insert into credit_log (user_id, delta, reason) values (new.id, 150, 'hos_geldin');
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists ensure_profile_trg on auth.users;
create trigger ensure_profile_trg after insert on auth.users
  for each row execute function public.ensure_profile();

-- 11b) BACKFILL: migration'dan ÖNCE kayıt olmuş kullanıcılar için profil + 150 kredi
-- (idempotent — profili olan atlanır). Tekrar çalıştırmak güvenli.
insert into public.profiles (id, email, tier, monthly_quota, credits, credits_reset_at)
select u.id, u.email, 'kesif', 0, 150, now()
from auth.users u
on conflict (id) do nothing;
