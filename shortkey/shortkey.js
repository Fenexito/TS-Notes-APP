/**
 * Clase Shortkey
 * Encapsula toda la lógica para crear, gestionar y aplicar expansiones de texto.
 * Usa localStorage para persistir los datos en el navegador del usuario.
 */
class Shortkey {
    constructor() {
        this._shortcuts = {};
        this._loadShortcuts();
    }

    _loadShortcuts() {
        const saved = localStorage.getItem('userShortkeys');
        if (saved) {
            this._shortcuts = JSON.parse(saved);
        } else {
            // Datos de ejemplo si no hay nada guardado.
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
        // Siempre guardamos la abreviatura en minúsculas para evitar duplicados.
        this._shortcuts[key.trim().toLowerCase()] = value.trim();
        this._saveShortcuts();
    }

    removeShortcut(key) {
        // Buscamos la abreviatura en minúsculas para borrarla.
        delete this._shortcuts[key.toLowerCase()];
        this._saveShortcuts();
    }

    getShortcuts() {
        return this._shortcuts;
    }

    /**
     * "Engancha" el expansor a un elemento de input o textarea.
     * CAMBIO: Ahora escucha el evento 'keydown' para tener más control.
     */
    attach(element) {
        if (element) {
            element.addEventListener('keydown', this._handleKeydown.bind(this));
        }
    }

    /**
     * CORRECCIÓN PRINCIPAL: Nueva lógica de manejo de shortkeys.
     * Se activa al presionar la barra espaciadora y revisa solo la palabra anterior.
     * Esto es mucho más preciso y eficiente.
     */
    _handleKeydown(event) {
        // Solo nos interesa el evento de la barra espaciadora.
        if (event.key !== ' ') {
            return;
        }

        const element = event.target;
        const text = element.value;
        const cursorPosition = element.selectionStart;

        // Extraemos el texto que está justo antes del cursor.
        const textBeforeCursor = text.substring(0, cursorPosition);
        
        // Buscamos el inicio de la última palabra (el último espacio o el principio del texto).
        const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
        const wordStartIndex = lastSpaceIndex + 1;
        
        // Aislamos la palabra que podría ser nuestra abreviatura.
        const potentialShortcut = textBeforeCursor.substring(wordStartIndex).toLowerCase();

        // Comprobamos si la palabra existe en nuestro diccionario de shortkeys.
        if (this._shortcuts.hasOwnProperty(potentialShortcut)) {
            // ¡Coincidencia! Prevenimos que se escriba el espacio.
            event.preventDefault();

            const expansion = this._shortcuts[potentialShortcut];
            const textAfterCursor = text.substring(cursorPosition);
            
            // Reconstruimos el texto: [texto antes de la palabra] + [expansión] + [texto después del cursor]
            const newText = text.substring(0, wordStartIndex) + expansion + textAfterCursor;
            
            element.value = newText;
            
            // Movemos el cursor al final del texto que acabamos de insertar.
            const newCursorPosition = wordStartIndex + expansion.length;
            element.selectionStart = element.selectionEnd = newCursorPosition;
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
        keyInput.focus();
    });

    listContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const key = e.target.dataset.key;
            shortkeyManager.removeShortcut(key);
            renderShortcuts();
        }
    });
});
