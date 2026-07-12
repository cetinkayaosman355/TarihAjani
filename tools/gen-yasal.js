#!/usr/bin/env node
// Yasal sayfalar üretici: /gizlilik, /mesafeli-satis, /iade
// Site temasında statik sayfalar; sitemap'e URL ekler.
// Çalıştır: node tools/gen-yasal.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://tarihajani.com';
const GUNCELLEME = '12 Temmuz 2026';

function shell(title, desc, canonPath, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png?v=3">
<link rel="icon" type="image/png" sizes="64x64" href="/assets/favicon-64.png?v=3">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=3">
<title>${title} · Tarih Ajanı</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${SITE}${canonPath}">
<meta name="robots" content="noindex, follow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900&family=Hanken+Grotesk:wght@300..800&family=Special+Elite&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #03050b; -webkit-text-size-adjust: 100%; }
  body { font-family: 'Hanken Grotesk', system-ui, sans-serif; color: #cfd3de; line-height: 1.75; font-size: 15px; }
  a { color: #e6c478; }
  .mono { font-family: 'Special Elite', monospace; letter-spacing: .14em; }
  .wrap { width: min(820px, 100%); margin: 0 auto; padding: clamp(28px, 5vw, 56px) clamp(18px, 4vw, 40px) 40px; }
  header.site { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px clamp(18px, 4vw, 48px); background: rgba(3,5,11,.92); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(193,154,82,.18); }
  header.site nav { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
  header.site nav a { color: #d6d0c2; font-weight: 600; font-size: 12px; letter-spacing: .08em; text-decoration: none; padding: 9px 12px; }
  h1 { font-family: 'Playfair Display', serif; font-weight: 800; font-size: clamp(26px, 4.6vw, 38px); color: #f2ecd9; line-height: 1.15; margin: 8px 0 6px; }
  h2 { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 19px; color: #e9dfc8; margin: 34px 0 10px; }
  .kicker { color: #c19a52; font-size: 10.5px; }
  .tarih { color: #676d7c; font-size: 12.5px; margin: 0 0 26px; }
  ul { padding-left: 20px; }
  li { margin: 6px 0; }
  .kutu { border: 1px solid rgba(193,154,82,.3); background: #070a12; padding: 16px 20px; margin: 18px 0; font-size: 14px; }
  footer.site { margin-top: 44px; padding: 24px clamp(18px, 4vw, 40px); border-top: 1px solid rgba(193,154,82,.15); text-align: center; color: #676d7c; font-size: 12px; }
  footer.site a { color: #8f8a7d; }
</style>
</head>
<body>
<header class="site">
  <a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
    <img src="/assets/logo.webp" alt="Tarih Ajanı" style="height:30px;width:auto;">
  </a>
  <nav>
    <a href="/">ANA SAYFA</a>
    <a href="/urunler">ÜRÜNLER</a>
    <a href="/uyelik">ÜYELİK</a>
  </nav>
</header>
<main class="wrap">
${bodyHtml}
</main>
<footer class="site">
  <a href="/gizlilik/">Gizlilik</a> · <a href="/kvkk/">KVKK</a> · <a href="/mesafeli-satis/">Mesafeli Satış</a> · <a href="/on-bilgilendirme/">Ön Bilgilendirme</a> · <a href="/iade/">İade &amp; Cayma</a> · <a href="/kullanim-kosullari/">Kullanım Koşulları</a> · <a href="/cerez/">Çerez</a> · <a href="/iletisim/">İletişim</a><br>
  © 2026 Tarih Ajanı · <a href="/">tarihajani.com</a>
</footer>
<script src="/uye-nav.js" defer></script>
<script src="/canli-sohbet.js" defer></script>
<script src="/mobil-nav.js" defer></script>
<script src="/ara.js" defer></script>
<script src="/tema.js" defer></script>
<script src="/alt-bilgi.js" defer></script>
<script src="/analytics.js" defer></script>
</body>
</html>
`;
}

/* ── GİZLİLİK + KVKK + ÇEREZ ── */
const gizlilik = `
<div class="mono kicker">YASAL · GİZLİLİK</div>
<h1>Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
<p class="tarih">Son güncelleme: ${GUNCELLEME}</p>

<p>Bu metin, tarihajani.com ("Site") işletmecisi ("Veri Sorumlusu") tarafından, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, Site ziyaretçilerinin ve üyelerinin kişisel verilerinin işlenmesine ilişkin olarak hazırlanmıştır.</p>

<h2>1. İşlenen Kişisel Veriler</h2>
<ul>
  <li><strong>Kimlik ve iletişim:</strong> ad-soyad, e-posta adresi, telefon numarası (sipariş formunda verilmişse)</li>
  <li><strong>Üyelik verileri:</strong> hesap e-postası, üyelik seviyesi, kredi bakiyesi, kullanım kayıtları</li>
  <li><strong>Sipariş verileri:</strong> satın alınan ürün, tutar, ödeme yöntemi tercihi (kart bilgileri Sitede saklanmaz; ödeme, ödeme kuruluşunun güvenli sayfasında gerçekleşir)</li>
  <li><strong>İletişim içerikleri:</strong> canlı sohbet mesajları, iletişim formu ve bülten kayıtları</li>
  <li><strong>Teknik veriler:</strong> çerezler ve benzeri teknolojilerle toplanan kullanım/istatistik verileri</li>
</ul>

<h2>2. İşleme Amaçları</h2>
<ul>
  <li>Üyelik hesabının oluşturulması ve yürütülmesi</li>
  <li>Sipariş ve ödemelerin alınması, erişimlerin tanımlanması, fatura/kayıt yükümlülükleri</li>
  <li>Destek taleplerinin yanıtlanması (canlı sohbet dâhil)</li>
  <li>Üyelik bitişi, sipariş durumu gibi hizmet bildirimlerinin e-posta ile iletilmesi</li>
  <li>Sitenin geliştirilmesi için anonim istatistik analizi</li>
</ul>

<h2>3. Aktarım ve Altyapı Sağlayıcıları</h2>
<p>Veriler; barındırma ve teknik altyapı hizmeti alınan yurt içi/yurt dışı sağlayıcıların sunucularında, amaçla sınırlı olarak işlenebilir:</p>
<ul>
  <li><strong>Netlify</strong> (site barındırma), <strong>Supabase</strong> (veritabanı ve üyelik altyapısı)</li>
  <li><strong>Ödeme kuruluşu</strong> (ör. Shopier) — ödeme işlemi kendi güvenli ortamında gerçekleşir</li>
  <li><strong>Google Analytics</strong> (anonim kullanım istatistiği)</li>
  <li><strong>Yapay zekâ hizmet sağlayıcıları</strong> (Studio üretimleri ve sohbet asistanı yanıtları için gönderilen içerikler)</li>
</ul>

<h2>4. Çerezler</h2>
<p>Site; oturum yönetimi ve tercihlerin hatırlanması için zorunlu çerezler/yerel depolama ile Google Analytics ölçüm çerezleri kullanır. Tarayıcı ayarlarından çerezleri sınırlayabilir veya silebilirsiniz; zorunlu çerezlerin engellenmesi hâlinde üyelik özellikleri çalışmayabilir.</p>

<h2>5. Saklama Süresi</h2>
<p>Veriler; üyelik süresince ve ilgili mevzuattaki zamanaşımı/saklama süreleri boyunca saklanır, sonrasında silinir veya anonim hâle getirilir.</p>

<h2>6. KVKK Kapsamındaki Haklarınız</h2>
<p>KVKK m.11 uyarınca; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme ve silme isteme, aktarıldığı üçüncü kişileri bilme, zarara uğramanız hâlinde giderilmesini talep etme haklarına sahipsiniz. Başvurularınızı <a href="mailto:iletisim@tarihajani.com">iletisim@tarihajani.com</a> adresine iletebilirsiniz; talebiniz en geç 30 gün içinde yanıtlanır.</p>

<div class="kutu">Hesabını silmek istersen <a href="mailto:iletisim@tarihajani.com">iletisim@tarihajani.com</a> adresine üyelik e-postandan yazman yeterlidir.</div>
`;

/* ── MESAFELİ SATIŞ + ÖN BİLGİLENDİRME ── */
const mesafeli = `
<div class="mono kicker">YASAL · SATIŞ KOŞULLARI</div>
<h1>Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi</h1>
<p class="tarih">Son güncelleme: ${GUNCELLEME}</p>

<h2>1. Taraflar</h2>
<p><strong>SATICI:</strong> tarihajani.com işletmecisi ("Satıcı") · E-posta: <a href="mailto:iletisim@tarihajani.com">iletisim@tarihajani.com</a><br>
<strong>ALICI:</strong> Sitede sipariş formunu dolduran ve/veya üyelik satın alan gerçek kişi ("Alıcı"). Sipariş formundaki ad-soyad ve iletişim bilgileri esas alınır.</p>

<h2>2. Konu</h2>
<p>İşbu sözleşme; Alıcı'nın Sitede elektronik ortamda sipariş verdiği ürün ve hizmetlerin (dijital dosyalar, e-kitaplar, eğitim programları, üyelik paketleri, Studio kredi paketleri ve varsa fiziki ürünler) satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.</p>

<h2>3. Ürün/Hizmet ve Ödeme</h2>
<ul>
  <li>Ürünün temel nitelikleri, birim fiyatı (KDV dâhil, TL) ve toplam bedeli ilgili ürün/satış sayfasında yer alır.</li>
  <li>Ödeme; <strong>kredi kartı</strong> (ödeme kuruluşunun güvenli sayfası üzerinden) veya <strong>havale/EFT</strong> ile yapılır. Kart bilgileri Satıcı tarafından görülmez ve saklanmaz.</li>
  <li>Havale/EFT'de sipariş, bedelin Satıcı hesabına geçmesiyle işleme alınır.</li>
</ul>

<h2>4. Teslimat</h2>
<ul>
  <li><strong>Dijital ürün ve üyelikler:</strong> ödemenin onaylanmasının ardından erişim, Alıcı'nın üyelik hesabına tanımlanır ve/veya e-posta ile iletilir (genellikle aynı gün; en geç 3 iş günü).</li>
  <li><strong>Fiziki ürünler (varsa):</strong> anlaşmalı kargo ile en geç 30 gün içinde gönderilir; kargo bilgisi e-posta ile paylaşılır.</li>
</ul>

<h2>5. Cayma Hakkı</h2>
<p>Alıcı, fiziki ürünlerde teslimden itibaren <strong>14 gün</strong> içinde gerekçe göstermeksizin cayma hakkına sahiptir.</p>
<div class="kutu"><strong>Dijital içerik istisnası:</strong> Mesafeli Sözleşmeler Yönetmeliği m.15/1-ğ uyarınca, <strong>elektronik ortamda anında ifa edilen hizmetler ve tüketiciye anında teslim edilen gayrimaddi mallarda</strong> (e-kitap, dijital dosya, üyelik erişimi, kredi paketi vb.) cayma hakkı kullanılamaz. Alıcı, dijital ürünün erişime açılmasıyla ifanın başladığını ve cayma hakkının bulunmadığını kabul eder. Detay: <a href="/iade/">İade &amp; Cayma sayfası</a>.</div>

<h2>6. Genel Hükümler</h2>
<ul>
  <li>Alıcı, sipariş öncesinde ürünün temel nitelikleri, satış fiyatı, ödeme ve teslimat bilgilerini okuyup bilgilendiğini teyit eder.</li>
  <li>Dijital içerikler telif hakkıyla korunur; kişisel kullanım dışında çoğaltılamaz, paylaşılamaz, yeniden satılamaz.</li>
  <li>Üyelik paketleri satın alınan dönem boyunca geçerlidir; dönem sonunda yenilenmezse hesap ücretsiz seviyeye döner.</li>
</ul>

<h2>7. Uyuşmazlık</h2>
<p>Uyuşmazlıklarda, Ticaret Bakanlığı'nca ilan edilen parasal sınırlar dâhilinde Alıcı'nın yerleşim yerindeki Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p>

<p>Sipariş formundaki "Siparişi Gönder" butonuna basılması, işbu Ön Bilgilendirme Formu'nun okunduğu ve Mesafeli Satış Sözleşmesi'nin kabul edildiği anlamına gelir.</p>
`;

/* ── İADE & CAYMA ── */
const iade = `
<div class="mono kicker">YASAL · İADE POLİTİKASI</div>
<h1>İade ve Cayma Koşulları</h1>
<p class="tarih">Son güncelleme: ${GUNCELLEME}</p>

<h2>Dijital ürünler (e-kitap, dijital dosya, üyelik, kredi paketi)</h2>
<p>Dijital içerikler, ödemenin onaylanmasıyla birlikte <strong>anında erişime açılır</strong>. Mesafeli Sözleşmeler Yönetmeliği m.15/1-ğ uyarınca elektronik ortamda anında ifa edilen hizmetlerde ve anında teslim edilen gayrimaddi mallarda <strong>cayma hakkı bulunmaz</strong>; bu nedenle erişime açılmış dijital ürünlerde iade yapılamaz.</p>
<div class="kutu">Erişim tanımlanmadan önce iptal etmek istersen (ör. havale bekleyen sipariş) <a href="mailto:iletisim@tarihajani.com">iletisim@tarihajani.com</a> adresine yazman yeterli — bedel tahsil edildiyse tamamı iade edilir.</div>

<h2>Üyelik paketleri</h2>
<ul>
  <li>Üyelik, satın alınan dönemin (aylık/yıllık) sonuna kadar geçerlidir.</li>
  <li>İptal talebinde üyelik dönem sonunda yenilenmez; dönem içinde kullanılan süre için kısmi iade yapılmaz.</li>
  <li>Teknik bir sorun nedeniyle hizmete hiç erişilememişse durum incelenir ve haklı taleplerde bedel iadesi yapılır.</li>
</ul>

<h2>Fiziki ürünler (varsa)</h2>
<ul>
  <li>Teslimden itibaren <strong>14 gün</strong> içinde gerekçesiz cayma hakkın vardır.</li>
  <li>Cayma bildirimini e-posta ile ilet; ürünü faturasıyla birlikte, kullanılmamış ve yeniden satılabilir durumda iade et.</li>
  <li>Bedel, ürünün Satıcı'ya ulaşmasından itibaren 14 gün içinde ödeme yöntemine iade edilir.</li>
</ul>

<h2>Yanlış / kusurlu teslimat</h2>
<p>Yanlış ürün erişimi, açılmayan dosya veya eksik teslim gibi durumlarda <a href="mailto:iletisim@tarihajani.com">iletisim@tarihajani.com</a> adresine yaz; sorun giderilir, giderilemiyorsa bedel iade edilir.</p>

<h2>Başvuru</h2>
<p>Tüm iade ve cayma talepleri için: <a href="mailto:iletisim@tarihajani.com">iletisim@tarihajani.com</a> — sipariş e-postanı ve ürün adını eklemeyi unutma. Talepler en geç 14 gün içinde sonuçlandırılır.</p>
`;

/* ── KVKK (ayrı URL) ── */
const kvkk = `
<div class="mono kicker">YASAL · KİŞİSEL VERİLER</div>
<h1>KVKK Aydınlatma Metni</h1>
<p class="tarih">Son güncelleme: ${GUNCELLEME}</p>
<p>tarihajani.com işletmecisi ("Veri Sorumlusu"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında kişisel verilerinizi aşağıda açıklandığı şekilde işler.</p>
<h2>İşlenen veriler</h2>
<ul>
  <li>Kimlik ve iletişim: ad-soyad, e-posta, telefon (sipariş formunda verilmişse)</li>
  <li>Üyelik ve sipariş verileri: hesap e-postası, seviye, kredi bakiyesi, satın alınan ürün ve tutar</li>
  <li>İletişim içerikleri (canlı sohbet, iletişim formu) ve teknik/çerez verileri</li>
</ul>
<h2>Amaç ve hukuki sebep</h2>
<p>Veriler; üyeliğin yürütülmesi, siparişin oluşturulması ve teslimi, destek taleplerinin yanıtlanması ve yasal yükümlülüklerin yerine getirilmesi amacıyla, KVKK m.5/2 (sözleşmenin kurulması/ifası, hukuki yükümlülük, meşru menfaat) kapsamında işlenir.</p>
<h2>Aktarım</h2>
<p>Kart bilgileri Sitede saklanmaz; ödeme, ödeme kuruluşunun (ör. Shopier) güvenli ortamında gerçekleşir. Barındırma/altyapı için Netlify ve Supabase, ölçüm için Google Analytics, Studio üretimleri için yapay zekâ sağlayıcıları amaçla sınırlı olarak kullanılır. Veriler pazarlama amacıyla üçüncü kişilerle paylaşılmaz.</p>
<h2>Haklarınız (m.11)</h2>
<p>Verilerinizin işlenip işlenmediğini öğrenme, bilgi/düzeltme/silme talep etme haklarınızı <a href="mailto:iletisim@tarihajani.com">iletisim@tarihajani.com</a> adresine başvurarak kullanabilirsiniz; talep en geç 30 gün içinde yanıtlanır. Ayrıntılı gizlilik metni: <a href="/gizlilik/">Gizlilik Politikası</a>.</p>
<div class="kutu">Hesabını ve verilerini silmek için üyelik e-postandan <a href="mailto:iletisim@tarihajani.com">iletisim@tarihajani.com</a> adresine yazman yeterli.</div>
`;

/* ── ÖN BİLGİLENDİRME FORMU (ayrı URL) ── */
const onbilgi = `
<div class="mono kicker">YASAL · ÖN BİLGİLENDİRME</div>
<h1>Ön Bilgilendirme Formu</h1>
<p class="tarih">Son güncelleme: ${GUNCELLEME}</p>
<h2>Satıcı</h2>
<p>tarihajani.com işletmecisi · E-posta: <a href="mailto:iletisim@tarihajani.com">iletisim@tarihajani.com</a> · Kurumsal bilgiler için <a href="/iletisim/">İletişim</a> sayfasına bakınız.</p>
<h2>Ürün / hizmet ve bedel</h2>
<ul>
  <li>Sipariş sırasında seçtiğiniz dijital içerik (e-kitap, eğitim, hazır içerik, Studio kredisi), üyelik ya da fiziki ürün.</li>
  <li>Ürünün adı, adedi ve KDV dâhil satış fiyatı; sipariş özetinde ve onay e-postasında yer alır. Ek ücret yansıtılmaz.</li>
</ul>
<h2>Ödeme ve teslimat</h2>
<ul>
  <li>Ödeme: kredi kartı (Shopier güvenli ödeme) veya havale/EFT. Kart bilgisi Sitede toplanmaz.</li>
  <li>Dijital içerik/üyelik: ödeme onayının ardından erişim hesaba tanımlanır ve/veya e-posta ile iletilir. Fiziki ürün: kargoyla gönderilir.</li>
</ul>
<h2>Cayma hakkı</h2>
<div class="kutu">Mesafeli Sözleşmeler Yönetmeliği m.15/1-ğ uyarınca, elektronik ortamda anında ifa edilen ve anında teslim edilen gayrimaddi mallarda (dijital içerik, üyelik, kredi paketi) cayma hakkı bulunmamaktadır. Fiziki ürünlerde 14 gün cayma hakkı geçerlidir. Ayrıntı: <a href="/iade/">İade &amp; Cayma</a>.</div>
<p>Tam sözleşme metni: <a href="/mesafeli-satis/">Mesafeli Satış Sözleşmesi</a>. Sipariş formundaki onay kutusunun işaretlenmesi, bu formun okunduğu anlamına gelir.</p>
`;

/* ── KULLANIM KOŞULLARI (ayrı URL) ── */
const kullanim = `
<div class="mono kicker">YASAL · KULLANIM</div>
<h1>Kullanım Koşulları</h1>
<p class="tarih">Son güncelleme: ${GUNCELLEME}</p>
<p>Bu siteyi kullanarak aşağıdaki koşulları kabul etmiş sayılırsın. Tarih Ajanı, koşulları güncelleme hakkını saklı tutar; güncel sürüm bu sayfada yayımlanır.</p>
<h2>İçerik ve lisans</h2>
<p>Satın alınan dijital içerikler, e-kitaplar ve eğitimler <strong>yalnızca kişisel kullanım</strong> içindir; izinsiz çoğaltılamaz, dağıtılamaz, yeniden satılamaz veya kamuya açık şekilde paylaşılamaz. Ticari kullanım ayrı yazılı izne tabidir.</p>
<h2>Studio ile üretilen içerik</h2>
<p>Studio, ürettiğin metin ve görselleri kendi projelerinde kullanman için sunulur. Yapay zekâ ile üretilen çıktılar bilgilendirme ve üretim amaçlıdır; tarihî doğruluk ve nihai kullanım sorumluluğu kullanıcıya aittir. Üretilen içeriğin üçüncü kişilerin haklarını ihlal etmeyecek şekilde kullanılması kullanıcının sorumluluğundadır.</p>
<h2>Hesap</h2>
<p>Hesabının güvenliğinden ve giriş bilgilerinin gizliliğinden kullanıcı sorumludur. Hesabın paylaşılması erişimin askıya alınmasına yol açabilir.</p>
<h2>Fikri mülkiyet</h2>
<p>Sitedeki tüm metin, görsel, video, arşiv dosyaları ve marka unsurları Tarih Ajanı'na aittir; izinsiz kullanılamaz.</p>
<h2>Sorumluluk</h2>
<p>Hizmet "olduğu gibi" sunulur. Hizmet kesintileri veya teknik sorunlarda sorumluluk ilgili mevzuat çerçevesinde sınırlıdır. Sorular için: <a href="mailto:iletisim@tarihajani.com">iletisim@tarihajani.com</a></p>
`;

/* ── ÇEREZ POLİTİKASI (ayrı URL) ── */
const cerez = `
<div class="mono kicker">YASAL · ÇEREZLER</div>
<h1>Çerez Politikası</h1>
<p class="tarih">Son güncelleme: ${GUNCELLEME}</p>
<p>Çerezler, siteyi ziyaret ettiğinde tarayıcına kaydedilen küçük dosyalardır. Tarih Ajanı, siteyi çalıştırmak ve deneyimi iyileştirmek için aşağıdaki çerezleri/yerel depolamayı kullanır.</p>
<h2>Kullanılan türler</h2>
<ul>
  <li><strong>Zorunlu:</strong> oturum yönetimi, tema tercihi, tek seferlik bildirimler ve üyelik durumu (yerel depolama). Bunlar olmadan site düzgün çalışmaz.</li>
  <li><strong>Analitik:</strong> Google Analytics ile anonim kullanım istatistiği (hangi sayfaların ziyaret edildiği gibi). Kişisel kimlik amacı taşımaz.</li>
</ul>
<h2>Yönetim</h2>
<p>Çerezleri tarayıcı ayarlarından sınırlayabilir veya silebilirsin. Zorunlu çerezleri engellersen üyelik ve Studio özellikleri çalışmayabilir. Ayrıntı: <a href="/gizlilik/">Gizlilik Politikası</a>.</p>
`;

/* ── İLETİŞİM (ayrı URL + kurumsal bilgi) ── */
const iletisim = `
<div class="mono kicker">İLETİŞİM</div>
<h1>Bize Ulaş</h1>
<p class="tarih">Aynı gün dönüş yapılır</p>
<p>Sipariş, destek, iş birliği ve her türlü soru için bize ulaşabilirsin.</p>
<h2>İletişim kanalları</h2>
<ul>
  <li><strong>E-posta:</strong> <a href="mailto:iletisim@tarihajani.com">iletisim@tarihajani.com</a> · Destek: <a href="mailto:destek@tarihajani.com">destek@tarihajani.com</a></li>
  <li><strong>Canlı sohbet:</strong> Sitenin sağ altındaki "Ajanla Konuş" butonu</li>
  <li><strong>Instagram:</strong> <a href="https://instagram.com/tarih.ajani" target="_blank" rel="noopener">@tarih.ajani</a> · <strong>YouTube:</strong> <a href="https://youtube.com/@TarihAjani" target="_blank" rel="noopener">Tarih Ajanı</a></li>
  <li><strong>Web:</strong> tarihajani.com</li>
</ul>
<h2>Kurumsal bilgiler</h2>
<div class="kutu">
  <p style="margin:0 0 6px;">Ticari unvan: <strong>—</strong><br>
  Adres: <strong>—</strong><br>
  Telefon / WhatsApp: <strong>—</strong><br>
  Vergi dairesi / no (veya T.C. no): <strong>—</strong><br>
  Çalışma saatleri: <strong>Hafta içi 09.00–18.00</strong></p>
  <p style="margin:8px 0 0;color:#818797;font-size:12.5px;">Not: Kurumsal bilgiler yasal gereklilik doğrultusunda güncellenecektir.</p>
</div>
<p>Ödemeler ödeme kuruluşu (Shopier) güvenli altyapısında alınır. Dijital ürünler ödeme onayının ardından erişime açılır; destek süresi üyelik/erişim boyunca devam eder.</p>
`;

/* ── yaz ── */
const pages = [
  ['gizlilik', 'Gizlilik Politikası ve KVKK Aydınlatma Metni', 'tarihajani.com gizlilik politikası, KVKK aydınlatma metni ve çerez bilgilendirmesi.', gizlilik],
  ['mesafeli-satis', 'Ön Bilgilendirme ve Mesafeli Satış Sözleşmesi', 'tarihajani.com mesafeli satış sözleşmesi ve ön bilgilendirme formu.', mesafeli],
  ['iade', 'İade ve Cayma Koşulları', 'tarihajani.com iade politikası: dijital ürünlerde cayma istisnası, üyelik iptali ve fiziki ürün iadesi.', iade],
  ['kvkk', 'KVKK Aydınlatma Metni', 'tarihajani.com KVKK aydınlatma metni: işlenen kişisel veriler, amaçlar, aktarım ve haklarınız.', kvkk],
  ['on-bilgilendirme', 'Ön Bilgilendirme Formu', 'tarihajani.com ön bilgilendirme formu: satıcı, ürün, bedel, ödeme, teslimat ve cayma hakkı.', onbilgi],
  ['kullanim-kosullari', 'Kullanım Koşulları', 'tarihajani.com kullanım koşulları: içerik lisansı, ticari kullanım, hesap ve fikri mülkiyet.', kullanim],
  ['cerez', 'Çerez Politikası', 'tarihajani.com çerez politikası: zorunlu ve analitik çerezler ve yönetimi.', cerez],
  ['iletisim', 'İletişim', 'tarihajani.com iletişim: e-posta, canlı sohbet, sosyal medya ve kurumsal bilgiler.', iletisim],
];
for (const [slug, title, desc, body] of pages) {
  const dir = path.join(ROOT, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), shell(title, desc, '/' + slug + '/', body));
}

/* sitemap */
const smPath = path.join(ROOT, 'sitemap.xml');
let sm = fs.readFileSync(smPath, 'utf8');
const today = new Date().toISOString().slice(0, 10);
let added = 0;
for (const [slug] of pages) {
  const loc = SITE + '/' + slug + '/';
  if (sm.indexOf('<loc>' + loc + '</loc>') === -1) {
    sm = sm.replace('</urlset>', `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.2</priority>\n  </url>\n</urlset>`);
    added++;
  }
}
if (added) fs.writeFileSync(smPath, sm);
console.log('✓ 3 yasal sayfa üretildi; sitemap +' + added);
