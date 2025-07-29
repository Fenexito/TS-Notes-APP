/**
 * Clase Shortkey
 * Encapsula toda la lógica para crear, gestionar y aplicar expansiones de texto.
 * Usa localStorage para persistir los datos en el navegador del usuario.
 */
class Shortkey {
    constructor() {
        this._shortcuts = {};
        this._isExpanding = false;
        this._loadShortcuts();
    }

    _loadShortcuts() {
        const saved = localStorage.getItem('userShortkeys');
        if (saved) {
            this._shortcuts = JSON.parse(saved);
        } else {
            this._shortcuts = {
                'sds': 'Saludos cordiales,',
                'atte': 'Atentamente,',
                'asap': 'tan pronto como sea posible'
            };
            this._saveShortcuts();
        }
    }

    _saveShortcuts() {
        localStorage.setItem('userShortkeys', JSON.stringify(this._shortcuts));
    }

    addShortcut(key, value) {
        if (!key || !value) return;
        this._shortcuts[key.trim().toLowerCase()] = value.trim(); // Guardar la llave en minúsculas
        this._saveShortcuts();
    }

    removeShortcut(key) {
        delete this._shortcuts[key.toLowerCase()];
        this._saveShortcuts();
    }

    getShortcuts() {
        return this._shortcuts;
    }

    attach(element) {
        if (element) {
            element.addEventListener('input', this._handleInput.bind(this));
        }
    }

    _handleInput(event) {
        if (this._isExpanding) return;

        const element = event.target;
        const text = element.value;

        // **CAMBIO CLAVE:** Se convierte el texto a minúsculas para la comparación.
        const textForCheck = text.toLowerCase();

        for (const key in this._shortcuts) {
            const trigger = key + ' '; // El disparador siempre es en minúsculas
            if (textForCheck.endsWith(trigger)) {
                this._isExpanding = true;
                
                const expansion = this._shortcuts[key];
                // Se busca la posición del disparador en el texto original para reemplazarlo
                const triggerStartIndex = textForCheck.lastIndexOf(trigger);
                const newText = text.substring(0, triggerStartIndex) + expansion;
                
                element.value = newText;
                
                element.selectionStart = element.selectionEnd = newText.length;
                
                this._isExpanding = false;
                break;
            }
        }
    }
}

/**
 * Lógica de la Aplicación
 * Este es el "pegamento" que conecta la UI (HTML) con el módulo Shortkey.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    const shortkeyManager = new Shortkey();

    const editorConShortkeys = document.getElementById('editorConShortkeys');
    shortkeyManager.attach(editorConShortkeys);

    const modal = document.getElementById('settingsModal');
    const openBtn = document.getElementById('openSettingsBtn');
    const closeBtn = document.getElementById('closeSettingsBtn');
    const overlay = document.getElementById('modalOverlay');
    const addForm = document.getElementById('addShortcutForm');
    const keyInput = document.getElementById('shortcutKeyInput');
    const valueInput = document.getElementById('shortcutValueInput');
    const listContainer = document.getElementById('shortcutsList');

    const openModal = () => {
        renderShortcuts();
        modal.classList.add('visible');
    };

    const closeModal = () => {
        modal.classList.remove('visible');
    };
    
    const renderShortcuts = () => {
        listContainer.innerHTML = '';
        const shortcuts = shortkeyManager.getShortcuts();

        if (Object.keys(shortcuts).length === 0) {
            listContainer.innerHTML = `<p style="text-align: center; color: #6b7280;">No tienes shortkeys guardados.</p>`;
            return;
        }

        for (const key in shortcuts) {
            const value = shortcuts[key];
            const item = document.createElement('div');
            item.className = 'shortcut-item';
            item.innerHTML = `
                <div>
                    <span class="shortcut-key">${key}</span>
                    <span class="shortcut-arrow">→</span>
                    <span class="shortcut-value">${value}</span>
                </div>
                <button data-key="${key}" class="delete-btn">&times;</button>
            `;
            listContainer.appendChild(item);
        }
    };
    
    if (openBtn) {
        openBtn.addEventListener('click', openModal);
    }
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('visible')) {
            closeModal();
        }

        if (event.ctrlKey && event.shiftKey && (event.key === 'S' || event.key === 's')) {
            event.preventDefault();
            if (modal.classList.contains('visible')) {
                closeModal();
            } else {
                openModal();
            }
        }
    });

    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        shortkeyManager.addShortcut(keyInput.value, valueInput.value);
        keyInput.value = '';
        valueInput.value = '';
        renderShortcuts();
        keyInput.focus(); // Pone el foco de nuevo en el primer input.
    });

    listContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const key = e.target.dataset.key;
            shortkeyManager.removeShortcut(key);
            renderShortcuts();
        }
    });
});
