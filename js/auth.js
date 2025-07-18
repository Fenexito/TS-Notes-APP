/**
 * @file auth.js
 * @summary Manages user authentication using Google Sign-In.
 * This check is performed before the application initializes.
 */

// --- LISTA DE CORREOS AUTORIZADOS ---
// Edita esta lista para añadir o remover los correos electrónicos de los usuarios
// que tendrán acceso a la aplicación.
const authorizedEmails = [
    'alex.vanhoutven.g38@gmail.com',
    'usuario2@example.com',
    'manager@example.com'
    // Agrega más correos de Google aquí
];

// --- CONFIGURACIÓN DE GOOGLE SIGN-IN ---
// !!! IMPORTANTE: Reemplaza el siguiente valor con tu propio Google Client ID.
const GOOGLE_CLIENT_ID = '675906385578-dds3q120bm70ejjvlffkibl4qa24031c.apps.googleusercontent.com';

/**
 * Initializes the authentication flow. It checks for an existing session
 * or displays the Google Sign-In screen.
 * @returns {Promise<boolean>} - A promise that resolves to true if authenticated, false otherwise.
 */
export async function initializeAuth() {
    return new Promise((resolve) => {
        const session = JSON.parse(localStorage.getItem('userGoogleSession'));
        if (session && session.email && authorizedEmails.includes(session.email.toLowerCase())) {
            console.log(`User ${session.email} has a valid session.`);
            resolve(true);
            return;
        }
        localStorage.removeItem('userGoogleSession'); // Clear invalid session
        renderSignInScreen(resolve);
    });
}

/**
 * Renders the sign-in UI and loads the Google Sign-In script.
 * @param {Function} resolve - The promise resolve function.
 */
function renderSignInScreen(resolve) {
    // Display the sign-in UI
    document.body.innerHTML = `
        <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #1e1e1e; color: #f0f0f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; text-align: center; }
            .signin-container { display: flex; flex-direction: column; align-items: center; padding: 40px; border-radius: 12px; background-color: #2a2a2a; box-shadow: 0 6px 20px rgba(0,0,0,0.5); border: 1px solid #444; }
            h1 { color: #fff; margin-top: 0; font-size: 1.8em; }
            p { color: #ccc; margin-bottom: 25px; max-width: 300px; }
            #google-signin-button-container { min-height: 40px; } /* Prevent layout shift */
        </style>
        <div class="signin-container">
            <h1>APad Access</h1>
            <p>Please sign in with your authorized Google account.</p>
            <div id="google-signin-button-container"></div>
            <div id="auth-error-message" style="color: #ff4d4d; margin-top: 20px;"></div>
        </div>
    `;

    // Inject Google's script into the page
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => initializeGoogleSignIn(resolve);
    document.head.appendChild(script);
}

/**
 * Initializes the Google Sign-In client and renders the button.
 * @param {Function} resolve - The promise resolve function.
 */
function initializeGoogleSignIn(resolve) {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        console.error("Google Identity Services library not loaded.");
        blockAccess("Failed to load Google Sign-In. Please check your connection and try again.");
        resolve(false);
        return;
    }

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
            const userObject = parseJwt(response.credential);
            const userEmail = userObject.email ? userObject.email.toLowerCase() : null;

            if (userEmail && authorizedEmails.includes(userEmail)) {
                console.log(`Authentication successful for ${userEmail}.`);
                localStorage.setItem('userGoogleSession', JSON.stringify({ email: userEmail, name: userObject.name, picture: userObject.picture }));
                document.body.innerHTML = `<p style="color: #fff; font-family: sans-serif; font-size: 1.2em;">Authentication successful. Reloading...</p>`;
                setTimeout(() => window.location.reload(), 500);
                // The promise is fulfilled by the page reload, no need to resolve(true)
            } else {
                console.error(`Access Denied: Google account ${userEmail} is not authorized.`);
                blockAccess(`Access Denied. The Google account "${userObject.email}" is not authorized. Please contact the administrator to request access.`);
                // We don't resolve(false) to allow the user to try signing in with a different account.
            }
        }
    });

    const buttonContainer = document.getElementById('google-signin-button-container');
    if (buttonContainer) {
        google.accounts.id.renderButton(
            buttonContainer,
            { theme: "filled_blue", size: "large", type: 'standard', text: 'signin_with', shape: 'rectangular', logo_alignment: 'left' }
        );
    } else {
        console.error("Sign-in button container not found.");
    }
}

/**
 * Displays an error message on the sign-in screen.
 * @param {string} message - The message to display.
 */
function blockAccess(message) {
    const errorContainer = document.getElementById('auth-error-message');
    if (errorContainer) {
        errorContainer.textContent = message;
    }
}

/**
 * Decodes a JWT token from Google to extract user information.
 * @param {string} token - The JWT credential string.
 * @returns {object} - The decoded user object.
 */
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding JWT", e);
        return {};
    }
}
