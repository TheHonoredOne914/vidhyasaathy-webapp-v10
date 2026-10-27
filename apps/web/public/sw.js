/* global caches, fetch, Response, self */
const STATIC_PATHS = ['/logo.svg', '/favicon.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!STATIC_PATHS.includes(url.pathname)) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    void caches.open('vidhyasaathy-static-v1').then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(async () => {
    const cached = await caches.match(event.request);
    return cached ?? new Response('', { status: 504, statusText: 'Offline' });
  }));
});
