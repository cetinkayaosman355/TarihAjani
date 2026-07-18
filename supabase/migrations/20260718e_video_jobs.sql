-- ============================================================
-- TARİH AJANI — Video işleri: SAHİPLİK + BAŞARISIZLIKTA İADE (rapor 3.4 / 4.4 / 4.5)
-- Sorun: video submit'te ücretleniyor; sağlayıcı (Grok/Kling) sonradan başarısız
--   olursa kullanıcı krediyi kaybediyordu. Ayrıca video_status yalnız provider job
--   kimliğine dayanıyordu → başka kullanıcının işi sorgulanabiliyordu (sahiplik yok).
--
-- Çözüm: her video işi için uygulama-içi UUID + sahibi + sağlayıcı kimliği DB'de.
--   • İstemci yalnız uygulama UUID'sini görür (provider job id SIZMAZ).
--   • video_status sunucuda user_id ile eşleşmeyi doğrular (3.4).
--   • Kredi submit'te REZERVE edilir (reservation_job); başarıda finalize,
--     başarısız/expired'da refund_reservation ile otomatik iade (4.4/4.5).
-- Edge function service_role ile doğrudan yazar/okur; ekstra RPC gerekmez.
-- Tekrar çalıştırmak güvenlidir.
-- ============================================================

create table if not exists public.video_jobs (
  id              uuid primary key default gen_random_uuid(),   -- uygulama içi kimlik (istemciye dönen)
  user_id         uuid not null references auth.users(id) on delete cascade,
  provider        text not null,                                -- grok | kling
  provider_job_id text not null,                                -- sağlayıcı kimliği (istemciye sızmaz)
  reservation_job text,                                         -- credit_reservations.job (iade/finalize için)
  status          text not null default 'processing'
                  check (status in ('processing','completed','failed','refunded')),
  result_path     text,
  charged         int  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists vj_user_idx on public.video_jobs (user_id, created_at desc);
alter table public.video_jobs enable row level security;   -- politika yok = yalnız service_role
