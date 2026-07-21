-- ============================================================================
-- OTONOM DESTEK AJANI — JEST KREDİSİ (goodwill), guardrail'li
-- Ajan gerçek mağduriyette "kredini geri vereyim" diyebilsin diye. AMA suistimal
-- olmasın: KULLANICI BAŞINA GÜNLÜK TAVAN (varsayılan 2 işlem / 40 kredi) + op
-- başına İDEMPOTENT (aynı op'a iki kez jest yok) + yalnız service_role çağırır.
-- Salt-okunur bakış, ücretsiz tekrar ve ASILI rezervasyon iadesi bu RPC'ye GİRMEZ
-- (onlar zaten güvenli; bu yalnız KESİNLEŞMİŞ ücrete jest kredisi içindir).
-- ============================================================================
create or replace function public.goodwill_grant(
  p_user uuid, p_op text, p_amount int, p_daily_ops int, p_daily_amt int
) returns table (ok boolean, granted int, new_credits int, code text)
language plpgsql security definer set search_path = public as $$
declare
  v_key   text := 'goodwill:' || p_user::text || ':' || coalesce(p_op,'');
  v_ops   int;
  v_sum   int;
  v_grant int;
begin
  if p_user is null or coalesce(p_amount,0) <= 0 then
    return query select false, 0, public._bal(p_user), 'invalid'; return;
  end if;
  -- İdempotent: bu op için jest zaten verildiyse tekrar VERME
  if exists (select 1 from op_locks where idempotency_key = v_key) then
    return query select true, 0, public._bal(p_user), 'already'; return;
  end if;
  -- GÜNLÜK TAVAN: bugünkü jest kredileri (credit_log reason 'goodwill:%')
  select count(*), coalesce(sum(delta),0) into v_ops, v_sum
    from credit_log
   where user_id = p_user and reason like 'goodwill:%' and created_at >= date_trunc('day', now());
  if v_ops >= greatest(0, p_daily_ops) then
    return query select false, 0, public._bal(p_user), 'daily_ops'; return;
  end if;
  v_grant := least(p_amount, greatest(0, p_daily_amt) - v_sum);
  if v_grant <= 0 then
    return query select false, 0, public._bal(p_user), 'daily_amt'; return;
  end if;
  -- Kilidi al (yarış kapanır: iki eşzamanlı istek yalnız BİR jest alır)
  begin
    insert into op_locks (idempotency_key, user_id) values (v_key, p_user);
  exception when unique_violation then
    return query select true, 0, public._bal(p_user), 'already'; return;
  end;
  update profiles set topup_credits = coalesce(topup_credits,0) + v_grant where id = p_user;
  insert into credit_log (user_id, delta, reason) values (p_user, v_grant, 'goodwill:' || coalesce(p_op,''));
  return query select true, v_grant, public._bal(p_user), 'granted';
end $$;

revoke execute on function public.goodwill_grant(uuid,text,int,int,int) from public, anon, authenticated;
grant  execute on function public.goodwill_grant(uuid,text,int,int,int) to service_role;
