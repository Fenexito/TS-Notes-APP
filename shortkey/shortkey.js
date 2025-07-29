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

    // Carga los shortkeys desde el almacenamiento local del navegador.
    _loadShortcuts() {
        const saved = localStorage.getItem('userShortkeys');
        if (saved) {
            this._shortcuts = JSON.parse(saved);
        } else {
            // Si no hay datos, creamos unos de ejemplo.
            this._shortcuts = {
                'sds': 'Saludos cordiales,',
                'atte': 'Atentamente,',
                'asap': 'tan pronto como sea posible'
            };
            this._saveShortcuts();
        }
    }

    // Guarda los shortkeys actuales en el almacenamiento local.
    _saveShortcuts() {
        localStorage.setItem('userShortkeys', JSON.stringify(this._shortcuts));
    }

    // Añade un nuevo shortkey y lo guarda.
    addShortcut(key, value) {
        if (!key || !value) return;
        this._shortcuts[key.trim()] = value.trim();
        this._saveShortcuts();
    }

    // Elimina un shortkey y guarda los cambios.
    removeShortcut(key) {
        delete this._shortcuts[key];
        this._saveShortcuts();
    }

    // Devuelve todos los shortkeys para mostrarlos en la UI.
    getShortcuts() {
        return this._shortcuts;
    }

    // "Engancha" el expansor a un elemento de input o textarea.
    attach(element) {
        if (element) {
            element.addEventListener('input', this._handleInput.bind(this));
        }
    }

    // El manejador principal que se ejecuta cada vez que el usuario escribe.
    _handleInput(event) {
        if (this._isExpanding) return;

        const element = event.target;
        const text = element.value;

        for (const key in this._shortcuts) {
            const trigger = key + ' ';
            if (text.endsWith(trigger)) {
                this._isExpanding = true;
                
                const expansion = this._shortcuts[key] + ' ';
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

    // **CAMBIO:** Funciones para abrir/cerrar usando una clase CSS para las animaciones.
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
            item.className = 'flex justify-between items-center bg-gray-100 p-3 rounded-md';
            item.innerHTML = `
                <div>
                    <span class="font-mono bg-gray-200 text-gray-700 py-1 px-2 rounded-md">${key}</span>
                    <span class="text-gray-500 mx-2">→</span>
                    <span class="text-gray-800">${value}</span>
                </div>
                <button data-key="${key}" class="delete-btn text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
            `;
            listContainer.appendChild(item);
        }
    };
    
    // Event Listeners para los botones
    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // **NUEVO:** Atajo de teclado global para abrir/cerrar el modal.
    document.addEventListener('keydown', (event) => {
        // Comprobamos la combinación CTRL + SHIFT + S
        if (event.ctrlKey && event.shiftKey && (event.key === 'S' || event.key === 's')) {
            // Prevenimos la acción por defecto del navegador (como "Guardar página")
            event.preventDefault();
            
            // Si el modal está visible, lo cerramos. Si no, lo abrimos.
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
