// Tarih Ajanı — paylaşımlı fiyat önbelleği
// ========================================
// SORUN: Fiyatlar admin panelinden (products tablosu) düzenleniyor. Bazı sayfalar
// bunu sunucudan okuyor (Satış/Ürünler/Ana Sayfa) ama önce koda gömülü eski
// değeri gösterip sonra "zıplıyordu" (flicker). Studio kredi modalı, E-kitap ve
// Üyelik ise hiç okumadığı için fiyatı ESKİDE kalıyordu.
//
// ÇÖZÜM: Tek localStorage anahtarı = tüm sitenin fiyat kaynağı önbelleği.
//   - read():   anında (senkron) son bilinen doğru fiyatları döndürür → ilk
//               boyamada gömülü eski değer yerine doğru fiyat çıkar (flicker yok).
//   - refresh(cb): products tablosundan taze fiyatı çeker, önbelleğe yazar,
//               cb(map) ile sayfaya bildirir. Her fiyat gösteren sayfa çağırır.
// map biçimi: { slug: { title, price, payUrl } }
(function () {
  var KEY = 'ta_fiyatlar_v1';
  var SB = 'https://ddyuopqcvpzaysnfavqc.supabase.co';
  var AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXVvcHFjdnB6YXlzbmZhdnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzAxMjAsImV4cCI6MjA5ODkwNjEyMH0.0nTnXFFrPNlxWC_MIeRwqBCqgdYX_tG7WVUbsj0B6Cc';

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function write(m) {
    try { localStorage.setItem(KEY, JSON.stringify(m || {})); } catch (e) {}
  }
  function refresh(cb) {
    fetch(SB + '/rest/v1/products?select=slug,title,price,pay_url', {
      headers: { apikey: AK, Authorization: 'Bearer ' + AK }
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) {
        if (!rows || !rows.length) return;
        var m = {};
        rows.forEach(function (p) {
          m[p.slug] = { title: p.title, price: String(p.price), payUrl: (p.pay_url || '').trim() };
        });
        write(m);
        if (cb) cb(m);
      })
      .catch(function () { /* ağ hatası: önbellek/gömülü değer geçerli kalır */ });
  }

  window.TAFiyat = { read: read, write: write, refresh: refresh };
})();
