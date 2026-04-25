const CACHE_PREFIX = 'pleasure-he-v';
const CACHE = 'pleasure-he-v36';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './מצפן התשוקות/index.html',
  './מצפן התשוקות/style.css',
  './מצפן התשוקות/script.js',
  './scene-planner-embed-he.html',
  './planner-he/index.html',
  './planner-he/style.css',
  './planner-he/script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      // Avoid all-or-nothing install failures when one optional path is missing.
      await Promise.allSettled(
        ASSETS.map(path =>
          cache.add(path).catch(() => null)
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('message', event => {
  if (event && event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const isNav = event.request.mode === 'navigate';
  const isShellFile =
    url.pathname.endsWith('/index.html') ||
    url.pathname === '/hypnocards-v2-he/' ||
    url.pathname.endsWith('/hypnocards-v2-he/') ||
    url.pathname.endsWith('/manifest.json') ||
    url.pathname.endsWith('/sw.js');

  // Always prefer network for app shell files so hard refresh gets latest deploy.
  if (isNav || isShellFile) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

