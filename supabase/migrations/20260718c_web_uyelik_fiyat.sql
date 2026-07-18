-- ============================================================
-- TARİH AJANI — Web üyelik fiyatlarını B-modeline çek (Aşama 2b)
--   Web sayfaları (Ana Sayfa / Üyelik / Satış / Admin) fiyatı fiyat-cache.js
--   üzerinden products tablosundan, slug = 'uyelik-*' ile okur. App ise UY-*
--   kodlarını okur. Aşama 2a UY-* satırlarını güncelledi ama uyelik-* satırları
--   eski fiyatta (599/1299/1999) kalmıştı → web'de fiyat değişmiyordu.
--
--   Bu betik SADECE mevcut uyelik-* satırlarının fiyatını/başlığını günceller.
--   Satır yoksa hiçbir şey olmaz (web o zaman koda gömülü 399/899/1699 varsayılanını
--   gösterir — yine doğru). Tekrar çalıştırmak güvenlidir.
-- ============================================================

-- Aylık üyelikler (web bu üç slug'ı okur; yıllığı ×12×%90 ile kendisi hesaplar)
update public.products set price = 399,  title = 'Gözlemci — Aylık Üyelik'    where slug = 'uyelik-gozlemci';
update public.products set price = 899,  title = 'Ajan — Aylık Üyelik'        where slug = 'uyelik-ajan';
update public.products set price = 1699, title = 'Başmüfettiş — Aylık Üyelik' where slug = 'uyelik-basmufettis';

-- Yıllık satırlar (varsa; pay_url dışında fiyatları tutarlı olsun)
update public.products set price = 4309,  title = 'Gözlemci — Yıllık Üyelik'    where slug = 'uyelik-gozlemci-yil';
update public.products set price = 9709,  title = 'Ajan — Yıllık Üyelik'        where slug = 'uyelik-ajan-yil';
update public.products set price = 18349, title = 'Başmüfettiş — Yıllık Üyelik' where slug = 'uyelik-basmufettis-yil';
