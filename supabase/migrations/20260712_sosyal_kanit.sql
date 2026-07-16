-- ============================================================
-- TARİH AJANI — Sosyal kanıt: gerçek kullanıcı yorumları
-- Ziyaretçi yorum bırakır (approved=false); admin onaylayınca yayına çıkar.
-- Erişim yalnız "sosyal-kanit" edge fonksiyonu (service role) üzerinden.
-- Canlı sayaçlar için ayrıca profiles (üye) ve credit_log (üretim) sayılır.
-- Supabase Dashboard → SQL Editor'e olduğu gibi yapıştırıp Run deyin.
-- Tekrar çalıştırmak güvenlidir (if not exists).
-- ============================================================
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  name text not null default '',
  tier text not null default '',        -- yorumcunun kendi belirttiği seviye (etiket)
  rating int not null default 5,        -- 1..5
  body text not null,
  approved boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists reviews_pub_idx on public.reviews (approved, featured, id desc);

-- RLS açık, anon politika bilinçli olarak YOK (yalnız service role erişir)
alter table public.reviews enable row level security;
