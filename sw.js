/* MacroDay service worker — cache app shell để chạy offline.
   Đổi CACHE mỗi lần cập nhật nội dung để trình duyệt lấy bản mới. */
var CACHE = 'macroday-v1';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).then(function (res) {
        // lưu thêm vào cache nếu là tài nguyên cùng nguồn
        try {
          var copy = res.clone();
          if (e.request.url.indexOf(self.location.origin) === 0) {
            caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
          }
        } catch (err) {}
        return res;
      }).catch(function () {
        // offline và không có trong cache → trả trang chính nếu là điều hướng
        if (e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
