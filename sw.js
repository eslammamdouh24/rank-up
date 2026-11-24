/* Offline support: everything is saved on the phone after the first open.
   Pages/code: try the network first (so updates arrive), fall back to the saved copy offline.
   Photos: use the saved copy. */
const CACHE = 'gym-v5';
importScripts('data.js');
// warm-up, cool-down and treadmill pictures (start + end), plus every exercise in the library
const IMGS = new Set();
['Bicycling_Stationary', 'Cat_Stretch', 'Shoulder_Circles', 'Walking_Treadmill', 'Kneeling_Hip_Flexor', 'Hamstring_Stretch',
  'Dynamic_Chest_Stretch', 'Side_Neck_Stretch'].forEach(n => { IMGS.add(n + '_0.jpg'); IMGS.add(n + '_1.jpg'); });
Object.values(DATA.EX).forEach(e => { IMGS.add(e.img + '_0.jpg'); IMGS.add(e.img + '_1.jpg'); });
IMGS.add('chin_tuck_0.svg'); IMGS.add('chin_tuck_1.svg');
const ASSETS = ['./', 'index.html', 'app.js', 'data.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png',
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
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
