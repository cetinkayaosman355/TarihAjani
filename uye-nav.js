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

  function apply() {
    if (currentName) {
      var t = pickTarget();
      if (t) {
        if (t.getAttribute('data-uye-nav') !== currentName) {
          if (t.getAttribute('data-uye-orig') == null) {
            t.setAttribute('data-uye-orig', t.innerHTML);
            t.setAttribute('data-uye-fs', t.style.fontSize || '');
          }
          t.textContent = '👤 ' + currentName;
          t.style.fontSize = '11px';           // daha küçük
          t.setAttribute('data-uye-nav', currentName);
          t.title = 'Üyelik panelin';
        }
      } else {
        // Giriş butonu yok (yalnız ÜYELİK var) → ÜYELİK'e dokunma, nav'a küçük isim ekle
        var nav = document.querySelector('header nav') || document.querySelector('header');
        if (nav && !nav.querySelector('[data-uye-nav]')) {
          var a = document.createElement('a');
          a.href = '/uyelik';
          a.textContent = '👤 ' + currentName;
          a.setAttribute('data-uye-nav', currentName);
          a.style.cssText = 'color:#e6c478;font-size:11px;letter-spacing:.08em;text-decoration:none;padding:9px 13px;';
          nav.insertBefore(a, nav.lastElementChild || null);
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
