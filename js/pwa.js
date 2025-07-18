/**
 * @file pwa.js
 * @summary Handles all Progressive Web App (PWA) functionality,
 * including Service Worker registration and version management.
 */

import { showToast } from './ui-helpers.js';
import { dom } from './dom-elements.js';
import { db } from './database.js';
import { APP_VERSION_KEY } from './config.js';

/**
 * Updates the application version displayed in the DOM.
 * @param {string} version - The version string to display.
 */
const updateVersionInDOM = (version) => {
    if (!version) return;
    document.title = `APad | NoteApp - ${version}`;
    if (dom.appVersionDisplay) {
        dom.appVersionDisplay.textContent = version;
    }
    if (dom.welcomeAppVersionDisplay) {
        dom.welcomeAppVersionDisplay.textContent = version;
    }
};

/**
 * Registers the service worker and sets up listeners for updates and messages.
 */
export function initializePwa() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration);
                    
                    // Listen for updates to the service worker.
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('New content is available, please refresh.');
                                showToast('A new version is available! Please close all tabs of this app and reopen to update.', 'info', 10000);
                            }
                        };
                    };
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });

            // Listen for version messages from the service worker.
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data?.type === 'APP_VERSION') {
                    console.log('Version received from SW:', event.data.version);
                    updateVersionInDOM(event.data.version);
                    // Persist the version in IndexedDB for faster load next time.
                    db.settings.put({ key: APP_VERSION_KEY, value: event.data.version });
                }
            });

            // When the service worker is ready, request the version.
            navigator.serviceWorker.ready.then(registration => {
                console.log('Service Worker is ready.');
                registration.active?.postMessage({ type: 'GET_VERSION' });
            });

            // On load, try to get the version from IndexedDB first for a faster UI update.
            db.settings.get(APP_VERSION_KEY).then(versionSetting => {
                if (versionSetting?.value) {
                    updateVersionInDOM(versionSetting.value);
                }
            });
        });
    }
}
