/* STORIA — service worker (scope: /storia/)
   App-shell cache for offline + fast loads. Only handles same-origin /storia/
   GET requests; leaves fonts, Supabase and other cross-origin calls untouched. */
const CACHE = 'storia-v12';
const ASSETS = [
  '/storia/',
  '/storia/index.html',
  '/storia/studio.html',
  '/storia/assets/storia.css',
  '/storia/assets/studio.js',
  '/storia/assets/ui.js',
  '/storia/assets/config.js',
  '/storia/assets/mark.svg',
  '/storia/assets/icon.svg',
  '/storia/assets/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE && k.indexOf('storia-') === 0; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url;
  try { url = new URL(e.request.url); } catch (_) { return; }
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.indexOf('/storia/') !== 0) return;
  // network-first for code (HTML/JS/CSS/JSON — always fresh online), cache-first
  // for static media (images/fonts) which rarely change.
  var isCode = e.request.mode === 'navigate' || /\.(html|js|css|json|webmanifest)$/.test(url.pathname) || url.pathname === '/storia/';
  if (isCode) {
    e.respondWith(
      fetch(e.request).then(function (resp) { var copy = resp.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); return resp; })
        .catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('/storia/studio.html'); }); })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(function (r) {
        return r || fetch(e.request).then(function (resp) { var copy = resp.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); return resp; });
      })
    );
  }
});
