const CACHE_NAME = "dellmar-docs-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/logo.png",
  "/manifest.json"
];


self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});


self.addEventListener('push', function (event) {
  const data = event.data?.json() || {};

  const title = data.title || "Nova notificação";
  const options = {
    body: data.body || "Você recebeu uma nova mensagem.",
    icon: "/icone-mensagem.png",
    badge: "/icone-mensagem.png",
    data: { url: data.url || "/" }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
