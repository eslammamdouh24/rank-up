/* Offline support: everything is saved on the phone after the first open.
   Pages/code: try the network first (so updates arrive), fall back to the saved copy offline.
   Photos: use the saved copy. */
const CACHE = 'gym-v8';
importScripts('data.js', 'config.js');
// warm-up, cool-down and treadmill pictures (start + end), plus every exercise in the library
const IMGS = new Set();
['Bicycling_Stationary', 'Cat_Stretch', 'Shoulder_Circles', 'Walking_Treadmill', 'Kneeling_Hip_Flexor', 'Hamstring_Stretch',
  'Dynamic_Chest_Stretch', 'Side_Neck_Stretch'].forEach(n => { IMGS.add(n + '_0.jpg'); IMGS.add(n + '_1.jpg'); });
Object.values(DATA.EX).forEach(e => { IMGS.add(e.img + '_0.jpg'); IMGS.add(e.img + '_1.jpg'); });
IMGS.add('chin_tuck_0.svg'); IMGS.add('chin_tuck_1.svg');
const ASSETS = ['./', 'index.html', 'app.js', 'data.js', 'config.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png',
  ...[...IMGS].map(n => 'img/' + n)];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.url.includes('/img/')) {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
    return;
  }
  // always ask the server for the newest version (no stale browser copy), fall back to the saved copy offline
  e.respondWith(
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }))
  );
});

// ---------------------------------------------------------------- push notifications
// The push carries no text; we ask the push server what this reminder is.
self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let m = { title: 'RANK UP', body: 'افتح التطبيق 💪', url: './', tag: 'rankup' };
    try {
      const sub = await self.registration.pushManager.getSubscription();
      if (self.PUSH_URL && sub) {
        const r = await fetch(self.PUSH_URL + '/msg', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        if (r.ok) m = Object.assign(m, await r.json());
      }
    } catch (err) { /* show the default text */ }
    await self.registration.showNotification(m.title, { body: m.body, icon: 'icon-192.png', badge: 'icon-192.png', tag: m.tag, data: { url: m.url } });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if ('focus' in c) { c.postMessage({ open: url }); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
