const CACHE_PREFIX = 'SupportHR-PWA-cache';
const CACHE_VERSION = 'v5';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const PAGE_CACHE = `${CACHE_PREFIX}-pages-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-${CACHE_VERSION}`;
const CURRENT_CACHES = new Set([STATIC_CACHE, PAGE_CACHE, RUNTIME_CACHE, IMAGE_CACHE]);
const OFFLINE_URL = '/pwa/offline.html';
const CORE_ASSETS = [
  '/',
  '/welcome',
  OFFLINE_URL,
  '/pwa/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/images/logos/logo.jpg',
  '/images/logos/screenshot-1.png',
  '/images/logos/screenshot-mobile.png'
];

const isSameOrigin = (url) => url.origin === self.location.origin;

const putInCache = async (cacheName, request, response) => {
  if (!response || !response.ok || response.type === 'opaque') {
    return;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
};

const cacheCoreAssets = async () => {
  const cache = await caches.open(STATIC_CACHE);

  await Promise.allSettled(
    CORE_ASSETS.map(async (assetUrl) => {
      const request = new Request(assetUrl, { cache: 'reload' });
      const response = await fetch(request);

      if (response.ok) {
        await cache.put(assetUrl, response.clone());
      }
    })
  );
};

const networkFirst = async (request, cacheName, fallbacks = []) => {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    for (const fallback of fallbacks) {
      const fallbackResponse = await caches.match(fallback);

      if (fallbackResponse) {
        return fallbackResponse;
      }
    }

    throw error;
  }
};

const staleWhileRevalidate = async (request, cacheName) => {
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request)
    .then(async (response) => {
      await putInCache(cacheName, request, response);
      return response;
    })
    .catch(() => cachedResponse || Response.error());

  return cachedResponse || fetchPromise;
};

const cacheFirst = async (request, cacheName) => {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  await putInCache(cacheName, request, response);
  return response;
};

const cacheShareTargetPayload = async (request) => {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll('files')
      .filter((file) => file && typeof file === 'object' && 'name' in file)
      .map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));

    const payload = {
      title: formData.get('title') || '',
      text: formData.get('text') || '',
      url: formData.get('url') || '',
      files,
      receivedAt: new Date().toISOString()
    };
    const cache = await caches.open(RUNTIME_CACHE);

    await cache.put(
      '/pwa/share-target/latest.json',
      new Response(JSON.stringify(payload), {
        headers: { 'content-type': 'application/json; charset=utf-8' }
      })
    );
  } catch (error) {
    console.log('Share target payload could not be cached:', error);
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    cacheCoreAssets().then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.has(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === 'POST' && isSameOrigin(url) && url.pathname === '/upload') {
    event.respondWith(
      cacheShareTargetPayload(request).then(() =>
        Response.redirect(new URL('/upload?source=share-target&shared=1', self.location.origin).href, 303)
      )
    );
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGE_CACHE, [url.pathname, '/welcome', '/', OFFLINE_URL]));
    return;
  }

  if (!isSameOrigin(url)) {
    return;
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'worker' ||
    request.destination === 'manifest' ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (CORE_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});

self.addEventListener('sync', (event) => {
  if (['supporthr-background-sync', 'supporthr-sync', 'supporthr-content-sync'].includes(event.tag)) {
    event.waitUntil(cacheCoreAssets());
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'supporthr-periodic-sync') {
    event.waitUntil(cacheCoreAssets());
  }
});

self.addEventListener('push', (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (error) {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || 'Support HR';
  const options = {
    body: payload.body || 'Co cap nhat moi trong khong gian tuyen dung cua ban.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {
      url: payload.url || '/welcome?source=notification'
    },
    actions: [
      {
        action: 'open',
        title: 'Mo Support HR'
      }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || '/welcome', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.navigate(targetUrl).then((navigatedClient) => (navigatedClient || client).focus());
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === 'CACHE_CORE') {
    event.waitUntil(cacheCoreAssets());
  }
});
