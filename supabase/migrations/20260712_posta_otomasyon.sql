-- E-posta otomasyonu: hoş geldin + üyelik bitiş hatırlatması
-- 1) Takip kolonları (tek seferlik gönderim garantisi)
alter table public.profiles add column if not exists welcomed_at timestamptz;
alter table public.profiles add column if not exists last_reminder_at timestamptz;

-- 2) Günlük hatırlatma taraması (her gün 09:00 UTC = TR 12:00)
--    ÇALIŞTIRMADAN ÖNCE: <ADMIN_SIFREN> yerine admin panel şifreni yaz.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'uyelik-hatirlatma',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://ddyuopqcvpzaysnfavqc.supabase.co/functions/v1/posta',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXVvcHFjdnB6YXlzbmZhdnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzAxMjAsImV4cCI6MjA5ODkwNjEyMH0.0nTnXFFrPNlxWC_MIeRwqBCqgdYX_tG7WVUbsj0B6Cc'
    ),
    body := jsonb_build_object('action', 'reminders', 'secret', '<ADMIN_SIFREN>')
  );
  $$
);
