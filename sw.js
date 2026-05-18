// Service Worker v3.0 - Smarte Update-Strategie
// Diese Version aktualisiert sich SOFORT, wenn eine neue Version online ist!

const CACHE_NAME = 'hp-lern-app-v3';
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

// Installation: Dateien in den Cache laden, dann sofort aktivieren
self.addEventListener('install', event => {
    console.log('SW: Installation, neue Version v3.0');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache geöffnet');
                return cache.addAll(URLS_TO_CACHE.map(url => new Request(url, { cache: 'reload' })));
            })
            .then(() => {
                // SKIP-WAITING: Direkt aktivieren, nicht warten!
                return self.skipWaiting();
            })
            .catch(err => console.log('Cache-Fehler:', err))
    );
});

// Aktivierung: Alte Caches löschen und sofort Kontrolle übernehmen
self.addEventListener('activate', event => {
    console.log('SW: Aktivierung');
    event.waitUntil(
        Promise.all([
            // Alte Caches löschen
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('SW: Lösche alten Cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Sofort die Kontrolle über alle offenen Tabs übernehmen
            self.clients.claim()
        ])
    );
});

// Fetch: NETZWERK-ZUERST-Strategie für JS/JSON, Cache als Fallback
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Für app.js und fragenkatalog.json: Immer Netzwerk zuerst probieren
    // So bekommt der Nutzer Updates SOFORT
    if (url.pathname.endsWith('app.js') ||
        url.pathname.endsWith('fragenkatalog.json') ||
        url.pathname.endsWith('style.css') ||
        url.pathname.endsWith('index.html') ||
        url.pathname.endsWith('/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Erfolgreich vom Netzwerk geladen - aktualisiere Cache
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Netzwerk nicht verfügbar - aus Cache laden
                    return caches.match(event.request).then(response => {
                        return response || caches.match('./index.html');
                    });
                })
        );
        return;
    }

    // Für andere Dateien (Icons etc.): Cache zuerst, dann Netzwerk
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).catch(() => {
                    return caches.match('./index.html');
                });
            })
    );
});
