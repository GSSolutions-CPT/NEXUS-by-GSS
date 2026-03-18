const CACHE_NAME = 'nexus-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A simple fetch handler is enough to trigger the PWA install criteria
  // We don't need to aggressively cache everything for this to work.
  event.respondWith(fetch(event.request).catch(() => new Response('Offline')));
});
