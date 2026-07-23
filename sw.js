/* Tarih Ajanı — Service Worker (PWA).
   Strateji:
   - HTML gezinmeleri (navigate): ağ öncelikli → çevrimdışıysa önbellek → offline.html
   - Aynı köken JS/CSS/JSON: ağ öncelikli → önbellek yedeği (kod hep taze kalsın)
   - Aynı köken görsel/font: önbellek öncelikli (stale-while-revalidate, ağır dosyalar)
   - Çapraz köken (Google Fonts, unpkg React): dokunma, doğrudan ağdan
   SÜRÜM değişince eski önbellekler temizlenir. Her deploy'da bump'la. */
var VERSION = 'ta-v24';
var STATIC = VERSION + '-static';
var PAGES = VERSION + '-pages';
var MEDIA = VERSION + '-media';
var OFFLINE = '/offline.html';
// Çevrimdışı çekirdek: uygulama kabuğu + arşiv verisi (dosyalar internetsiz okunur).
var PRECACHE = [
  '/offline.html', '/assets/pwa-icon-192.png',
  '/app', '/', '/arsiv',
  '/pwa.js', '/support.js',
  '/arsiv-data.js', '/arsiv-slugs.js'
];

self.addEventListener('install', function (e) {
  // best-effort: tek bir dosyanın hatası (örn. yerel testte /arsiv yok) kurulumu düşürmesin
  e.waitUntil(
    caches.open(STATIC).then(function (c) {
      return Promise.allSettled(PRECACHE.map(function (u) { return c.add(u); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf(VERSION) !== 0) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isMedia(url) { return /\.(?:png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|mp3|mp4)(?:\?|$)/i.test(url); }
function isCode(url) { return /\.(?:js|css|json)(?:\?|$)/i.test(url); }

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;

  // çapraz köken (fonts, unpkg vb.) → SW karışmasın
  if (!sameOrigin) return;

  // HTML gezinmesi → ağ öncelikli, HTTP önbelleğini ATLA (kod/HTML hep en taze),
  // çevrimdışı yedeği SW önbelleği.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req.url, { cache: 'no-store' }).then(function (res) {
        // Yönlendirilmiş yanıt (ör. /app → /app/) navigasyonda DOĞRUDAN dönemez:
        // "response served by the service worker has redirections" hatası verir.
        // Bu yüzden gövdeyi temiz bir Response'a sarıp öyle döneriz.
        if (res.redirected) {
          return res.blob().then(function (body) {
            return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
          });
        }
        var copy = res.clone();
        caches.open(PAGES).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) { return hit || caches.match(OFFLINE); });
      })
    );
    return;
  }

  // JS/CSS/JSON → ağ öncelikli + HTTP önbelleği ATLA (kod hep taze), yedeği önbellek
  if (isCode(url.pathname)) {
    e.respondWith(
      fetch(req.url, { cache: 'no-store' }).then(function (res) {
        var copy = res.clone();
        caches.open(STATIC).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }

  // görsel/font → önbellek öncelikli + arkada tazele
  if (isMedia(url.pathname)) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) {
          var copy = res.clone();
          caches.open(MEDIA).then(function (c) { c.put(req, copy); });
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      })
    );
    return;
  }
});

self.addEventListener('message', function (e) {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
