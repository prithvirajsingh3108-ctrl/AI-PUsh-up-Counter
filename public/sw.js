const CACHE_NAME = 'pushup-ai-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Guard against chrome extensions, filesystem, or websocket tools
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Handle navigation requests (Network-First with offline shell fallback)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match('/');
        })
    );
    return;
  }

  // Handle static assets, JS, CSS, and MediaPipe CDN packages
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Background update (stale-while-revalidate)
        fetch(event.request)
          .then((newResponse) => {
            if (newResponse && newResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, newResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache basic site assets and CDN content (COOP/CORS safe)
        const isCachableType = response && (response.type === 'basic' || response.type === 'cors');
        if (response && response.status === 200 && isCachableType) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});
