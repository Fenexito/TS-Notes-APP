// service-worker.js

// Define el nombre de la caché y la versión.
// ¡IMPORTANTE!: Cambia este nombre (ej. 'call-center-notes-v1.0.1') cada vez que hagas cambios
// en tus archivos HTML, CSS, JS o cualquier otro activo que quieras que se actualice
// para los usuarios. Esto fuerza al navegador a instalar el nuevo Service Worker.
const CACHE_NAME = 'v0.8.5'; // <-- ESTA ES LA VERSIÓN QUE SE MOSTRARÁ

// Lista de URLs de los archivos que quieres que el Service Worker cachee.
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/screenshots/desktop-screenshot-1.png', // Asegúrate de que estas rutas sean correctas
  '/screenshots/desktop-screenshot-2.png',
  '/screenshots/mobile-screenshot-1.png',
  'https://unpkg.com/dexie@latest/dist/dexie.js' // Si usas Dexie desde CDN
];

// Evento 'install': Cacheamos todos los archivos esenciales.
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando Service Worker...');
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

// Evento 'fetch': Interceptamos las solicitudes y servimos desde caché o red.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log(`[Service Worker] Sirviendo desde caché: ${event.request.url}`);
          return response;
        }
        console.log(`[Service Worker] Obteniendo de la red: ${event.request.url}`);
        return fetch(event.request);
      })
      .catch(error => {
        console.error('[Service Worker] Error en la solicitud fetch:', error);
        // Puedes devolver una página offline si la solicitud falla y no hay caché.
        // return caches.match('/offline.html');
      })
  );
});

// Evento 'activate': Limpiamos cachés antiguas.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando Service Worker...');
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
    })
  );
});

// NUEVO: Manejador de mensajes para obtener la versión de la app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_VERSION') {
    // Extraer solo la parte numérica de la versión (ej. de 'v0.8.5' a '0.8.5')
    const versionNumber = CACHE_NAME.startsWith('v') ? CACHE_NAME.substring(1) : CACHE_NAME;
    event.source.postMessage({ type: 'APP_VERSION', version: versionNumber });
  }
});
