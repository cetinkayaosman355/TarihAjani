-- ============================================================
-- TARİH AJANI — Kredi sistemi Aşama 3: ATOMİK REZERVASYON (reserve→finalize|refund)
-- Rapor 3.3 / 3.8 / 4.4: "bakiye kontrol et → üret → sonra düş" akışı yarış
--   durumuna açıktı (eşzamanlı üretimler aynı bakiyeyi yeterli görüp AI maliyeti
--   oluşturabiliyordu). Bu betik ADDİTİFtir: mevcut spend_credits/refresh akışını
--   BOZMAZ; edge function reserve-first'e geçtiğinde devreye girer.
--
--   Model: üretimden ÖNCE krediyi atomik REZERVE et (iki kovadan düş) →
--     • üretim başarılı  → finalize_reservation (kredi kalır)
--     • üretim başarısız → refund_reservation  (aynı kovalara iade)
--   İş kimliği (job) PK olduğundan aynı iş tekrar/eşzamanlı gelse bile ÇİFT DÜŞMEZ
--   (idempotent). Tekrar çalıştırmak güvenlidir.
-- ============================================================

create table if not exists public.credit_reservations (
  job        text primary key,                 -- istemci iş kimliği = idempotency anahtarı
  user_id    uuid not null references auth.users(id) on delete cascade,
  amount     int  not null,
  used_sub   int  not null default 0,          -- üyelik kovasından düşen (iade buraya döner)
  used_top   int  not null default 0,          -- topup kovasından düşen (iade buraya döner)
  status     text not null default 'reserved'
             check (status in ('reserved','finalized','refunded')),
  reason     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cr_user_idx on public.credit_reservations (user_id, created_at desc);
alter table public.credit_reservations enable row level security;   -- politika yok = yalnız service_role

-- Toplam bakiye yardımcı (iki kova)
create or replace function public._bal(p_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(credits,0) + coalesce(topup_credits,0) from profiles where id = p_user
$$;

-- ── REZERVE ET ── atomik kontrol + düşüm; aynı job tekrar gelirse idempotent (çift düşmez)
create or replace function public.reserve_credits(p_user uuid, p_amount int, p_reason text, p_job text)
returns table (ok boolean, new_credits int)
language plpgsql security definer set search_path = public as $$
declare v_sub int; v_top int; use_sub int; use_top int; v_exist public.credit_reservations%rowtype;
begin
  if p_amount is null or p_amount <= 0 then
    return query select true, public._bal(p_user); return;
  end if;
  if p_job is null or p_job = '' then
    return query select false, 0; return;
  end if;
  -- Zaten rezerve/finalize edilmişse idempotent dön (yeniden düşme yok). Refund edilmişse başarısız.
  select * into v_exist from public.credit_reservations where job = p_job;
  if found then
    return query select (v_exist.status <> 'refunded'), public._bal(p_user); return;
  end if;
  select coalesce(credits,0), coalesce(topup_credits,0) into v_sub, v_top
    from profiles where id = p_user for update;
  if v_sub is null then return query select false, 0; return; end if;
  if v_sub + v_top < p_amount then
    return query select false, v_sub + v_top; return;
  end if;
  use_sub := least(v_sub, p_amount);          -- önce yanacak (üyelik) kovadan
  use_top := p_amount - use_sub;              -- kalanı kalıcı (topup) kovadan
  update profiles
     set credits = credits - use_sub,
         topup_credits = coalesce(topup_credits,0) - use_top
   where id = p_user;
  insert into public.credit_reservations (job, user_id, amount, used_sub, used_top, reason)
    values (p_job, p_user, p_amount, use_sub, use_top, p_reason);
  if use_sub > 0 then insert into credit_log (user_id, delta, reason) values (p_user, -use_sub, 'reserve:' || coalesce(p_reason,'')); end if;
  if use_top > 0 then insert into credit_log (user_id, delta, reason) values (p_user, -use_top, 'reserve:' || coalesce(p_reason,'') || ':topup'); end if;
  return query select true, (v_sub + v_top - p_amount);
exception when unique_violation then
  -- Yarış: başka istek aynı job'ı ekledi → idempotent dön (çift düşme yok)
  return query select true, public._bal(p_user);
end $$;

-- ── KESİNLEŞTİR ── üretim başarılı; kredi zaten düşük, yalnız durumu işaretle
create or replace function public.finalize_reservation(p_job text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.credit_reservations set status = 'finalized', updated_at = now()
   where job = p_job and status = 'reserved';
end $$;

-- ── İADE ET ── üretim başarısız/iptal; rezervasyonu aynı kovalara geri ver (idempotent)
create or replace function public.refund_reservation(p_user uuid, p_job text)
returns int
language plpgsql security definer set search_path = public as $$
declare r public.credit_reservations%rowtype;
begin
  select * into r from public.credit_reservations where job = p_job for update;
  if not found or r.status <> 'reserved' then
    return public._bal(p_user);                -- yoksa/zaten kapandıysa dokunma (idempotent)
  end if;
  update profiles
     set credits = credits + r.used_sub,
         topup_credits = coalesce(topup_credits,0) + r.used_top
   where id = r.user_id;
  update public.credit_reservations set status = 'refunded', updated_at = now() where job = p_job;
  if r.used_sub > 0 then insert into credit_log (user_id, delta, reason) values (r.user_id, r.used_sub, 'refund:' || coalesce(r.reason,'')); end if;
  if r.used_top > 0 then insert into credit_log (user_id, delta, reason) values (r.user_id, r.used_top, 'refund:' || coalesce(r.reason,'') || ':topup'); end if;
  return public._bal(r.user_id);
end $$;

-- İstemci DOĞRUDAN çağıramaz — yalnız service_role (edge function)
revoke execute on function public.reserve_credits(uuid,int,text,text) from public, anon, authenticated;
revoke execute on function public.finalize_reservation(text)          from public, anon, authenticated;
revoke execute on function public.refund_reservation(uuid,text)       from public, anon, authenticated;
revoke execute on function public._bal(uuid)                          from public, anon, authenticated;
