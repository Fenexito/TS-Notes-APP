// service-worker.js

// Define the cache name and version.
// IMPORTANT!: Change this name (e.g., 'apad-v1.0.1') every time you make changes
// to your HTML, CSS, JS, or any other assets you want to be updated
// for users. This forces the browser to install the new Service Worker.
const CACHE_NAME = 'v0.9.9'; // <-- THIS IS THE VERSION THAT WILL BE DISPLAYED

// List of URLs for the files you want the Service Worker to cache.
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://unpkg.com/dexie@latest/dist/dexie.js',
    '/js/auth.js', // <-- MODIFICACIÓN: Añadir el nuevo archivo de autenticación
    '/js/main.js',
    '/js/app-initializer.js',
    '/js/config.js',
    '/js/database.js',
    '/js/dom-elements.js',
    '/js/event-listeners.js',
    '/js/history-manager.js',
    '/js/modal-manager.js',
    '/js/note-builder.js',
    '/js/pwa.js',
    '/js/ui-helpers.js',
    '/js/ui-manager.js',
    '/js/checklist-manager.js',
    '/js/tutorial.js'
];

// 'install' event: We cache all essential files.
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  // skipWaiting() forces the waiting SW to become the active one.
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app files.');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Error caching files during installation:', error);
      })
  );
});

// 'activate' event: We clear old caches and take control.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients...');
      // clients.claim() allows an activated SW to take control of clients immediately.
      return self.clients.claim();
    })
  );
});

// 'fetch' event: We intercept requests and serve from cache or network.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If the response is in the cache, return it. Otherwise, fetch from the network.
        return response || fetch(event.request);
      })
      .catch(error => {
        console.error('[Service Worker] Fetch error:', error);
        // Optional: Return an offline page if the request fails.
        // return caches.match('/offline.html');
      })
  );
});


// Message handler to get the app version.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_VERSION') {
    console.log('[Service Worker] Version request received. Sending:', CACHE_NAME);
    // Send the version to the client that requested it.
    event.source.postMessage({ type: 'APP_VERSION', version: CACHE_NAME });
  }
});
