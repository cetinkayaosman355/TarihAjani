-- Studio seslendirme dosyaları için herkese açık Storage bucket'ı.
-- Yazma yalnız service role (studio-generate fonksiyonu) ile yapılır;
-- public=true yalnız OKUMAYI açar (üretilen mp3 linki dinlenebilsin).
insert into storage.buckets (id, name, public)
values ('studio-ses', 'studio-ses', true)
on conflict (id) do update set public = true;
