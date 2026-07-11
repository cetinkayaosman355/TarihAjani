// Tarih Ajanı — evrensel üyelik göstergesi
// Girişli kullanıcıda menüdeki ÜYELİK linkini "👤 AD" yapar; link yoksa nav'a ekler.
// Tasarım aracı export'larından bağımsız çalışır (DOM'a sonradan dokunur).
(function () {
  var SB_URL = 'https://ddyuopqcvpzaysnfavqc.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXVvcHFjdnB6YXlzbmZhdnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzAxMjAsImV4cCI6MjA5ODkwNjEyMH0.0nTnXFFrPNlxWC_MIeRwqBCqgdYX_tG7WVUbsj0B6Cc';
  var currentName = null;

  function firstName(u) {
    var n = (u.user_metadata && u.user_metadata.full_name) || (u.email || '').split('@')[0] || 'AJAN';
    return n.split(' ')[0].toUpperCase();
  }

  function apply() {
    var links = document.querySelectorAll('a[href="/uyelik"], a[href^="/uyelik?"]');
    if (currentName) {
      if (links.length) {
        links.forEach(function (a) {
          if (a.getAttribute('data-uye-nav') === currentName) return;
          a.textContent = '👤 ' + currentName;
          a.setAttribute('data-uye-nav', currentName);
          a.title = 'Üyelik panelin';
        });
      } else {
        // ÜYELİK linki olmayan sayfada nav'a ekle (varsa header>nav)
        var nav = document.querySelector('header nav');
        if (nav && !nav.querySelector('[data-uye-nav]')) {
          var a = document.createElement('a');
          a.href = '/uyelik';
          a.textContent = '👤 ' + currentName;
          a.setAttribute('data-uye-nav', currentName);
          a.style.cssText = 'color:#e6c478;font-size:12.5px;letter-spacing:.08em;text-decoration:none;padding:9px 13px;';
          nav.insertBefore(a, nav.lastElementChild);
        }
      }
    } else {
      // çıkışta geri al
      document.querySelectorAll('a[data-uye-nav]').forEach(function (a) {
        if (a.parentElement && !a.getAttribute('href')) return;
        a.textContent = 'ÜYELİK';
        a.removeAttribute('data-uye-nav');
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
