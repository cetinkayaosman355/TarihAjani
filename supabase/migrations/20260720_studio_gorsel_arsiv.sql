-- =========================================================
-- TARİH AJANI — Üretilen görsellerin HESABA BAĞLI kalıcı arşivi
-- =========================================================
-- Sorun (P0): Üretilen görseller yalnız tarayıcı IndexedDB'sinde (cihaz-başına,
--   max 120) ve localStorage'da tutuluyordu; ağır oldukları için studio_state'e
--   de yazılmıyordu (bkz. 20260716_studio_gecmis.sql notu). Sonuç: başka cihaz/
--   tarayıcıda görseller görünmüyor, hesaba bağlı GEÇMİŞ ÜRETİMLER eksik.
--
-- Çözüm: Görsel BINARY'si zaten Storage'da (studio-ses bucket, kalıcı public URL).
--   Bu tablo yalnız METADATA + storage URL'i hesaba bağlar. İstemci her cihazda
--   buradan (RLS ile KENDİ satırları) listeler; edge function (service_role)
--   üretim başarısında buraya yazar. Idempotent: (user_id, op_id) tekildir →
--   aynı üretim/kurtarma iki satır oluşturmaz.
--
-- ⚠ CANLI DB'YE HENÜZ UYGULANMADI — önce gözden geçirilecek. Tekrar çalıştırmak güvenlidir.

create table if not exists public.studio_images (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  op_id         text not null,                        -- kararlı üretim kimliği (idempotency/dedup)
  file_id       text,                                 -- hikâye/dosya id (bağımsız görselde NULL)
  scene_key     text,                                 -- sahne anahtarı ('gp3') / 'cover' / NULL
  kind          text not null default 'standalone'
                check (kind in ('scene','cover','standalone')),
  provider      text,                                 -- GPT | Gemini (kart etiketi)
  model         text,                                 -- gerçekten kullanılan model
  style         text,
  aspect        text,                                 -- seçilen oran (9:16 / 16:9 / 1:1)
  resolution    text,                                 -- gerçek dosya çözünürlüğü
  storage_url   text not null,                        -- kalıcı Storage URL'i
  bytes         int,
  spent_credits int,
  prompt        text,
  story_title   text,                                 -- geçmiş ekranında join'siz gösterim için
  created_at    timestamptz not null default now(),
  unique (user_id, op_id)                             -- idempotent upsert hedefi
);

create index if not exists si_user_created_idx on public.studio_images (user_id, created_at desc);
create index if not exists si_user_file_idx    on public.studio_images (user_id, file_id);

alter table public.studio_images enable row level security;

-- Kullanıcı yalnız KENDİ görsellerini okur (istemci doğrudan RLS ile listeler).
-- Yazma edge function tarafından service_role ile yapılır (RLS bypass).
drop policy if exists "studio_images_select_own" on public.studio_images;
create policy "studio_images_select_own" on public.studio_images
  for select using (auth.uid() = user_id);
