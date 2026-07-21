-- ============================================================
-- TARİH AJANI — Görsel FAVORİ / ARŞİV / GÜVENLİ SİLME bayrakları
-- studio_images'e üç yumuşak durum ekler: is_favorite, is_archived, deleted_at.
--   • Silme SOFT'tur: satır ve Storage dosyası kalır (güvenli cleanup ileride);
--     deleted_at dolu satırlar hiçbir listede görünmez.
--   • İstemci yalnız KENDİ satırlarının YALNIZ bu üç kolonunu güncelleyebilir
--     (kolon-izinli grant + RLS). Diğer kolonlar service_role'da kalır.
--   • İşlemler idempotenttir (aynı değeri tekrar yazmak sonucu değiştirmez)
--     ve KREDİ HARCAMAZ (kredi uçlarına dokunmaz).
-- Tekrar çalıştırmak güvenlidir. Deploy: Supabase SQL Editor'de çalıştır.
-- ============================================================

alter table public.studio_images
  add column if not exists is_favorite boolean not null default false,
  add column if not exists is_archived boolean not null default false,
  add column if not exists deleted_at  timestamptz;

create index if not exists si_user_fav_idx  on public.studio_images (user_id) where is_favorite;
create index if not exists si_user_arch_idx on public.studio_images (user_id) where is_archived;

-- RLS: kullanıcı yalnız KENDİ satırını güncelleyebilir; kolon izni yalnız bayraklar
drop policy if exists "studio_images_update_flags_own" on public.studio_images;
create policy "studio_images_update_flags_own" on public.studio_images
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke update on public.studio_images from authenticated, anon;
grant update (is_favorite, is_archived, deleted_at) on public.studio_images to authenticated;
