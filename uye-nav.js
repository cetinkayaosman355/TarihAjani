// Tarih Ajanı — evrensel üyelik göstergesi
// Girişli kullanıcıda "GİRİŞ YAP / ÜYE OL" butonunu "👤 Ad" yapar (tek yerde, küçük).
// Menüdeki düz "ÜYELİK" linkine dokunmaz. Çıkışta eski haline döner.
// Tasarım aracı export'larından bağımsız çalışır (DOM'a sonradan dokunur).
(function () {
  var SB_URL = 'https://ddyuopqcvpzaysnfavqc.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXVvcHFjdnB6YXlzbmZhdnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzAxMjAsImV4cCI6MjA5ODkwNjEyMH0.0nTnXFFrPNlxWC_MIeRwqBCqgdYX_tG7WVUbsj0B6Cc';
  var currentName = null;

  function firstName(u) {
    var n = (u.user_metadata && u.user_metadata.full_name) || (u.email || '').split('@')[0] || 'Ajan';
    return n.trim().split(' ')[0];   // yalnız ilk ad (kısa)
  }

  function links() {
    return Array.prototype.slice.call(document.querySelectorAll('a[href="/uyelik"], a[href^="/uyelik?"]'));
  }
  function isLoginCta(a) {
    return /giri[sş]|[üu]ye ol|hesab/i.test(a.textContent || '');
  }

  // Girişli kullanıcıda ismi göstereceğimiz TEK hedefi seç:
  // önce "giriş yap/üye ol" butonu; yoksa tek üyelik linki
  function pickTarget() {
    var ls = links();
    if (!ls.length) return null;
    var cta = ls.filter(isLoginCta);
    return cta.length ? cta[0] : ls[0];
  }

  function apply() {
    if (currentName) {
      var t = pickTarget();
      if (t && t.getAttribute('data-uye-nav') !== currentName) {
        if (t.getAttribute('data-uye-orig') == null) {
          t.setAttribute('data-uye-orig', t.innerHTML);
          t.setAttribute('data-uye-fs', t.style.fontSize || '');
        }
        t.textContent = '👤 ' + currentName;
        t.style.fontSize = '11px';           // daha küçük
        t.setAttribute('data-uye-nav', currentName);
        t.title = 'Üyelik panelin';
      }
      // menüde hiç üyelik linki olmayan sayfaya küçük bir tane ekle
      if (!links().length) {
        var nav = document.querySelector('header nav');
        if (nav && !nav.querySelector('[data-uye-nav]')) {
          var a = document.createElement('a');
          a.href = '/uyelik';
          a.textContent = '👤 ' + currentName;
          a.setAttribute('data-uye-nav', currentName);
          a.style.cssText = 'color:#e6c478;font-size:11px;letter-spacing:.08em;text-decoration:none;padding:9px 13px;';
          nav.insertBefore(a, nav.lastElementChild);
        }
      }
    } else {
      // çıkış: dönüştürdüğümüz her hedefi eski haline getir
      Array.prototype.slice.call(document.querySelectorAll('a[data-uye-nav]')).forEach(function (a) {
        var orig = a.getAttribute('data-uye-orig');
        if (orig != null) {
          a.innerHTML = orig;
          a.style.fontSize = a.getAttribute('data-uye-fs') || '';
          a.removeAttribute('data-uye-orig');
          a.removeAttribute('data-uye-fs');
          a.removeAttribute('data-uye-nav');
        } else if (a.parentElement) {
          a.parentElement.removeChild(a);   // sonradan eklediğimiz link
        }
      });
    }
  }

  function start() {
    var sb = window.supabase.createClient(SB_URL, SB_KEY);
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
