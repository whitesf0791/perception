const CACHE_NAME = 'conv-cards-v15';
const ASSETS = [
  './',
  './index.html',
  './js/app.js',
  './js/store.js',
  './js/ui.js',
  './css/app.css',
  './data/questions.js',
  './manifest.json',
  './version.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Always hit the network for version checks so cache: no-store is respected
  if (event.request.url.endsWith('/version.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
