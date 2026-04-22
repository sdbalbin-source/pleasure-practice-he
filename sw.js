const CACHE = 'hypnocards-v55';
const ASSETS = [
  '/',
  '/index.html',
  '/cards_data.json',
  '/archetypes_data.json',
  '/hypno_guidebook_data.json',
  '/scene-planner-embed-en.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/archetypes/archetype-card-back.webp'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('hypnocards-v') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const networkFirst =
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/cards_data.json') ||
    url.pathname.endsWith('/archetypes_data.json') ||
    url.pathname.endsWith('/hypno_guidebook_data.json');
  if (networkFirst) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          if (r && r.ok) {
            const copy = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

