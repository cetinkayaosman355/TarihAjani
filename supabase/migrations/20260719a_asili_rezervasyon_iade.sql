-- ============================================================
-- TARİH AJANI — ASILI REZERVASYON OTOMATİK İADESİ (kredi kaybı düzeltmesi)
-- Sorun: üretim sırasında gateway/edge kesintisi (502/546) olursa fonksiyon
--   refund'a ulaşamadan ölüyor → rezervasyon 'reserved' olarak ASILI kalıyor
--   → kullanıcının kredisi görünmez şekilde kayboluyordu (11 görselde 9 hata
--   vakasında yaşandı). İstemci artık kararlı opId gönderiyor (tekrar denemeler
--   aynı rezervasyonu kullanır) ama kesinti her zaman mümkün → SUNUCU tarafı ağ:
--
--   1) reserve_credits artık HER çağrıda önce o kullanıcının 15 dakikadan eski
--      'reserved' kayıtlarını otomatik İADE eder (hiçbir üretim 15 dk sürmez;
--      video ayrı akışta finalize/refund edildiğinden etkilenmez — onun job'ı
--      video_status'ta kapanır ve 15 dk sınırından önce poll edilir; yine de
--      güvenlik için video rezervasyonları 'uretim'/'gorsel'/'ses' dışı reason
--      taşımadığından aynı kurala tabidir ve poll finalize'ı idempotenttir).
--   2) Aşağıdaki tek seferlik blok, HALEN asılı duran eski rezervasyonları
--      hemen iade eder (kaybolan krediler geri gelir).
-- Tekrar çalıştırmak güvenlidir.
-- ============================================================

-- ── reserve_credits: asılı-iade ön adımıyla yeniden tanım ──
create or replace function public.reserve_credits(p_user uuid, p_amount int, p_reason text, p_job text)
returns table (ok boolean, new_credits int)
language plpgsql security definer set search_path = public as $$
declare v_sub int; v_top int; use_sub int; use_top int; v_exist public.credit_reservations%rowtype; r record;
begin
  -- 0) ASILI TEMİZLİK: bu kullanıcının 15 dk'dan eski 'reserved' kayıtları iade edilir
  for r in select job from public.credit_reservations
            where user_id = p_user and status = 'reserved' and created_at < now() - interval '15 minutes'
  loop
    perform public.refund_reservation(p_user, r.job);
  end loop;

  if p_amount is null or p_amount <= 0 then
    return query select true, public._bal(p_user); return;
  end if;
  if p_job is null or p_job = '' then
    return query select false, 0; return;
  end if;
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
  use_sub := least(v_sub, p_amount);
  use_top := p_amount - use_sub;
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
  return query select true, public._bal(p_user);
end $$;

revoke execute on function public.reserve_credits(uuid,int,text,text) from public, anon, authenticated;

-- ── TEK SEFERLİK KURTARMA: halen asılı duran TÜM eski rezervasyonları iade et ──
do $$
declare r record; n int := 0;
begin
  for r in select user_id, job from public.credit_reservations
            where status = 'reserved' and created_at < now() - interval '15 minutes'
  loop
    perform public.refund_reservation(r.user_id, r.job);
    n := n + 1;
  end loop;
  raise notice 'Asılı rezervasyon iade edildi: %', n;
end $$;
