/**
 * @file auth.js
 * @summary Manages user authentication using a 6-digit verification code sent via email.
 */

// --- LISTA DE CORREOS AUTORIZADOS ---
const authorizedEmails = [
    'alex.vanhoutven.g38@gmail.com',
    'menfil.tovar@telusinternational.com',
    'otro.colega@example.com'
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
        <style>
            #auth-overlay-container { 
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background-color: #1e1e1e; 
                display: flex; justify-content: center; align-items: center; 
                z-index: 9999; 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                text-align: center; 
                transition: opacity 0.3s ease-in;
            }
            .auth-container { display: flex; flex-direction: column; align-items: center; padding: 40px; border-radius: 12px; background-color: #2a2a2a; box-shadow: 0 6px 20px rgba(0,0,0,0.5); border: 1px solid #444; width: 320px; box-sizing: border-box; }
            .auth-container h1 { color: #fff; margin-top: 0; font-size: 1.8em; }
            .auth-container p { color: #ccc; margin-bottom: 25px; }
            .auth-container .input-field { width: 100%; box-sizing: border-box; padding: 12px; margin-bottom: 20px; border-radius: 6px; border: 1px solid #555; background-color: #333; color: #fff; font-size: 1em; text-align: center; }
            .auth-container .submit-btn { width: 100%; padding: 12px; border: none; border-radius: 6px; background-color: #007bff; color: white; font-size: 1em; cursor: pointer; }
            .auth-container .submit-btn:disabled { background-color: #555; cursor: not-allowed; }
            .auth-container .auth-message { margin-top: 20px; font-size: 0.9em; min-height: 20px; }
            .auth-container .code-input-container { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
            .auth-container .code-input { width: 40px; height: 50px; font-size: 1.5em; text-align: center; border-radius: 6px; border: 1px solid #555; background-color: #333; color: #fff; caret-color: #007bff; }
            .auth-container .code-input:focus { outline: none; border-color: #007bff; box-shadow: 0 0 5px #007bff; }
        </style>
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
        <input type="email" id="email-input" class="input-field" placeholder="your.name@company.com" />
        <button id="submit-email-btn" class="submit-btn">Send Code</button>
        <div class="auth-message" style="color: #ff4d4d;">${errorMessage || ''}</div>
    `;
    renderAuthContainer('APad Access', formHtml);

    const submitButton = document.getElementById('submit-email-btn');
    const emailInput = document.getElementById('email-input');
    const messageDiv = document.querySelector('.auth-message');

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
                    } catch (e) { /* Response might not be JSON, ignore */ }
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
            messageDiv.textContent = 'This email address is not authorized.';
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
        <button id="verify-code-btn" class="submit-btn">Verify</button>
        <div class="auth-message" style="color: #ff4d4d;"></div>
    `;
    renderAuthContainer('Check your Email', formHtml);

    const codeInputs = document.querySelectorAll('.code-input');
    const verifyButton = document.getElementById('verify-code-btn');
    const messageDiv = document.querySelector('.auth-message');
    const codeContainer = document.querySelector('.code-input-container');

    codeInputs[0].focus();

    codeContainer.addEventListener('input', e => {
        const target = e.target;
        if (target.value && target.dataset.index < 5) {
            codeInputs[parseInt(target.dataset.index) + 1].focus();
        }
    });

    codeContainer.addEventListener('keydown', e => {
        const target = e.target;
        const index = parseInt(target.dataset.index);
        if (e.key === 'Backspace' && !target.value && index > 0) {
            codeInputs[index - 1].focus();
        }
    });
    
    codeContainer.addEventListener('paste', e => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pasteData)) {
            pasteData.split('').forEach((char, i) => codeInputs[i].value = char);
            codeInputs[5].focus();
        }
    });

    verifyButton.addEventListener('click', async () => {
        const tempToken = JSON.parse(sessionStorage.getItem(TEMP_TOKEN_KEY));
        const enteredCode = Array.from(codeInputs).map(input => input.value).join('');

        if (!tempToken || enteredCode.length !== 6) {
            messageDiv.textContent = 'Please enter the complete 6-digit code.';
            return;
        }

        if (new Date().getTime() > tempToken.expiresAt) {
            messageDiv.textContent = 'The verification code has expired.';
            setTimeout(() => renderEmailPromptScreen(resolve, 'Your previous code expired. Please request a new one.'), 2000);
            return;
        }

        if (tempToken.code === enteredCode) {
            verifyButton.disabled = true;
            verifyButton.textContent = 'Verifying...';
            
            const session = { 
                email: tempToken.email, 
                expiresAt: new Date().getTime() + (16 * 60 * 60 * 1000) // 16-hour session
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
    });
}
