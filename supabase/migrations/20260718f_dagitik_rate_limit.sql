-- ============================================================
-- TARİH AJANI — DAĞITIK HIZ LİMİTİ (rapor: distributed rate limit)
-- Sorun: mevcut hız limiti YALNIZ edge örneği belleğinde tutuluyor. Birden çok
--   edge örneği (veya soğuk başlatma) varsa aynı IP/kullanıcı, örnek başına ayrı
--   sayıldığı için limiti KATLAYARAK aşabiliyor → pahalı üretim uçları (generate/
--   image/video/tts/edit) kötüye kullanılabiliyordu.
--
-- Çözüm: tek satırlık ATOMİK sayaç (INSERT ... ON CONFLICT). Tüm örnekler aynı
--   DB satırını arttırdığından limit GERÇEKTEN paylaşımlı olur. Bu betik ADDİTİF:
--   edge function RPC'yi bulamazsa (migration çalışmadıysa) sessizce yalnız
--   bellek-içi limite düşer → mevcut sistem KIRILMAZ. Tekrar çalıştırmak güvenli.
-- ============================================================

create table if not exists public.rate_hits (
  key          text primary key,                 -- ör. "gen:ip:1.2.3.4" | "paid:user:<uuid>"
  window_start timestamptz not null default now(),
  n            int         not null default 0,
  updated_at   timestamptz not null default now()
);
alter table public.rate_hits enable row level security;   -- politika yok = yalnız service_role

-- ── SAYAÇ VUR ── kayan pencere içinde atomik artış; true = LİMİT AŞILDI (reddet)
-- Aynı key'e eşzamanlı istekler ON CONFLICT satır kilidiyle serileşir → sayım şaşmaz.
create or replace function public.rl_hit(p_key text, p_limit int, p_window int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  if p_key is null or p_key = '' or p_limit is null or p_limit <= 0 then
    return false;                                 -- limitsiz/anahtarsız → engelleme
  end if;
  insert into public.rate_hits as h (key, window_start, n, updated_at)
    values (p_key, now(), 1, now())
  on conflict (key) do update
    set n = case when now() - h.window_start > make_interval(secs => p_window)
                 then 1 else h.n + 1 end,
        window_start = case when now() - h.window_start > make_interval(secs => p_window)
                 then now() else h.window_start end,
        updated_at = now()
  returning h.n into v_n;
  -- Fırsatçı temizlik (%1): uzun süredir dokunulmayan satırları sil (tablo şişmesin)
  if random() < 0.01 then
    delete from public.rate_hits where updated_at < now() - interval '1 hour';
  end if;
  return v_n > p_limit;
end $$;

-- İstemci DOĞRUDAN çağıramaz — yalnız service_role (edge function)
revoke execute on function public.rl_hit(text,int,int) from public, anon, authenticated;
