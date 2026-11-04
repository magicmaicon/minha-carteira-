
const CACHE = 'minha-carteira-v32';

const FILES = ['./','./index.html'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(FILES);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('minha-carteira-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const isPage = request.mode === 'navigate' || url.pathname.endsWith('/index.html');
  if (isPage) {
    event.respondWith((async () => {
      const pageURL = new URL('./index.html', self.registration.scope).href;
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) { const cache = await caches.open(CACHE); await cache.put(pageURL, response.clone()); }
        return response;
      } catch (error) {
        return (await caches.match(pageURL)) || (await caches.match('./'));
      }
    })());
  } else {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) { const cache = await caches.open(CACHE); await cache.put(request, response.clone()); }
      return response;
    })());
  }
});
