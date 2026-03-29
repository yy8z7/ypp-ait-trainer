const CACHE_NAME = 'study-app-v17';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './questions.json',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim clients immediately
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Network First, fallback to Cache
  // 这种策略下，只要本地服务开着，永远优先从网络获取最新代码，解决刷新不更新的问题。
  // 当关闭服务或离线时，会 catch 错误并从缓存中读取，完美保留离线能力。
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // 请求成功时，动态更新缓存
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 网络失败（离线）时，回退到缓存
        return caches.match(event.request, { ignoreSearch: true });
      })
  );
});