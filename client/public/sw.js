const CACHE_NAME = 'ur-examlab-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/UR logo.png',
];

// Cache static assets on install.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// Serve cached assets when offline.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: try network first, fall back to cache (offline practice data).
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (request.method === 'GET' && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || new Response(JSON.stringify({ offline: true }), { status: 503, headers: { 'Content-Type': 'application/json' } })))
    );
    return;
  }

  // Shell assets: cache first, then network.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// Clean up old caches on activate.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});
