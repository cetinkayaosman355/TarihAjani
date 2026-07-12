// Tarih Ajanı — evrensel üyelik göstergesi
// Girişli kullanıcıda "GİRİŞ YAP / ÜYE OL" butonunu "👤 Ad" yapar (tek yerde, küçük).
// Menüdeki düz "ÜYELİK" linkine dokunmaz. Çıkışta eski haline döner.
// Tasarım aracı export'larından bağımsız çalışır (DOM'a sonradan dokunur).
(function () {
  var SB_URL = 'https://ddyuopqcvpzaysnfavqc.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXVvcHFjdnB6YXlzbmZhdnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzAxMjAsImV4cCI6MjA5ODkwNjEyMH0.0nTnXFFrPNlxWC_MIeRwqBCqgdYX_tG7WVUbsj0B6Cc';
  var currentName = null;
  var sbClient = null;   // çıkış menüsü için

  function firstName(u) {
    var n = (u.user_metadata && u.user_metadata.full_name) || (u.email || '').split('@')[0] || 'Ajan';
    return n.trim().split(' ')[0];   // yalnız ilk ad (kısa)
  }

  function links() {
    return Array.prototype.slice.call(document.querySelectorAll('a[href="/uyelik"], a[href^="/uyelik?"]'));
  }
  // Bir linkin "giriş butonu" olma olasılığını puanla.
  // ÜYELİK menü linki ve uzun açıklama satırları 0 alır → asla seçilmez.
  function ctaScore(a) {
    // Türkçe locale ile küçült: "AJAN GİRİŞİ".toLowerCase() noktalı i üretip
    // deseni bozuyordu; toLocaleLowerCase('tr') doğru "ajan girişi" verir.
    var t = (a.textContent || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr');
    if (!t) return 0;
    if (/ajan giri[sş]/.test(t)) return 5;             // "AJAN GİRİŞİ"
    if (/^giri[sş]( yap)?$/.test(t)) return 5;          // "GİRİŞ" / "GİRİŞ YAP"
    if (/^([üu]ye ol)/.test(t) && t.length <= 14) return 5;
    if (/^hesab/.test(t)) return 4;
    if (/giri[sş]|[üu]ye ol/.test(t) && t.length <= 18) return 2; // kısa buton
    return 0;                                            // ÜYELİK, uzun metinler
  }
  function headerLinks() {
    var h = document.querySelector('header');
    if (!h) return [];
    return Array.prototype.slice.call(h.querySelectorAll('a[href="/uyelik"], a[href^="/uyelik?"]'));
  }
  // Yalnız HEADER'daki giriş butonu (gövdedeki hero CTA'lara dokunma)
  function pickTarget() {
    var best = null, bestScore = 0;
    headerLinks().forEach(function (a) { var s = ctaScore(a); if (s > bestScore) { bestScore = s; best = a; } });
    return best;   // header'da login CTA yoksa null (ÜYELİK'e dokunulmaz)
  }


  /* ── hesap menüsü: Üyelik Panelim · Çıkış Yap ── */
  var menuEl = null;
  function closeMenu() { if (menuEl && menuEl.parentElement) menuEl.parentElement.removeChild(menuEl); menuEl = null; }
  function doLogout() {
    closeMenu();
    try {
      localStorage.removeItem('ta_account_v1');
      localStorage.removeItem('ta_uye');
      var st = JSON.parse(localStorage.getItem('ta_studio_v5') || '{}');
      delete st.agent; delete st.email;
      localStorage.setItem('ta_studio_v5', JSON.stringify(st));
    } catch (e) {}
    if (sbClient) {
      sbClient.auth.signOut().then(function () { currentName = null; apply(); });
    } else { currentName = null; apply(); }
  }
  function toggleMenu(btn) {
    if (menuEl) { closeMenu(); return; }
    var r = btn.getBoundingClientRect();
    menuEl = document.createElement('div');
    menuEl.setAttribute('data-uye-menu-panel', '1');
    menuEl.style.cssText = 'position:fixed;z-index:999;top:' + (r.bottom + 8) + 'px;left:' + Math.max(8, r.right - 190) + 'px;' +
      'min-width:182px;background:rgba(5,7,13,.98);border:1px solid rgba(193,154,82,.5);box-shadow:0 18px 50px rgba(0,0,0,.6);' +
      'font-family:\'Special Elite\',monospace;letter-spacing:.1em;font-size:11px;';
    function item(label, cb) {
      var a = document.createElement('a');
      a.href = '#'; a.textContent = label;
      a.style.cssText = 'display:block;padding:12px 16px;color:#cfc8b4;text-decoration:none;border-bottom:1px solid rgba(129,135,151,.15);';
      a.onmouseenter = function () { a.style.color = '#e6c478'; a.style.background = 'rgba(193,154,82,.08)'; };
      a.onmouseleave = function () { a.style.color = '#cfc8b4'; a.style.background = 'transparent'; };
      a.addEventListener('click', function (e) { e.preventDefault(); cb(); });
      menuEl.appendChild(a); return a;
    }
    item('👤 ÜYELİK PANELİM', function () { closeMenu(); window.location.href = '/uyelik'; });
    var out = item('⎋ ÇIKIŞ YAP', doLogout);
    out.style.borderBottom = '0'; out.style.color = '#e08a80';
    out.onmouseenter = function () { out.style.background = 'rgba(224,138,128,.1)'; };
    out.onmouseleave = function () { out.style.background = 'transparent'; };
    document.body.appendChild(menuEl);
    setTimeout(function () {
      document.addEventListener('click', function once(e) {
        if (menuEl && !menuEl.contains(e.target)) closeMenu();
        document.removeEventListener('click', once);
      });
    }, 0);
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  function apply() {
    if (currentName) {
      // Eski sürümlerin eklemiş olabileceği ayrı "isim" linklerini temizle (çift yazmasın)
      Array.prototype.slice.call(document.querySelectorAll('a[data-uye-nav]')).forEach(function (a) {
        if (a.getAttribute('data-uye-orig') == null && a.parentElement) a.parentElement.removeChild(a);
      });
      // Header'daki "AJAN GİRİŞİ" butonunu doğrudan ada dönüştür (yalnız ad, ikon/etiket yok)
      var t = pickTarget();
      if (t && t.getAttribute('data-uye-nav') !== currentName) {
        if (t.getAttribute('data-uye-orig') == null) t.setAttribute('data-uye-orig', t.innerHTML);
        t.textContent = currentName + ' ▾';   // "AJAN GİRİŞİ" → "Osman ▾" (menü açar)
        t.setAttribute('data-uye-nav', currentName);
        t.title = 'Hesap menüsü';
        if (!t.getAttribute('data-uye-menu')) {
          t.setAttribute('data-uye-menu', '1');
          t.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); toggleMenu(t); });
        }
      }
      // Header'da giriş butonu yoksa HİÇBİR ŞEY ekleme (ÜYELİK'e dokunma, ayrı ad yazma)
    } else {
      // çıkış: dönüştürdüğümüz butonu eski haline getir ("AJAN GİRİŞİ")
      Array.prototype.slice.call(document.querySelectorAll('a[data-uye-nav]')).forEach(function (a) {
        var orig = a.getAttribute('data-uye-orig');
        if (orig != null) {
          a.innerHTML = orig;
          a.removeAttribute('data-uye-orig');
          a.removeAttribute('data-uye-fs');
          a.removeAttribute('data-uye-nav');
        } else if (a.parentElement) {
          a.parentElement.removeChild(a);   // eski sürümlerin eklediği ayrı link
        }
      });
    }
  }

  function start() {
    var sb = window.supabase.createClient(SB_URL, SB_KEY);
    sbClient = sb;
    sb.auth.getSession().then(function (r) {
      var u = r && r.data && r.data.session && r.data.session.user;
      currentName = u ? firstName(u) : null;
      apply();
    });
    sb.auth.onAuthStateChange(function (_e, session) {
      var u = session && session.user;
      currentName = u ? firstName(u) : null;
      apply();
    });
    // dc framework hidrasyonu DOM'u geç kurabilir → birkaç kez yeniden uygula
    [800, 2000, 4000].forEach(function (ms) { setTimeout(apply, ms); });
  }

  function ensureLib(cb, tries) {
    if (window.supabase && window.supabase.createClient) return cb();
    if ((tries || 0) === 0 && !document.querySelector('script[src*="supabase-js"]')) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      document.head.appendChild(s);
    }
    if ((tries || 0) < 50) setTimeout(function () { ensureLib(cb, (tries || 0) + 1); }, 150);
  }

  function init() { ensureLib(start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
