const CACHE = 'gym-app-v13';
const SHELL = [
  './', './admin/', './socio/', './presentacion/', './patrocinio/', './para-socios/',
  './admin/app.js', './socio/app.js',
  './shared/styles.css', './shared/store.js', './shared/ui.js', './shared/avatar.js', './shared/icon.svg', './shared/deck.css', './shared/deck.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Primero la red (siempre la versión más nueva); si no hay conexión, usa la copia guardada. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    // no-cache: siempre pregunta al servidor si hay versión nueva (evita la copia de 10 min del navegador)
    fetch(e.request, { cache: 'no-cache' }).then(resp => {
      if (resp && resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
