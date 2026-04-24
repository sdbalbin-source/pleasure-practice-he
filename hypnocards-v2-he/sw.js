const CACHE_PREFIX = 'pleasure-he-v';
const CACHE = 'pleasure-he-v18';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './archetypes_he_data.json',
  './archetypes-he/index.html',
  './archetypes-he/image-map.json',
  './archetypes-he/archetype-card-back.webp',
  './דפוסי שפה עברית/index.html',
  './מצפן התשוקות/index.html',
  './מצפן התשוקות/style.css',
  './מצפן התשוקות/script.js',
  './scene-planner-embed-he.html',
  './planner-he/index.html',
  './planner-he/style.css',
  './planner-he/script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
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
  const isArchetypeAsset = url.pathname.includes('/archetypes-he/images/') || url.pathname.endsWith('/archetypes-he/archetype-card-back.webp');
  event.respondWith(
    (isArchetypeAsset
      ? caches.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then(cache => cache.put(event.request, copy));
            }
            return response;
          });
        })
      : fetch(event.request).then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        }).catch(() => caches.match(event.request))
    )
  );
});

