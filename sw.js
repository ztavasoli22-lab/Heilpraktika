// Service Worker - macht die App offline-fähig
const CACHE_NAME = 'hp-lern-app-v1';
const URLS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './fragenkatalog.json',
    './icon-192.png',
    './icon-512.png'
];

// Installation: Dateien in den Cache laden
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache geöffnet');
                return cache.addAll(URLS_TO_CACHE.map(url => new Request(url, { cache: 'reload' })));
            })
            .catch(err => console.log('Cache-Fehler:', err))
    );
});

// Aktivierung: Alte Caches löschen
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch: Aus Cache laden, wenn offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache-Hit - aus Cache zurückgeben
                if (response) {
                    return response;
                }
                // Sonst Netzwerk versuchen
                return fetch(event.request).catch(() => {
                    // Wenn alles fehlschlägt, Index zurückgeben
                    return caches.match('./index.html');
                });
            })
    );
});
