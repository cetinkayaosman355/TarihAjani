// Tarih Ajanı — MOBİL NAVİGASYON (☰ menü) + mobil düzeltme CSS'i
// YALNIZ ≤840px ekranda devreye girer; masaüstü görünümüne hiçbir etkisi yok.
// Header'daki nav mobilde gizlenir, yerine sağ üstte ☰ düğmesi ve tam ekran
// tema-uyumlu menü gelir. Gövdeye eklenir (dc hidrasyonundan etkilenmez).
(function () {
  var BP = 840;   // kırılım (px)
  var FONT = "'Special Elite', 'Courier New', monospace";

  /* ── mobil CSS (media ile sınırlı — masaüstünde etkisiz) ── */
  function ensureCss() {
    if (document.getElementById('ta-mobil-css')) return;
    var st = document.createElement('style');
    st.id = 'ta-mobil-css';
    st.textContent =
      '#ta-burger{display:none}' +
      '@media(max-width:' + BP + 'px){' +
        // iOS Safari'nin metni kendiliğinden büyütmesi taşma yaratabiliyor
        'html{-webkit-text-size-adjust:100%}' +
        // yığılan header menüsü gizlenir (yerine ☰)
        'header nav{display:none !important}' +
        // satır içi sabit min-width değerleri mobilde taşma yapar → sıfırla
        '[style*="min-width"]{min-width:0 !important}' +
        // place-items:center konteynerlerde grid öğesi max-content genişliğine
        // şişip sağdan taşıyordu (Studio) → öğeleri ekrana sığdır
        '[style*="place-items"]>*{max-width:100% !important;min-width:0 !important}' +
        // sabit yükseklikli geniş görseller (ör. Studio logosu) ekrana sığsın
        'img{max-width:100% !important;object-fit:contain}' +
        '#ta-burger{display:grid !important}' +
      '}' +
      // Telefonda (≤600px) çok sütunlu grid'ler dar sütunlara sıkışıp metni
      // kelime kelime kırıyordu (Kanalını Kur kartları, Nasıl çalışır vb.)
      // → tek sütuna in. Tablet (601-840px) düzenini korur; zaman tüneli
      // durakları (repeat(5)) yatay kalır.
      '@media(max-width:600px){' +
        '[style*="auto-fit"],[style*="auto-fill"],' +
        '[style*="repeat(3"],[style*="repeat(4"],' +
        '[style*="columns: 1fr 1fr"]' +
        '{grid-template-columns:1fr !important}' +
      '}';
    document.head.appendChild(st);
  }

  /* ── menü içeriği ── */
  var LINKS = [
    ['ANA SAYFA', '/'],
    ['ÜRÜNLER', '/urunler'],
    ['ÜYELİK', '/uyelik'],
    ['AKADEMİ', '/egitim'],
    ['HİKÂYE ARŞİVİ', '/arsiv'],
    ['HABER', '/haber'],
    ['STUDIO', '/studio'],
    ['OYUN TÜNELİ', '/zaman-tuneli']
  ];

  var panel = null, open = false;

  function here(href) {
    var p = location.pathname.replace(/\/$/, '') || '/';
    var h = href.replace(/\/$/, '') || '/';
    if (h === '/') return p === '/' || /Tarih.?Ajani/i.test(p);
    return p === h || p.toLowerCase().indexOf(h.toLowerCase()) === 0;
  }

  function buildPanel() {
    panel = document.createElement('div');
    panel.id = 'ta-mobilmenu';
    panel.setAttribute('data-uye-scope', '1');   // uye-nav girişli adı burada da dönüştürsün
    panel.style.cssText = 'position:fixed;inset:0;z-index:1200;display:none;flex-direction:column;' +
      'background:rgba(3,5,11,.97);backdrop-filter:blur(10px);overflow-y:auto;font-family:' + FONT + ';';

    var head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid rgba(193,154,82,.25);';
    head.innerHTML = '<span style="font-size:12px;letter-spacing:.24em;color:#c19a52;">TARİH AJANI · DOSYA MENÜSÜ</span>';
    var x = document.createElement('button');
    x.textContent = '✕';
    x.setAttribute('aria-label', 'Menüyü kapat');
    x.style.cssText = 'border:1px solid rgba(129,135,151,.35);background:transparent;color:#cfc8b4;font-size:16px;line-height:1;padding:10px 13px;cursor:pointer;';
    x.onclick = closeMenu;
    head.appendChild(x);
    panel.appendChild(head);

    var list = document.createElement('nav');
    list.style.cssText = 'display:grid;padding:10px 0;';
    LINKS.forEach(function (l) {
      var a = document.createElement('a');
      a.href = l[1];
      a.textContent = l[0];
      var cur = here(l[1]);
      a.style.cssText = 'padding:17px 26px;text-decoration:none;font-size:14px;letter-spacing:.16em;' +
        'border-bottom:1px solid rgba(129,135,151,.12);' +
        (cur ? 'color:#e6c478;background:rgba(193,154,82,.08);border-left:3px solid #c19a52;'
             : 'color:#d6d0c2;border-left:3px solid transparent;');
      list.appendChild(a);
    });
    panel.appendChild(list);

    var foot = document.createElement('div');
    foot.style.cssText = 'display:grid;gap:12px;padding:20px 26px 34px;';
    var ara = document.createElement('a');
    ara.href = '/urunler?q=1';
    ara.textContent = '🔍 ARA';
    ara.style.cssText = 'text-align:center;color:#a4a9b5;border:1px solid rgba(129,135,151,.35);padding:14px;text-decoration:none;font-size:12.5px;letter-spacing:.14em;';
    foot.appendChild(ara);
    var giris = document.createElement('a');
    giris.href = '/uyelik';
    giris.textContent = 'AJAN GİRİŞİ';   // girişliyse uye-nav "Ad ▾" yapar
    giris.style.cssText = 'text-align:center;color:#e6c478;border:1px solid rgba(193,154,82,.55);padding:15px;text-decoration:none;font-size:13px;letter-spacing:.16em;font-weight:700;';
    foot.appendChild(giris);
    panel.appendChild(foot);

    document.body.appendChild(panel);
  }

  function openMenu() {
    if (!panel || !document.body.contains(panel)) { panel = null; buildPanel(); }
    panel.style.display = 'flex';
    open = true;
    document.documentElement.style.overflow = 'hidden';
    var b = document.getElementById('ta-burger');
    if (b) b.textContent = '✕';
  }
  function closeMenu() {
    if (panel) panel.style.display = 'none';
    open = false;
    document.documentElement.style.overflow = '';
    var b = document.getElementById('ta-burger');
    if (b) b.textContent = '☰';
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) closeMenu(); });
  // menüdeki linke dokununca kapat (aynı sayfaya giden linkte de)
  document.addEventListener('click', function (e) {
    if (open && panel && panel.contains(e.target) && e.target.tagName === 'A' &&
        e.target.getAttribute('data-uye-nav') == null) closeMenu();
  });

  function ensureButton() {
    ensureCss();
    if (document.getElementById('ta-burger')) return;
    var b = document.createElement('button');
    b.id = 'ta-burger';
    b.setAttribute('aria-label', 'Menü');
    b.textContent = '☰';
    b.style.cssText = 'position:fixed;top:12px;right:12px;z-index:1100;width:46px;height:46px;place-items:center;' +
      'border:1px solid rgba(193,154,82,.55);background:rgba(5,7,13,.92);color:#e6c478;font-size:19px;line-height:1;' +
      'cursor:pointer;box-shadow:0 8px 26px rgba(0,0,0,.5);font-family:' + FONT + ';';
    b.onclick = function () { open ? closeMenu() : openMenu(); };
    document.body.appendChild(b);
  }

  function init() {
    ensureButton();
    setInterval(ensureButton, 4000);   // hidrasyon sonrası garanti
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
