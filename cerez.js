/* Tarih Ajanı — Çerez onayı ve yönetimi (KVKK).
   - İlk ziyarette alt kısımda onay bandı (Kabul / Yalnızca Gerekli / Ayarlar).
   - Ayar paneli: kategori anahtarları (Zorunlu hep açık) + "Tüm Çerezleri Temizle".
   - Tercih localStorage 'ta_cerez_v1' içinde saklanır; verilene dek bant görünür.
   - "Tüm Çerezleri Temizle": tüm çerezleri ve analitik/oturum verisini siler,
     oturumu (giriş) korur, onayı sıfırlar → bant tekrar çıkar.
   Site kabuğunda / uygulama önizlemesinde gösterilmez. dc yalnızca #dc-root'u
   yeniden render eder; biz body'ye ekleriz, bu yüzden güvenli. */
(function () {
  'use strict';
  if (window.taCerez) return;

  var KEY = 'ta_cerez_v1';
  var GOLD = '#e6c478', INK = '#c19a52';

  function inApp() {
    try {
      if (sessionStorage.getItem('ta_app_preview') === '1') return true;
    } catch (e) {}
    var rc = document.documentElement.classList;
    if (rc.contains('ta-apphome') || rc.contains('ta-hidechrome')) return true;
    try { if (window.matchMedia('(display-mode: standalone)').matches) return true; } catch (e) {}
    if (window.navigator.standalone) return true;
    return false;
  }

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }
  function save(o) {
    o.ts = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
    window.__taConsent = o;
  }

  /* ── Tüm çerezleri temizle ── */
  function clearCookies() {
    var cs = document.cookie ? document.cookie.split(';') : [];
    var host = location.hostname;
    var doms = ['', host, '.' + host];
    var parts = host.split('.');
    if (parts.length > 2) doms.push('.' + parts.slice(-2).join('.'));
    var paths = ['/', location.pathname];
    cs.forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!name) return;
      paths.forEach(function (p) {
        doms.forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=' + p + (d ? '; domain=' + d : '');
        });
      });
    });
  }
  function clearStorage() {
    // Girişi (Supabase auth) koru; analitik / onay / oturum bayraklarını temizle.
    var keep = /auth-token|sb-[a-z0-9]+-auth/i;
    try {
      Object.keys(localStorage).forEach(function (k) { if (!keep.test(k)) localStorage.removeItem(k); });
    } catch (e) {}
    try {
      Object.keys(sessionStorage).forEach(function (k) { sessionStorage.removeItem(k); });
    } catch (e) {}
  }
  function clearAll() {
    clearCookies();
    clearStorage();
    window.__taConsent = null;
    toast('Tüm çerezler ve site verisi temizlendi. Girişin korundu.');
    // onay sıfırlandı → bant yeniden gelsin
    closePanel();
    setTimeout(showBanner, 400);
  }

  /* ── Bilgi baloncuğu ── */
  function toast(msg) {
    var old = document.getElementById('ta-cerez-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.id = 'ta-cerez-toast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100002;' +
      'max-width:min(440px,92vw);background:#0b0d14;border:1px solid rgba(193,154,82,.5);color:#f2ecd9;' +
      'font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-size:13px;line-height:1.5;padding:13px 18px;' +
      'box-shadow:0 20px 50px -20px rgba(0,0,0,.8);opacity:0;transition:opacity .3s,transform .3s;';
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.style.opacity = '1'; });
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 350); }, 3200);
  }

  /* ── Onay bandı ── */
  function showBanner() {
    if (inApp()) return;
    if (document.getElementById('ta-cerez-banner')) return;
    if (read()) return; // tercih verilmiş
    var b = document.createElement('div');
    b.id = 'ta-cerez-banner';
    b.setAttribute('role', 'region');
    b.setAttribute('aria-label', 'Çerez onayı');
    b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:100000;' +
      'display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;' +
      'padding:14px clamp(16px,4vw,34px) calc(14px + env(safe-area-inset-bottom,0px));' +
      'background:linear-gradient(180deg,rgba(8,10,17,.98),rgba(5,6,12,.98));' +
      'border-top:1px solid rgba(193,154,82,.35);backdrop-filter:blur(8px);' +
      'box-shadow:0 -12px 30px -18px rgba(0,0,0,.9);';
    b.innerHTML =
      '<div style="flex:1;min-width:240px;color:#b7bcc7;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-size:12.5px;line-height:1.55;">' +
        '<b style="display:block;color:#e6c478;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.14em;margin-bottom:4px;">ÇEREZ BİLGİLENDİRMESİ</b>' +
        'Deneyimini iyileştirmek ve ziyaret istatistikleri için çerez kullanıyoruz. Zorunlu çerezler sitenin çalışması için gereklidir. ' +
        'Detay: <a href="/gizlilik" style="color:#e6c478;text-decoration:underline;">Gizlilik Politikası</a>.' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:9px;align-items:center;">' +
        '<button type="button" data-act="ayar" style="cursor:pointer;background:none;border:0;color:#9aa0ad;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-size:12.5px;font-weight:600;text-decoration:underline;padding:10px 6px;">Ayarlar</button>' +
        '<button type="button" data-act="gerekli" style="cursor:pointer;background:rgba(12,10,6,.5);border:1px solid rgba(193,154,82,.5);color:#e6c478;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-weight:700;font-size:12.5px;padding:11px 18px;">Yalnızca Gerekli</button>' +
        '<button type="button" data-act="kabul" style="cursor:pointer;border:0;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-weight:700;font-size:12.5px;padding:11px 20px;">Tümünü Kabul Et</button>' +
      '</div>';
    document.body.appendChild(b);
    b.querySelector('[data-act="kabul"]').addEventListener('click', function () { save({ analitik: true, pazarlama: true }); hideBanner(); });
    b.querySelector('[data-act="gerekli"]').addEventListener('click', function () { save({ analitik: false, pazarlama: false }); clearCookies(); hideBanner(); });
    b.querySelector('[data-act="ayar"]').addEventListener('click', function () { openPanel(); });
  }
  function hideBanner() {
    var b = document.getElementById('ta-cerez-banner');
    if (b) { b.style.opacity = '0'; b.style.transition = 'opacity .3s'; setTimeout(function () { b.remove(); }, 320); }
  }

  /* ── Ayar paneli ── */
  function openPanel() {
    if (document.getElementById('ta-cerez-panel')) return;
    var cur = read() || { analitik: true, pazarlama: false };
    var ov = document.createElement('div');
    ov.id = 'ta-cerez-panel';
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:grid;place-items:center;padding:18px;' +
      'background:rgba(3,4,9,.72);backdrop-filter:blur(4px);';
    ov.innerHTML =
      '<div role="dialog" aria-modal="true" aria-label="Çerez tercihleri" style="width:min(500px,96vw);max-height:90vh;overflow:auto;background:#0a0c13;border:1px solid rgba(193,154,82,.35);box-shadow:0 40px 90px -40px rgba(0,0,0,.9);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;border-bottom:1px solid rgba(193,154,82,.18);">' +
          '<b style="font-family:\'Playfair Display\',serif;font-size:20px;font-weight:800;color:#f4ecd8;">Çerez Tercihleri</b>' +
          '<button type="button" data-x style="cursor:pointer;background:none;border:0;color:#9aa0ad;font-size:22px;line-height:1;padding:2px 6px;">×</button>' +
        '</div>' +
        '<div style="padding:18px 22px;">' +
          row('Zorunlu Çerezler', 'Oturum, güvenlik ve temel işlevler. Kapatılamaz.', 'zorunlu', true, true) +
          row('Analitik Çerezler', 'Ziyaret istatistikleri; sayfaları nasıl kullandığını anonim ölçer.', 'analitik', cur.analitik, false) +
          row('Pazarlama Çerezleri', 'Kampanya ve içerik önerilerini kişiselleştirir.', 'pazarlama', cur.pazarlama, false) +
          '<div style="margin-top:8px;padding-top:16px;border-top:1px solid rgba(193,154,82,.14);">' +
            '<button type="button" data-clear style="cursor:pointer;width:100%;background:rgba(124,31,22,.12);border:1px solid rgba(166,47,34,.55);color:#e8a99f;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-weight:700;font-size:13px;padding:13px;">Tüm Çerezleri Temizle</button>' +
            '<p style="margin:8px 0 0;color:#767c8a;font-size:11px;line-height:1.5;">Tüm çerezleri ve analitik/oturum verilerini siler. Giriş oturumun korunur.</p>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;padding:16px 22px;border-top:1px solid rgba(193,154,82,.18);">' +
          '<button type="button" data-x style="cursor:pointer;background:rgba(12,10,6,.5);border:1px solid rgba(193,154,82,.4);color:#cdd2dc;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-weight:700;font-size:12.5px;padding:12px 18px;">Vazgeç</button>' +
          '<button type="button" data-save style="cursor:pointer;border:0;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-weight:700;font-size:12.5px;padding:12px 22px;">Tercihleri Kaydet</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    function toggleVal(name) {
      var el = ov.querySelector('[data-tog="' + name + '"]');
      return el ? el.getAttribute('aria-checked') === 'true' : false;
    }
    ov.querySelectorAll('[data-tog]').forEach(function (t) {
      if (t.getAttribute('data-locked') === '1') return;
      t.addEventListener('click', function () {
        var on = t.getAttribute('aria-checked') === 'true';
        setToggle(t, !on);
      });
    });
    ov.querySelectorAll('[data-x]').forEach(function (b) { b.addEventListener('click', closePanel); });
    ov.addEventListener('click', function (e) { if (e.target === ov) closePanel(); });
    ov.querySelector('[data-clear]').addEventListener('click', clearAll);
    ov.querySelector('[data-save]').addEventListener('click', function () {
      save({ analitik: toggleVal('analitik'), pazarlama: toggleVal('pazarlama') });
      if (!toggleVal('analitik') && !toggleVal('pazarlama')) clearCookies();
      closePanel(); hideBanner();
      toast('Çerez tercihlerin kaydedildi.');
    });
  }
  function closePanel() {
    var p = document.getElementById('ta-cerez-panel');
    if (p) p.remove();
  }
  function row(title, desc, name, on, locked) {
    return '<div style="display:flex;align-items:flex-start;gap:14px;padding:13px 0;border-bottom:1px solid rgba(193,154,82,.1);">' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="color:#eadfc6;font-size:14px;font-weight:600;font-family:\'Hanken Grotesk\',system-ui,sans-serif;">' + title + '</div>' +
        '<div style="color:#818797;font-size:12px;line-height:1.5;margin-top:3px;">' + desc + '</div>' +
      '</div>' +
      '<button type="button" data-tog="' + name + '" data-locked="' + (locked ? 1 : 0) + '" role="switch" aria-checked="' + (on ? 'true' : 'false') + '"' +
        (locked ? ' aria-disabled="true"' : '') +
        ' style="flex:0 0 auto;position:relative;width:44px;height:24px;border-radius:999px;border:0;cursor:' + (locked ? 'default' : 'pointer') + ';' +
        'background:' + (on ? 'linear-gradient(110deg,#a77d35,#d8b26a)' : 'rgba(129,135,151,.3)') + ';' + (locked ? 'opacity:.65;' : '') + 'transition:background .2s;">' +
        '<span style="position:absolute;top:3px;left:' + (on ? '23px' : '3px') + ';width:18px;height:18px;border-radius:50%;background:#f4ecd8;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.4);"></span>' +
      '</button>' +
    '</div>';
  }
  function setToggle(t, on) {
    t.setAttribute('aria-checked', on ? 'true' : 'false');
    t.style.background = on ? 'linear-gradient(110deg,#a77d35,#d8b26a)' : 'rgba(129,135,151,.3)';
    var knob = t.querySelector('span');
    if (knob) knob.style.left = on ? '23px' : '3px';
  }

  /* ── Genel API + footer bağlantısı ── */
  window.taCerez = { open: openPanel, clearAll: clearAll, get: read };
  // Footer'daki "Çerez Tercihleri" bağlantısı (site geneli) paneli açsın
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('.ta-cerez-link, [data-ta-cerez]') : null;
    if (a) { e.preventDefault(); openPanel(); }
  }, true);

  function start() {
    window.__taConsent = read();
    showBanner();
    // dc gövdeyi yeniden kurabilir; bandımız body'de kalmalı — seyrek kontrol
    setInterval(function () {
      if (!read() && !inApp() && !document.getElementById('ta-cerez-banner') && !document.getElementById('ta-cerez-panel')) showBanner();
    }, 4000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
