/**
 * @file auth.js
 * @summary Manages user authentication using a 6-digit verification code sent via email.
 * @description Includes UX improvements: Enter to submit email and auto-verify on code completion.
 */

// --- LISTA DE CORREOS AUTORIZADOS ---
const authorizedEmails = [
    'alex.vanhoutven.g38@gmail.com',
    'menfil.tovarvanhoutven@telus.com',
    'diego.cotzojayquiran@telus.com',
];

const SESSION_KEY = 'userAuthSession';
const TEMP_TOKEN_KEY = 'tempAuthToken';
const CODE_EXPIRATION_MINUTES = 10;

export async function initializeAuth() {
    return new Promise((resolve) => {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (session && session.email && new Date().getTime() < session.expiresAt) {
            resolve(true);
            return;
        }
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(TEMP_TOKEN_KEY);
        renderEmailPromptScreen(resolve);
    });
}

function removeAuthOverlay() {
    return new Promise(resolve => {
        const overlay = document.getElementById('auth-overlay-container');
        if (overlay) {
            overlay.style.transition = 'opacity 0.3s ease-out';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                resolve();
            }, 300);
        } else {
            resolve();
        }
    });
}

function renderAuthContainer(title, formHtml) {
    const existingOverlay = document.getElementById('auth-overlay-container');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay-container';
    overlay.style.opacity = '0';
    overlay.innerHTML = `
        <div id="auth-form-container" class="auth-container">
            <h1>${title}</h1>
            ${formHtml}
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.style.opacity = '1', 10);
}

function renderEmailPromptScreen(resolve, errorMessage = null) {
    const formHtml = `
        <p>Enter your authorized email address to receive a verification code.</p>
        <input type="email" id="email-input" class="input-field" placeholder="your.name@telus.com" />
        <button id="submit-email-btn" class="submit-btn">SEND CODE</button>
        <div class="auth-message" style="color: #ff4d4d;">${errorMessage || ''}</div>
    `;
    renderAuthContainer('APad - NoteApp Access', formHtml);

    const submitButton = document.getElementById('submit-email-btn');
    const emailInput = document.getElementById('email-input');
    const messageDiv = document.querySelector('.auth-message');

    // NUEVA FUNCIÓN: Activar el botón con la tecla Enter.
    emailInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevenir el comportamiento por defecto del formulario.
            submitButton.click();
        }
    });

    submitButton.addEventListener('click', async () => {
        const email = emailInput.value.toLowerCase().trim();
        if (!email) return;

        if (authorizedEmails.includes(email)) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            messageDiv.textContent = '';

            try {
                const response = await fetch('/.netlify/functions/send-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email }),
                });

                if (!response.ok) {
                    let errorDetails = `Server responded with status ${response.status}.`;
                    try {
                        const errorJson = await response.json();
                        errorDetails = errorJson.error || errorDetails;
                    } catch (e) { /* La respuesta podría no ser JSON, se ignora */ }
                    throw new Error(errorDetails);
                }

                const data = await response.json();
                const { code } = data;

                sessionStorage.setItem(TEMP_TOKEN_KEY, JSON.stringify({
                    email,
                    code,
                    expiresAt: new Date().getTime() + (CODE_EXPIRATION_MINUTES * 60 * 1000)
                }));
                
                renderCodeInputScreen(email, resolve);

            } catch (error) {
                console.error('Failed to send code:', error);
                messageDiv.textContent = `Failed to send code. Please try again. (${error.message})`;
                submitButton.disabled = false;
                submitButton.textContent = 'Send Code';
            }

        } else {
            messageDiv.textContent = 'This email address is not authorized. Please contact APad admin to request access.';
        }
    });
}

function renderCodeInputScreen(email, resolve) {
    const formHtml = `
        <p>A 6-digit verification code has been sent to <strong>${email}</strong>.</p>
        <p style="font-size:0.8em; color: #888; margin-top: -15px; margin-bottom: 25px;">(If you don't see it, check your spam folder)</p>
        <div class="code-input-container">
            ${Array.from({ length: 6 }).map((_, i) => `<input type="text" class="code-input" maxlength="1" data-index="${i}" />`).join('')}
        </div>
        <button id="verify-code-btn" class="submit-btn" style="display: none;">Verify</button>
        <div class="auth-message" style="color: #ff4d4d;"></div>
    `;
    renderAuthContainer('Check your Email', formHtml);

    const codeInputs = document.querySelectorAll('.code-input');
    const verifyButton = document.getElementById('verify-code-btn');
    const messageDiv = document.querySelector('.auth-message');
    const codeContainer = document.querySelector('.code-input-container');

    codeInputs[0].focus();

    // Lógica de verificación extraída para poder ser llamada desde varios eventos.
    const handleVerification = async () => {
        const tempToken = JSON.parse(sessionStorage.getItem(TEMP_TOKEN_KEY));
        const enteredCode = Array.from(codeInputs).map(input => input.value).join('');

        if (!tempToken || enteredCode.length !== 6) {
            // No mostrar mensaje si el código no está completo, ya que se autoejecuta.
            return;
        }

        if (new Date().getTime() > tempToken.expiresAt) {
            messageDiv.textContent = 'The verification code has expired.';
            setTimeout(() => renderEmailPromptScreen(resolve, 'Your previous code expired. Please request a new one.'), 2000);
            return;
        }

        if (tempToken.code === enteredCode) {
            // Deshabilitar inputs para prevenir más entradas.
            codeInputs.forEach(input => input.disabled = true);
            messageDiv.style.color = '#28a745'; // Color de éxito
            messageDiv.textContent = 'Success! Accessing...';
            
            const session = { 
                email: tempToken.email, 
                expiresAt: new Date().getTime() + (16 * 60 * 60 * 1000) // Sesión de 16 horas
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            sessionStorage.removeItem(TEMP_TOKEN_KEY);

            await removeAuthOverlay();
            resolve(true); 
        } else {
            messageDiv.textContent = 'Invalid verification code.';
            codeInputs.forEach(input => input.value = '');
            codeInputs[0].focus();
        }
    };
    
    // El botón ahora solo llama a la función de manejo.
    verifyButton.addEventListener('click', handleVerification);

    codeContainer.addEventListener('input', e => {
        const target = e.target;
        const index = parseInt(target.dataset.index);

        if (target.value && index < 5) {
            codeInputs[index + 1].focus();
        }

        // NUEVA FUNCIÓN: Verificar automáticamente al llenar el último campo.
        if (Array.from(codeInputs).every(input => input.value)) {
            handleVerification();
        }
    });

    codeContainer.addEventListener('keydown', e => {
        const target = e.target;
        const index = parseInt(target.dataset.index);
        if (e.key === 'Backspace' && !target.value && index > 0) {
            codeInputs[index - 1].focus();
        }
    });
    
    // NUEVA FUNCIÓN: Verificar automáticamente al pegar un código completo.
    codeContainer.addEventListener('paste', e => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pasteData)) {
            pasteData.split('').forEach((char, i) => codeInputs[i].value = char);
            codeInputs[5].focus();
            handleVerification(); // Llamar a la verificación inmediatamente.
        }
    });
}
