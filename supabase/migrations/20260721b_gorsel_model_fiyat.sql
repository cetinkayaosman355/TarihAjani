-- ============================================================================
-- GÖRSEL MODEL BAZLI FİYAT + KISMİ KESİNLEŞTİRME (settle)
-- GPT Image 2=20, GPT Image 1.5=12, GPT Image 1=8. Kullanıcı GPT Image 2 (20)
-- ister ama zaman aşımında yedeğe (gpt-image-1) düşülürse: YALNIZ gerçekten
-- üretilen modelin fiyatı (8) alınır, farkı (12) iade edilir. Bunun için
-- rezervasyonu p_final krediye "kısmi kesinleştiren" settle_reservation eklendi.
-- (finalize_reservation TÜM ayrılanı düşük tutuyordu; settle fazlayı geri verir.)
-- ============================================================================
create or replace function public.settle_reservation(p_user uuid, p_job text, p_final int)
returns int
language plpgsql security definer set search_path = public as $$
declare
  r public.credit_reservations%rowtype;
  keep_amt   int;
  refund_tot int;
  refund_top int;
  refund_sub int;
begin
  select * into r from public.credit_reservations where job = p_job for update;
  if not found or r.status <> 'reserved' then
    return public._bal(p_user);                 -- yoksa/zaten kapandıysa dokunma (idempotent)
  end if;
  keep_amt   := greatest(0, least(coalesce(p_final, r.amount), r.amount));
  refund_tot := r.amount - keep_amt;
  if refund_tot <= 0 then
    -- iade yok → normal kesinleştir
    update public.credit_reservations set status = 'finalized', updated_at = now() where job = p_job;
    return public._bal(p_user);
  end if;
  -- Fazla ayrılanı geri ver: önce topup (kalıcı) kovadan, sonra sub (üyelik) kovadan
  refund_top := least(refund_tot, r.used_top);
  refund_sub := refund_tot - refund_top;
  update profiles
     set credits       = credits + refund_sub,
         topup_credits = coalesce(topup_credits,0) + refund_top
   where id = r.user_id;
  update public.credit_reservations
     set amount = keep_amt, used_sub = r.used_sub - refund_sub, used_top = r.used_top - refund_top,
         status = 'finalized', updated_at = now()
   where job = p_job;
  if refund_sub > 0 then insert into credit_log (user_id, delta, reason) values (r.user_id, refund_sub, 'settle:' || coalesce(r.reason,'')); end if;
  if refund_top > 0 then insert into credit_log (user_id, delta, reason) values (r.user_id, refund_top, 'settle:' || coalesce(r.reason,'') || ':topup'); end if;
  return public._bal(r.user_id);
end $$;

revoke execute on function public.settle_reservation(uuid,text,int) from public, anon, authenticated;
grant  execute on function public.settle_reservation(uuid,text,int) to service_role;
