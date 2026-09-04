'use strict';
const VERSION = 'wander-portugal-v30';
const STATIC = `${VERSION}-static`;
const PHOTOS = `${VERSION}-photos`;
const APP_SHELL = [
  './', './index.html', './app.css?v=30', './routes.js?v=30', './app.js?v=30',
  './manifest.webmanifest', './icon.svg', './assets/icon-192.png', './assets/icon-512.png'
];

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('wander-portugal-') && ![STATIC, PHOTOS].includes(name)).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirst(request, fallback) {
  const cache = await caches.open(STATIC);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (fallback ? await cache.match(fallback) : undefined) || Response.error();
  }
}

async function cacheFirstPhoto(request) {
  const cache = await caches.open(PHOTOS);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const request = event.request;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, './index.html'));
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname.includes('/assets/photos/')) {
      event.respondWith(cacheFirstPhoto(request));
    } else {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  if (url.hostname.endsWith('wikimedia.org')) {
    event.respondWith(cacheFirstPhoto(request));
  }
});
