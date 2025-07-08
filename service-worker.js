// service-worker.js

// Define el nombre de la caché y la versión.
// ¡IMPORTANTE!: Cambia este nombre (ej. 'call-center-notes-v2') cada vez que hagas cambios
// en tus archivos HTML, CSS, JS o cualquier otro activo que quieras que se actualice
// para los usuarios. Esto fuerza al navegador a instalar el nuevo Service Worker.
const CACHE_NAME = 'call-center-notes-v1'; 

// Lista de URLs de los archivos que quieres que el Service Worker cachee.
// Asegúrate de incluir TODOS los archivos que tu aplicación necesita para funcionar sin conexión.
const urlsToCache = [
  '/', // La raíz de tu aplicación (generalmente index.html)
  '/index.html',
  '/style.css',
  '/script.js',
  // Asegúrate de añadir aquí las rutas a tus iconos PWA:
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Si tienes otras imágenes, fuentes, o librerías JS externas que quieras cachear:
  // 'https://unpkg.com/dexie@latest/dist/dexie.js', // Ejemplo si Dexie.js es una dependencia externa
  // '/img/logo.png',
  // '/fonts/inter.woff2'
];

// Evento 'install': Se dispara cuando el Service Worker se instala por primera vez.
// Aquí cacheamos todos los archivos esenciales de la aplicación.
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

// Evento 'fetch': Se dispara cada vez que el navegador solicita un recurso (HTML, CSS, JS, imágenes, etc.).
// Aquí interceptamos las solicitudes y decidimos si servimos desde la caché o desde la red.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request) // Intenta encontrar el recurso en la caché
      .then(response => {
        // Si el recurso está en caché, lo devuelve.
        if (response) {
          console.log(`[Service Worker] Sirviendo desde caché: ${event.request.url}`);
          return response;
        }
        // Si no está en caché, intenta obtenerlo de la red.
        console.log(`[Service Worker] Obteniendo de la red: ${event.request.url}`);
        return fetch(event.request);
      })
      .catch(error => {
        console.error('[Service Worker] Error en la solicitud fetch:', error);
        // Opcional: Puedes devolver una página offline si la solicitud falla y no hay caché.
        // Por ejemplo, si el usuario está completamente sin conexión.
        // return caches.match('/offline.html'); // Asegúrate de tener un archivo offline.html
      })
  );
});

// Evento 'activate': Se dispara cuando el Service Worker se activa y toma el control de la página.
// Aquí es un buen lugar para limpiar cachés antiguas para ahorrar espacio.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Elimina cualquier caché que no sea la actual (CACHE_NAME)
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
