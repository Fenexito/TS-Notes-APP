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


// Espera a que el contenido del DOM esté completamente cargado y analizado.
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: The DOM has been loaded. Initializing the application...');
    
    // Inicia la lógica principal de la aplicación (eventos, UI inicial, etc.).
    initializeApp();

    initInfoOverlay();
    
    // Inicia la lógica del Service Worker para la Progressive Web App.
    initializePwa();
});
