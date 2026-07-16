-- ============================================================
-- TARİH AJANI — ÜCRETSİZ ÜYE seviyesi (Adım: ücretsiz/paralı ayrımı)
-- Supabase Dashboard → SQL Editor'e OLDUĞU GİBİ yapıştırıp Run deyin.
-- Tekrar çalıştırmak güvenlidir.
--
-- Model:
--   'uye'  → ÜCRETSİZ. Kayıtta tek seferlik 30 deneme kredisi. Yenilenmez.
--            Arşiv KİLİTLİ (paralı seviye gerekir).
--   'gozlemci' / 'ajan' / 'basmufettis' → PARALI. Aylık kota yenilenir.
-- ============================================================

-- 1) Ücretsiz seviye tanımı (fiyat 0, aylık kota 0 = yenilenmez)
insert into public.tier_defs (id, name, price_monthly, quota, features) values
  ('uye', 'Üye', 0, 0, array['Tek seferlik 30 deneme kredisi', 'Arşiv & tam Studio için paralı seviye gerekir'])
on conflict (id) do update
  set name = excluded.name, price_monthly = excluded.price_monthly,
      quota = excluded.quota, features = excluded.features;

-- 2) Yeni kayıtların VARSAYILANI ücretsiz üye olsun (paralı gozlemci DEĞİL)
alter table public.profiles alter column tier          set default 'uye';
alter table public.profiles alter column monthly_quota set default 0;
alter table public.profiles alter column credits       set default 30;   -- tek seferlik deneme

-- 3) Vade + kota yenileme: ücretsiz üye krediyi YENİLEMEZ; paralı biterse ÜCRETSİZ'e düşer
create or replace function public.refresh_profile_credits(p_user uuid)
returns table (tier text, monthly_quota int, credits int, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_row profiles%rowtype;
begin
  select * into v_row from profiles where id = p_user;
  if not found then return; end if;

  -- Paralı üyelik süresi dolduysa ÜCRETSİZ üye'ye düşür (kredi sıfırlanır, deneme geri gelmez)
  if v_row.expires_at is not null and v_row.expires_at < now() and v_row.tier <> 'uye' then
    update profiles
       set tier = 'uye', monthly_quota = 0, credits = 0, expires_at = null
     where id = p_user;
    select * into v_row from profiles where id = p_user;
  end if;

  -- Aylık kota yenileme YALNIZ paralı seviyelerde (monthly_quota > 0).
  -- Ücretsiz üye deneme kredisi tek seferliktir; asla yenilenmez/silinmez.
  if v_row.monthly_quota > 0
     and (v_row.credits_reset_at is null or v_row.credits_reset_at < now() - interval '30 days') then
    update profiles set credits = v_row.monthly_quota, credits_reset_at = now() where id = p_user;
    insert into credit_log (user_id, delta, reason) values (p_user, v_row.monthly_quota, 'aylik_kota_yenileme');
  end if;

  return query select p.tier, p.monthly_quota, p.credits, p.expires_at
                 from profiles p where p.id = p_user;
end $$;

-- 4) Yeni kayıt: ücretsiz üye + 30 deneme kredisiyle profil aç (varsayılanlardan bağımsız garanti)
create or replace function public.ensure_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_new boolean := false;
begin
  begin
    insert into profiles (id, tier, monthly_quota, credits)
      values (new.id, 'uye', 0, 30)
      on conflict (id) do nothing;
    if found then v_new := true; end if;
    if v_new then
      insert into credit_log (user_id, delta, reason) values (new.id, 30, 'deneme_kredisi');
    end if;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists ensure_profile_trg on auth.users;
create trigger ensure_profile_trg after insert on auth.users
  for each row execute function public.ensure_profile();

-- 5) (İsteğe bağlı) Ödeme yapmamış mevcut test hesaplarını ücretsiz üye'ye çekmek isterseniz,
--    aşağıdaki satırın başındaki -- işaretini kaldırıp çalıştırın (expires_at'i olmayan gozlemci'ler):
-- update public.profiles set tier='uye', monthly_quota=0, credits=least(credits,30)
--   where tier='gozlemci' and expires_at is null;
