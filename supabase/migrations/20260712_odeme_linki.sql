-- Ürün başına ödeme bağlantısı (Shopier vb.)
-- Kart seçen müşteri, sipariş sonrası doğrudan bu bağlantıya yönlendirilir;
-- boşsa eski davranış sürer (bağlantı e-posta ile elle gönderilir).
alter table public.products add column if not exists pay_url text;
