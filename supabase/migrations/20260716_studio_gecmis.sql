-- Studio geçmişi (üretilen dosyalar) cihazlar arası senkron
-- =========================================================
-- Şu ana kadar üretilen dosya geçmişi yalnız cihazın localStorage'ında
-- duruyordu → mobilde üretilen web'de, web'deki mobilde görünmüyordu.
-- Bu tablo, geçmişi kullanıcı hesabına bağlar; istemci her cihazda buradan
-- yükler ve buraya yazar. Yalnız son 12 dosyanın METNİ (senaryo, sahne
-- promptları, meta) tutulur — görseller ağır olduğu için burada değil.

create table if not exists public.studio_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  history    jsonb       not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.studio_state enable row level security;

-- Kullanıcı yalnız KENDİ satırını okur ve yazar.
drop policy if exists "studio_state_select_own" on public.studio_state;
create policy "studio_state_select_own" on public.studio_state
  for select using (auth.uid() = user_id);

drop policy if exists "studio_state_insert_own" on public.studio_state;
create policy "studio_state_insert_own" on public.studio_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "studio_state_update_own" on public.studio_state;
create policy "studio_state_update_own" on public.studio_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
