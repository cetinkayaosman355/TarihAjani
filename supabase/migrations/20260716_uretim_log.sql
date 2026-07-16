-- Ö-08: Üretim telemetrisi — "hata payı sıfır" hedefinin ölçüm aracı
-- ==================================================================
-- studio-generate her görsel/ses/dosya üretiminin sonucunu buraya yazar
-- (yalnız service role). Başarı oranı ve süreler buradan izlenir:
--   select action, count(*) filter (where ok) as ok, count(*) as toplam,
--          round(avg(ms)) as ort_ms
--   from uretim_log where ts > now() - interval '7 days'
--   group by action;

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
-- Politika YOK: anon/authenticated erişemez; yalnız service role yazar/okur.
