/**
 * @file main.js
 * @summary Este es el punto de entrada principal de la aplicación APad.
 * Su única responsabilidad es iniciar la aplicación una vez que el DOM
 * esté completamente cargado.
 */

import { initializeApp } from './app-initializer.js';
import { initializePwa } from './pwa.js';
import { initInfoOverlay } from './modal-manager.js';
import { initializeAuth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeAuth();

        console.log('Authentication successful. Scheduling app initialization...');

        setTimeout(async () => {
            try {
                console.log('Running scheduled app initialization.');
                await initializeApp();
                initInfoOverlay();
                initializePwa();
            } catch (initError) {
                console.error("Error during app initialization phase:", initError);
                document.body.innerHTML = `<div style="color:red; padding: 20px; font-family: sans-serif;">
                    <h1>Application Error</h1>
                    <p>Failed to initialize the application components. Please check the console for details.</p>
                </div>`;
            }
        }, 0);

    } catch (error) {
        console.error("A critical error occurred during the authentication process:", error);
        document.body.innerHTML = `<div style="color:red; padding: 20px; font-family: sans-serif;">
            <h1>Application Error</h1>
            <p>Failed to initialize the application. Please check the console for details.</p>
        </div>`;
    }
});
