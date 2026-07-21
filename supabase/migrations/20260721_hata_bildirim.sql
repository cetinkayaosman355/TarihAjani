-- ============================================================================
-- HATA BİLDİRİM SİSTEMİ — problem_reports
-- Her görsel/üretim sorunu KALICI kayda geçer + iletisim@tarihajani.com'a e-posta.
-- Tanılama alanları destek tarafında "üretildi mi / kredi düştü mü" bakışını sağlar.
-- ============================================================================
create table if not exists public.problem_reports (
  id              uuid primary key default gen_random_uuid(),
  ref             text unique not null,           -- kullanıcıya dönen referans (TA-XXXX)
  user_id         uuid references auth.users(id) on delete set null,
  email           text,
  area            text,                            -- 'gorsel' | 'senaryo' | 'video' | 'genel'
  op_id           text,                            -- ilgili üretim iş kimliği (kredi/kurtarma izi)
  scene_key       text,
  error_code      text,                            -- IMG-TIMEOUT / IMG-RATE / ... (sabit kod sistemi)
  model_req       text,                            -- istenen model (ör. gpt-image-2)
  model_used      text,                            -- gerçekte üreten model (ör. gpt-image-1)
  produced        boolean,                         -- görsel üretildi mi
  credit_deducted boolean,                         -- kredi düştü mü (destek buna göre iade eder)
  story_title     text,
  message         text,                            -- kullanıcının serbest notu
  ua              text,                            -- tarayıcı/cihaz (tanılama)
  status          text not null default 'open',    -- open | resolved
  created_at      timestamptz not null default now()
);

create index if not exists problem_reports_user_idx on public.problem_reports (user_id, created_at desc);
create index if not exists problem_reports_status_idx on public.problem_reports (status, created_at desc);

alter table public.problem_reports enable row level security;

-- Kullanıcı YALNIZ kendi raporunu ekler/görür. Servis rolü (edge function) tümünü yönetir.
drop policy if exists "pr_insert_own" on public.problem_reports;
create policy "pr_insert_own" on public.problem_reports
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "pr_select_own" on public.problem_reports;
create policy "pr_select_own" on public.problem_reports
  for select to authenticated using (auth.uid() = user_id);

grant select, insert on public.problem_reports to authenticated;
