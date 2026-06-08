const CACHE_PREFIX = 'pleasure-he-v';
const CACHE = 'pleasure-he-v74';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './archetypes-he/archetypes-he-manifest.json',
  './archetypes_he_data.json',
  './archetypes-he/archetype-card-back.webp',
  './trance-he/trance-he-manifest.json',
  './trance-he/about-copy-he.json',
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
  // NOTE: intentionally NOT calling self.skipWaiting() here. Activation is driven
  // by the page's SKIP_WAITING message, sent only AFTER it arms the one-shot
  // reload flag — making the update→activate→reload sequence deterministic and
  // avoiding a controllerchange race that could miss (or mis-fire) the reload.
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
        .catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
    return;
  }
  const looksJson = url.pathname.endsWith('.json');
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.ok) {
        const ct = String(response.headers.get('content-type') || '').toLowerCase();
        const isHtml = ct.includes('text/html');
        // Never cache an HTML SPA-fallback under a .json (data) URL — that is the
        // cache-poisoning vector. Cache everything else as before.
        if (!(looksJson && isHtml)) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
      }
      return response;
    }).catch(() => {
      // On network failure, only serve a cached response if it is NOT HTML masquerading
      // as JSON. Otherwise let the data layer's fetch reject so it can retry.
      return caches.match(event.request).then(cached => {
        if (!cached) return cached;
        if (!looksJson) return cached;
        const ct = String(cached.headers.get('content-type') || '').toLowerCase();
        if (ct.includes('text/html')) return Response.error();
        return cached;
      });
    })
  );
});

