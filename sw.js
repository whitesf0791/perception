const CACHE_NAME = 'conv-cards-v25';
const ASSETS = [
  './',
  './index.html',
  './js/app.js',
  './js/store.js',
  './js/ui.js',
  './css/app.css',
  './data/questions.js',
  './data/decks.js',
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
  const req = event.request;
  if (req.method !== 'GET') return;

  // Always hit the network for version checks so cache: no-store is respected
  if (req.url.endsWith('/version.json')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached =>
      cached || fetch(req).catch(() =>
        req.mode === 'navigate'
          ? caches.match('./index.html')
          : new Response('', { status: 503, statusText: 'Offline' })
      )
    )
  );
});
