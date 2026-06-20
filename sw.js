/* MedienTracker Service Worker v1.0 */
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `medientracker-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/db.js',
  './js/firebase-sync.js',
  './js/scanner.js',
  './js/api.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(err => console.warn('[SW] Cache addAll partial fail:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // External: network-only
  const externalHosts = [
    'googleapis.com','firebaseapp.com','firebaseio.com','firestore.googleapis.com',
    'openlibrary.org','omdbapi.com','unpkg.com','gstatic.com','upcitemdb.com',
    'covers.openlibrary.org','books.google.com'
  ];
  if (externalHosts.some(h => url.hostname.includes(h))) {
    event.respondWith(
      fetch(request).catch(() => new Response('{}', {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // Local: cache-first, fallback to network then cache
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});