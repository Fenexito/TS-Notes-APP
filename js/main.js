/**
 * @file main.js
 * @summary Este es el punto de entrada principal de la aplicación APad.
 * Su única responsabilidad es iniciar la aplicación una vez que el DOM
 * esté completamente cargado. Importa e invoca la lógica de inicialización
 * principal desde otros módulos.
 */

import { initializeApp } from './app-initializer.js';
import { initializePwa } from './pwa.js';
import { initInfoOverlay } from './modal-manager.js';
import { initializeAuth } from './auth.js'; // <-- MODIFICACIÓN: Importar la nueva función

// Espera a que el contenido del DOM esté completamente cargado y analizado.
document.addEventListener('DOMContentLoaded', async () => { // <-- MODIFICACIÓN: Se convierte en async
    // --- MODIFICACIÓN: Ejecutar la autenticación de Google ---
    const isAuthenticated = await initializeAuth();

    if (isAuthenticated) {
        // Si el usuario está autenticado, inicializar la aplicación normalmente.
        console.log('Authentication successful. Initializing application...');
        initializeApp();
        initInfoOverlay();
        initializePwa();
    } else {
        // Si la autenticación falla, no hacer nada más.
        // El módulo 'auth.js' ya ha bloqueado la interfaz de usuario.
        console.error('Authentication failed. Application will not initialize.');
    }
});
