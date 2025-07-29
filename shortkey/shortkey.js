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
        this._shortcuts[key.trim()] = value.trim();
        this._saveShortcuts();
    }

    removeShortcut(key) {
        delete this._shortcuts[key];
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

        for (const key in this._shortcuts) {
            const trigger = key + ' ';
            if (text.endsWith(trigger)) {
                this._isExpanding = true;
                
                // **CAMBIO:** La expansión ya no añade un espacio extra al final.
                const expansion = this._shortcuts[key];
                const newText = text.substring(0, text.length - trigger.length) + expansion;
                
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

    // --- Lógica para manejar el Modal de Configuración ---
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
            listContainer.innerHTML = `<p class="text-gray-500 text-center">No tienes shortkeys guardados.</p>`;
            return;
        }

        for (const key in shortcuts) {
            const value = shortcuts[key];
            const item = document.createElement('div');
            // **CAMBIO:** Se usan las clases del CSS personalizado
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
    
    // Event Listeners para los botones
    if (openBtn) {
        openBtn.addEventListener('click', openModal);
    }
    closeBtn.addEventListener('click', closeModal);
    // **NUEVO:** El overlay ahora también cierra el modal.
    overlay.addEventListener('click', closeModal);

    // Atajo de teclado global
    document.addEventListener('keydown', (event) => {
        // **NUEVO:** Añadido listener para la tecla Escape
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

    // Añadir nuevo shortkey
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        shortkeyManager.addShortcut(keyInput.value, valueInput.value);
        keyInput.value = '';
        valueInput.value = '';
        renderShortcuts();
    });

    // Eliminar un shortkey
    listContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const key = e.target.dataset.key;
            shortkeyManager.removeShortcut(key);
            renderShortcuts();
        }
    });
});
