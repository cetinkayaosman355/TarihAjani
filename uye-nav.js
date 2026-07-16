// Tarih Ajanı — evrensel üyelik göstergesi
// Girişli kullanıcıda "AJAN GİRİŞİ" butonunu "Ad ▾" yapar; üstüne gelince
// (veya tıklayınca) hesap menüsü açılır: Üyelik Panelim · Studio · Arşiv · Çıkış Yap.
// Menüdeki düz "ÜYELİK" linkine dokunmaz. Çıkışta eski haline döner.
// ÖNEMLİ: dc framework header'ı yeniden kurabildiği için buton üzerine
// dinleyici BAĞLANMAZ — tüm olaylar document üzerinde capture ile yakalanır,
// dönüşüm de MutationObserver ile her yeniden kurulumda tazelenir.
(function () {
  var SB_URL = 'https://ddyuopqcvpzaysnfavqc.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXVvcHFjdnB6YXlzbmZhdnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzAxMjAsImV4cCI6MjA5ODkwNjEyMH0.0nTnXFFrPNlxWC_MIeRwqBCqgdYX_tG7WVUbsj0B6Cc';
  var currentName = null;
  var sbClient = null;   // çıkış menüsü için

  function firstName(u) {
    var n = (u.user_metadata && u.user_metadata.full_name) || (u.email || '').split('@')[0] || 'Ajan';
    return n.trim().split(' ')[0];   // yalnız ilk ad (kısa)
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
    var out = [];
    var h = document.querySelector('header');
    if (h) out = out.concat(Array.prototype.slice.call(h.querySelectorAll('a[href^="/uyelik"]')));
    // mobil menü paneli gibi işaretli kapsamlar da giriş göstergesine dahildir
    Array.prototype.slice.call(document.querySelectorAll('[data-uye-scope] a[href^="/uyelik"]')).forEach(function (a) {
      if (out.indexOf(a) === -1) out.push(a);
    });
    return out;
  }
  // Header + işaretli kapsamlardaki TÜM giriş butonları (gövdedeki hero CTA'lara dokunma).
  // Masaüstü CTA'sı ve mobil menüdeki satır aynı anda dönüştürülür.
  function pickTargets() {
    var links = headerLinks(), best = 0;
    links.forEach(function (a) { var s = ctaScore(a); if (s > best) best = s; });
    if (!best) return [];
    return links.filter(function (a) { return ctaScore(a) === best; });
  }
  // e.target'tan güvenli closest (metin düğümü/eski tarayıcı koruması)
  function closestFrom(t, sel) {
    var el = t && t.nodeType === 1 ? t : (t && t.parentElement);
    return el && el.closest ? el.closest(sel) : null;
  }
  // Yalnız ana sayfa (giriş pop-up'ı sadece burada açılır)
  function isHomePage() {
    var p = (location.pathname || '').replace(/\/+$/, '') || '/';
    return p === '/' || p === '/index.html' || /(^|\/)index/i.test(p) || /tarih[ %0-9]*ajani/i.test(p);
  }

  /* ── hesap menüsü: Üyelik Panelim · Studio · Arşiv · Çıkış Yap ── */
  var menuEl = null, closeTimer = null;
  function cancelClose() { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } }
  function scheduleClose() { cancelClose(); closeTimer = setTimeout(closeMenu, 280); }
  function closeMenu() {
    cancelClose();
    if (menuEl && menuEl.parentElement) menuEl.parentElement.removeChild(menuEl);
    menuEl = null;
  }
  function doLogout() {
    closeMenu();
    try {
      localStorage.removeItem('ta_account_v1');
      localStorage.removeItem('ta_uye');
      var st = JSON.parse(localStorage.getItem('ta_studio_v5') || '{}');
      delete st.agent; delete st.email;
      localStorage.setItem('ta_studio_v5', JSON.stringify(st));
      // Supabase oturum anahtarını da sil ki yeniden yüklemede tekrar girmesin
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf('sb-') === 0 || k.toLocaleLowerCase().indexOf('supabase') !== -1) localStorage.removeItem(k);
      });
    } catch (e) {}
    // Arayüzü anında geri döndür; sunucu çıkışını arka planda tetikle (yanıtı bekleme)
    currentName = null;
    try { apply(); } catch (e) {}
    try { if (sbClient && sbClient.auth) sbClient.auth.signOut(); } catch (e) {}
    // Temiz oturumsuz durum için sayfayı tazele ("bitti gitti") — giriş akışıyla aynı
    setTimeout(function () { try { location.reload(); } catch (e) {} }, 150);
  }
  function openMenu(btn) {
    if (menuEl) { cancelClose(); return; }
    var r = btn.getBoundingClientRect();
    menuEl = document.createElement('div');
    menuEl.setAttribute('data-uye-menu-panel', '1');
    menuEl.style.cssText = 'position:fixed;z-index:999;top:' + (r.bottom + 6) + 'px;left:' + Math.max(8, r.right - 200) + 'px;' +
      'min-width:192px;background:rgba(5,7,13,.98);border:1px solid rgba(193,154,82,.5);box-shadow:0 18px 50px rgba(0,0,0,.6);' +
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
    item('🎬 STUDIO', function () { closeMenu(); window.location.href = '/studio'; });
    item('🗂 ARŞİV', function () { closeMenu(); window.location.href = '/arsiv'; });
    var out = item('⎋ ÇIKIŞ YAP', doLogout);
    out.style.borderBottom = '0'; out.style.color = '#e08a80';
    out.onmouseenter = function () { out.style.background = 'rgba(224,138,128,.1)'; };
    out.onmouseleave = function () { out.style.background = 'transparent'; };
    document.body.appendChild(menuEl);
  }

  /* ── GİRİŞ / KAYIT açılır penceresi (pop-up) — yalnız ana sayfada tetiklenir ── */
  var loginEl = null, loginMode = 'giris', loginBusy = false;
  var lv = { name: '', email: '', pass: '' };

  function authErr(err) {
    var raw = (err && err.message) || 'Bilinmeyen hata';
    var m = raw.toLowerCase();
    if (m.indexOf('invalid login') !== -1) return 'E-posta veya şifre hatalı.';
    if (m.indexOf('already registered') !== -1 || m.indexOf('already been') !== -1) return 'Bu e-posta zaten kayıtlı. Giriş yap.';
    if (m.indexOf('password') !== -1) return 'Şifre en az 6 karakter olmalı.';
    if (m.indexOf('email') !== -1 && m.indexOf('confirm') !== -1) return 'E-postanı doğrulaman gerekiyor.';
    return 'Hata: ' + raw;
  }
  function closeLogin() {
    if (loginEl && loginEl.parentElement) loginEl.parentElement.removeChild(loginEl);
    loginEl = null; loginBusy = false;
  }
  function loginHTML() {
    var isK = loginMode === 'kayit';
    var tab = function (on) { return 'border:0;cursor:pointer;padding:12px;font-family:\'Special Elite\',monospace;font-weight:700;font-size:11px;letter-spacing:.14em;' + (on ? 'background:rgba(193,154,82,.18);color:#e6c478;' : 'background:transparent;color:#818797;'); };
    var inp = 'border:1px solid rgba(129,135,151,.35);background:#060910;color:#f2ecd9;padding:13px 14px;font-size:15px;width:100%;box-sizing:border-box;';
    var lbl = 'color:#818797;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.16em;';
    return ''
      + '<button data-x title="Kapat" style="position:absolute;top:6px;right:6px;z-index:2;border:0;background:transparent;color:#818797;font-size:22px;line-height:1;cursor:pointer;padding:6px 11px;">✕</button>'
      + '<div style="padding:34px 28px 26px;">'
      + '<p style="margin:0;text-align:center;color:#c19a52;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.2em;">AJAN KİMLİK KONTROLÜ</p>'
      + '<h2 style="margin:10px 0 6px;text-align:center;font-family:\'Playfair Display\',serif;font-size:27px;font-weight:800;color:#f2ecd9;">' + (isK ? 'Aramıza katıl' : 'Tekrar hoş geldin, Ajan') + '</h2>'
      + '<p style="margin:0 0 22px;text-align:center;color:#a4a9b5;font-size:13.5px;line-height:1.6;">Giriş yap ya da ücretsiz kayıt ol; hesabına 30 deneme kredisi tanımlanır.</p>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid rgba(193,154,82,.3);">'
      + '<button data-tab="giris" style="' + tab(!isK) + '">GİRİŞ YAP</button>'
      + '<button data-tab="kayit" style="' + tab(isK) + '">KAYIT OL</button>'
      + '</div>'
      + '<div style="border:1px solid rgba(193,154,82,.3);border-top:0;background:#070a12;padding:22px;display:grid;gap:13px;">'
      + (isK ? '<label style="display:grid;gap:6px;"><span style="' + lbl + '">AJAN ADIN</span><input data-name placeholder="ör. Osman Çetinkaya" style="' + inp + '"></label>' : '')
      + '<label style="display:grid;gap:6px;"><span style="' + lbl + '">E-POSTA</span><input data-email type="email" placeholder="ajan@ornek.com" style="' + inp + '"></label>'
      + '<label style="display:grid;gap:6px;"><span style="' + lbl + '">ŞİFRE</span><input data-pass type="password" placeholder="••••••••" style="' + inp + '"></label>'
      + '<p data-err style="margin:0;color:#e08a80;font-size:13px;display:none;"></p>'
      + '<button data-submit style="border:0;cursor:pointer;margin-top:4px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:12.5px;letter-spacing:.16em;padding:15px;">' + (isK ? 'KAYIT OL →' : 'GİRİŞ YAP →') + '</button>'
      + '<p style="margin:2px 0 0;text-align:center;color:#676d7c;font-size:12px;line-height:1.6;">Üyeliğin yoksa ücretsiz kayıt ol; hesabına 30 deneme kredisi tanımlanır.</p>'
      + '</div></div>';
  }
  function captureVals(panel) {
    var n = panel.querySelector('[data-name]'), e = panel.querySelector('[data-email]'), p = panel.querySelector('[data-pass]');
    if (n) lv.name = n.value; if (e) lv.email = e.value; if (p) lv.pass = p.value;
  }
  function fillVals(panel) {
    var n = panel.querySelector('[data-name]'), e = panel.querySelector('[data-email]'), p = panel.querySelector('[data-pass]');
    if (n) n.value = lv.name; if (e) e.value = lv.email; if (p) p.value = lv.pass;
  }
  function renderLogin(panel) {
    panel.innerHTML = loginHTML();
    fillVals(panel);
    panel.querySelector('[data-x]').addEventListener('click', closeLogin);
    Array.prototype.slice.call(panel.querySelectorAll('[data-tab]')).forEach(function (b) {
      b.addEventListener('click', function () { captureVals(panel); loginMode = b.getAttribute('data-tab'); renderLogin(panel); });
    });
    panel.querySelector('[data-submit]').addEventListener('click', function () { submitLogin(panel); });
    Array.prototype.slice.call(panel.querySelectorAll('input')).forEach(function (i) {
      i.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitLogin(panel); });
    });
    var em = panel.querySelector('[data-email]');
    if (em) { try { (lv.email && panel.querySelector('[data-pass]') ? panel.querySelector('[data-pass]') : em).focus(); } catch (e) {} }
  }
  function withSb(cb) {
    if (sbClient) return cb();
    ensureLib(function () { if (!sbClient) sbClient = window.supabase.createClient(SB_URL, SB_KEY); cb(); });
  }
  function submitLogin(panel) {
    if (loginBusy) return;
    captureVals(panel);
    var errEl = panel.querySelector('[data-err]'), submit = panel.querySelector('[data-submit]');
    function showErr(msg) { errEl.textContent = msg; errEl.style.display = 'block'; }
    var email = (lv.email || '').trim();
    if (!email || email.indexOf('@') === -1) return showErr('Geçerli bir e-posta yaz.');
    if (loginMode === 'kayit' && !(lv.name || '').trim()) return showErr('Ajan adını yaz.');
    if (!(lv.pass || '').trim()) return showErr('Şifreni yaz.');
    loginBusy = true; errEl.style.display = 'none'; submit.textContent = 'LÜTFEN BEKLE…';
    function done(ok, msg, toGiris) {
      loginBusy = false;
      if (ok) { onLoginSuccess(email); return; }
      submit.textContent = loginMode === 'kayit' ? 'KAYIT OL →' : 'GİRİŞ YAP →';
      if (toGiris) { loginMode = 'giris'; renderLogin(panel); }
      var e2 = panel.querySelector('[data-err]'); if (e2) { e2.textContent = msg; e2.style.display = 'block'; }
    }
    withSb(function () {
      if (loginMode === 'kayit') {
        sbClient.auth.signUp({ email: email, password: lv.pass, options: { data: { full_name: (lv.name || '').trim() } } }).then(function (r) {
          if (r.error) return done(false, authErr(r.error));
          try { fetch(SB_URL + '/functions/v1/posta', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY }, body: JSON.stringify({ action: 'welcome', email: email }) }); } catch (e) {}
          sbClient.auth.getSession().then(function (s) {
            if (s && s.data && s.data.session) return done(true);
            sbClient.auth.signInWithPassword({ email: email, password: lv.pass }).then(function (r2) {
              if (r2.error) return done(false, 'Kayıt alındı. E-postanı doğrulayıp giriş yapabilirsin.', true);
              done(true);
            });
          });
        }, function (err) { done(false, authErr(err)); });
      } else {
        sbClient.auth.signInWithPassword({ email: email, password: lv.pass }).then(function (r) {
          if (r.error) return done(false, authErr(r.error));
          done(true);
        }, function (err) { done(false, authErr(err)); });
      }
    });
  }
  function onLoginSuccess(email) {
    try { var st = JSON.parse(localStorage.getItem('ta_studio_v5') || '{}'); st.email = email; localStorage.setItem('ta_studio_v5', JSON.stringify(st)); } catch (e) {}
    lv = { name: '', email: '', pass: '' };
    // Sayfayı tazele: hangi sayfada olursak olalım (Studio, Üyelik, Ana sayfa…)
    // oturum artık açık; sayfa girişli haliyle yeniden kurulur. "Bitti gitti."
    var panel = loginEl && loginEl.querySelector('[data-submit]');
    if (panel) panel.textContent = 'GİRİŞ BAŞARILI ✓';
    setTimeout(function () { location.reload(); }, 350);
  }
  function openLogin(mode, prefillEmail) {
    if (loginEl) { return; }
    loginMode = mode || 'giris';
    if (prefillEmail) lv.email = prefillEmail;
    loginEl = document.createElement('div');
    loginEl.setAttribute('data-uye-login', '1');
    loginEl.style.cssText = 'position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;';
    var backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:absolute;inset:0;background:rgba(3,4,9,.82);';
    backdrop.addEventListener('click', closeLogin);
    var panel = document.createElement('div');
    panel.style.cssText = 'position:relative;z-index:1;width:100%;max-width:440px;max-height:92vh;overflow:auto;border:1px solid rgba(193,154,82,.42);background:#070a12;box-shadow:0 30px 90px rgba(0,0,0,.75);';
    loginEl.appendChild(backdrop); loginEl.appendChild(panel);
    document.body.appendChild(loginEl);
    renderLogin(panel);
  }
  // Diğer sayfalar (üyelik hero düğmesi vb.) buradan açar
  window.taOpenLogin = function (mode, email) { if (!currentName) openLogin(mode, email); };

  // ── Olay delegasyonu: dinleyiciler DOCUMENT üzerinde (capture) yaşar.
  // Framework butonu yeniden kursa da tıklama/hover çalışmaya devam eder;
  // capture aşaması site içi yönlendirme dinleyicilerinden de önce koşar.
  // SADECE ANA SAYFADA, header'daki "AJAN GİRİŞİ" → yerinde pop-up.
  // WINDOW capture: page-transition.js gibi DOCUMENT-capture dinleyicilerinden ÖNCE
  // koşar; preventDefault edince onlar (e.defaultPrevented kontrolü) yönlendirmeyi atlar.
  window.addEventListener('click', function (e) {
    if (currentName || loginEl || !isHomePage()) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var la = closestFrom(e.target, 'header a[href^="/uyelik"], [data-uye-scope] a[href^="/uyelik"]');
    if (la && ctaScore(la) >= 5) {
      e.preventDefault(); e.stopImmediatePropagation();
      openLogin('giris');
    }
  }, true);

  document.addEventListener('click', function (e) {
    var btn = closestFrom(e.target, 'a[data-uye-nav]');
    if (btn) {
      e.preventDefault(); e.stopPropagation();
      if (menuEl) closeMenu(); else openMenu(btn);
      return;
    }
    if (menuEl && !menuEl.contains(e.target)) closeMenu();
  }, true);
  document.addEventListener('mouseover', function (e) {
    var over = closestFrom(e.target, 'a[data-uye-nav], [data-uye-menu-panel]');
    if (!over) return;
    cancelClose();
    if (!menuEl && over.getAttribute('data-uye-nav') != null) openMenu(over);
  }, true);
  document.addEventListener('mouseout', function (e) {
    if (!menuEl) return;
    var from = closestFrom(e.target, 'a[data-uye-nav], [data-uye-menu-panel]');
    if (!from) return;
    var to = closestFrom(e.relatedTarget, 'a[data-uye-nav], [data-uye-menu-panel]');
    if (!to) scheduleClose();   // buton↔menü arası geçişe 280ms tolerans
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeLogin(); } });

  function apply() {
    if (currentName) {
      // Eski sürümlerin eklemiş olabileceği ayrı "isim" linklerini temizle (çift yazmasın)
      Array.prototype.slice.call(document.querySelectorAll('a[data-uye-nav]')).forEach(function (a) {
        if (a.getAttribute('data-uye-orig') == null && a.parentElement) a.parentElement.removeChild(a);
      });
      // "AJAN GİRİŞİ" butonlarını doğrudan ada dönüştür (header + mobil menü).
      // Metin denetimi de yapılır: framework metni geri yazdıysa tazele.
      var ts = pickTargets();
      Array.prototype.slice.call(document.querySelectorAll('header a[data-uye-nav], [data-uye-scope] a[data-uye-nav]')).forEach(function (a) {
        if (ts.indexOf(a) === -1) ts.push(a);
      });
      ts.forEach(function (t) {
        var want = currentName + ' ▾';
        if (t.getAttribute('data-uye-orig') == null) t.setAttribute('data-uye-orig', t.innerHTML);
        if (t.textContent !== want) t.textContent = want;   // "AJAN GİRİŞİ" → "Osman ▾"
        t.setAttribute('data-uye-nav', currentName);
        t.title = 'Hesap menüsü';
      });
      // Header'da giriş butonu yoksa HİÇBİR ŞEY ekleme (ÜYELİK'e dokunma, ayrı ad yazma)
    } else {
      closeMenu();
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

  // Framework header'ı sonradan/yeniden kurarsa dönüşümü tazele (debounce'lu)
  var moTimer = null;
  function watchDom() {
    if (!window.MutationObserver || !document.body) return;
    new MutationObserver(function (muts) {
      // menünün kendi ekle/çıkarları döngü yaratmasın
      var relevant = muts.some(function (m) {
        return !closestFrom(m.target, '[data-uye-menu-panel]');
      });
      if (!relevant) return;
      if (moTimer) clearTimeout(moTimer);
      moTimer = setTimeout(function () { if (currentName) apply(); }, 200);
    }).observe(document.body, { childList: true, subtree: true });
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
    watchDom();
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
