importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (workbox) {
  console.log('Workbox loaded successfully');

  const CACHE_PREFIX = 'SupportHR-PWA-cache';
  const CACHE_VERSION = 'v4';
  const ASSET_CACHE = `${CACHE_PREFIX}-assets-${CACHE_VERSION}`;
  const FONT_CACHE = `${CACHE_PREFIX}-fonts-${CACHE_VERSION}`;
  const IMAGE_CACHE = `${CACHE_PREFIX}-images-${CACHE_VERSION}`;
  const PAGE_CACHE = `${CACHE_PREFIX}-pages-${CACHE_VERSION}`;
  const CURRENT_CACHES = new Set([ASSET_CACHE, FONT_CACHE, IMAGE_CACHE, PAGE_CACHE]);
  const OFFLINE_URL = '/pwa/offline.html';

  workbox.core.skipWaiting();
  workbox.core.clientsClaim();
  workbox.core.setCacheNameDetails({
    prefix: CACHE_PREFIX,
    suffix: CACHE_VERSION
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.has(key))
            .map((key) => caches.delete(key))
        )
      )
    );
  });

  workbox.precaching.precacheAndRoute([
    { url: OFFLINE_URL, revision: '2' }
  ]);

  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style' ||
                     request.destination === 'script',
    new workbox.strategies.NetworkFirst({
      cacheName: ASSET_CACHE,
      networkTimeoutSeconds: 4,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 7 * 24 * 60 * 60
        })
      ]
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'font',
    new workbox.strategies.CacheFirst({
      cacheName: FONT_CACHE,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 30 * 24 * 60 * 60
        })
      ]
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: IMAGE_CACHE,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 24 * 60 * 60
        })
      ]
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: PAGE_CACHE,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60
        })
      ]
    })
  );

  workbox.routing.setCatchHandler(({ event }) => {
    if (event.request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    return Response.error();
  });
} else {
  console.log('Workbox failed to load');
}
