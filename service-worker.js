// service-worker.js

// Define el nombre de la caché y la versión.
// ¡IMPORTANTE!: Cambia este nombre (ej. 'apad-v1.0.1') cada vez que hagas cambios
// en tus archivos HTML, CSS, JS o cualquier otro activo que quieras que se actualice.
const CACHE_NAME = 'v0.8.5'; // <-- ESTA ES LA VERSIÓN QUE SE MOSTRARÁ

// Lista de URLs de los archivos que quieres que el Service Worker cachee.
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/screenshots/desktop-screenshot-1.png',
  '/screenshots/desktop-screenshot-2.png',
  '/screenshots/mobile-screenshot-1.png',
  'https://unpkg.com/dexie@latest/dist/dexie.js'
];

// Evento 'install': Cacheamos todos los archivos esenciales.
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  // skipWaiting() fuerza al SW en espera a convertirse en el activo.
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando archivos de la aplicación.');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Error al cachear archivos durante la instalación:', error);
      })
  );
});

// Evento 'activate': Limpiamos cachés antiguas y tomamos control.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Reclamando clientes...');
      // clients.claim() permite que un SW activado tome control de los clientes inmediatamente.
      return self.clients.claim();
    })
  );
});

// Evento 'fetch': Interceptamos las solicitudes y servimos desde caché o red.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si la respuesta está en caché, la devolvemos. Si no, la buscamos en la red.
        return response || fetch(event.request);
      })
      .catch(error => {
        console.error('[Service Worker] Error en la solicitud fetch:', error);
        // Opcional: Devolver una página offline si la solicitud falla.
        // return caches.match('/offline.html');
      })
  );
});


// Manejador de mensajes para obtener la versión de la app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_VERSION') {
    console.log('[Service Worker] Solicitud de versión recibida. Enviando:', CACHE_NAME);
    // Enviar la versión al cliente que la solicitó.
    event.source.postMessage({ type: 'APP_VERSION', version: CACHE_NAME });
  }
});
