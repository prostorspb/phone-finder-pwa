const CACHE_VERSION = '2.0.0';
const CACHE_NAME = `poisk-v${CACHE_VERSION}`;
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  console.log('[SW] Installing version', CACHE_VERSION);
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  console.log('[SW] Activating version', CACHE_VERSION);
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(response => {
        // Кешируем новые ответы
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});

// Уведомление об обновлении
self.addEventListener('message', e => {
  if (e.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
