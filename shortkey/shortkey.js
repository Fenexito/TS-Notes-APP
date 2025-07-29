/**
 * Clase Shortkey
 * Encapsula toda la lógica para crear, gestionar y aplicar expansiones de texto.
 * CAMBIO: Ahora usa un array para mantener un orden específico.
 */
class Shortkey {
    constructor() {
        this._shortcuts = []; // Ahora es un array de objetos: [{key: '...', value: '...'}]
        this._isEditingKey = null;
        this._loadShortcuts();
    }

    _loadShortcuts() {
        const saved = localStorage.getItem('userShortkeys');
        if (saved) {
            let data = JSON.parse(saved);
            // Migración automática desde el formato antiguo (objeto) al nuevo (array)
            if (!Array.isArray(data)) {
                console.log('[Shortkey] Migrando datos al nuevo formato ordenado.');
                this._shortcuts = Object.entries(data).map(([key, value]) => ({ key, value }));
                this._saveShortcuts();
            } else {
                this._shortcuts = data;
            }
        } else {
            this._shortcuts = [
                { key: 'sds', value: 'Saludos cordiales,' },
                { key: 'asap', value: 'tan pronto como sea posible' }
            ];
            this._saveShortcuts();
        }
    }

    _saveShortcuts() {
        localStorage.setItem('userShortkeys', JSON.stringify(this._shortcuts));
    }

    getShortcuts() { return this._shortcuts; }
    getIsEditingKey() { return this._isEditingKey; }
    setIsEditingKey(key) { this._isEditingKey = key; }

    addShortcut(key, value) {
        if (!key || !value) return { success: false, error: 'empty' };
        const cleanKey = key.trim().toLowerCase();
        if (this._shortcuts.some(s => s.key === cleanKey)) {
            return { success: false, error: 'duplicate', key: cleanKey };
        }
        this._shortcuts.push({ key: cleanKey, value: value.trim() });
        this._saveShortcuts();
        return { success: true };
    }
    
    updateShortcut(oldKey, newKey, value) {
        if (!newKey || !value) return { success: false, error: 'empty' };
        const cleanNewKey = newKey.trim().toLowerCase();
        const existingShortcut = this._shortcuts.find(s => s.key === cleanNewKey);
        if (existingShortcut && existingShortcut.key !== oldKey) {
            return { success: false, error: 'duplicate', key: cleanNewKey };
        }
        
        const itemIndex = this._shortcuts.findIndex(s => s.key === oldKey);
        if (itemIndex > -1) {
            this._shortcuts[itemIndex] = { key: cleanNewKey, value: value.trim() };
            this._saveShortcuts();
            this.setIsEditingKey(null);
            return { success: true };
        }
        return { success: false, error: 'notfound' };
    }

    removeShortcut(key) {
        this._shortcuts = this._shortcuts.filter(s => s.key !== key.toLowerCase());
        this._saveShortcuts();
    }
    
    /**
     * NUEVO: Mueve un shortkey hacia arriba o hacia abajo en la lista.
     */
    moveShortcut(key, direction) {
        const index = this._shortcuts.findIndex(s => s.key === key);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            // Intercambia con el elemento anterior
            [this._shortcuts[index - 1], this._shortcuts[index]] = [this._shortcuts[index], this._shortcuts[index - 1]];
        } else if (direction === 'down' && index < this._shortcuts.length - 1) {
            // Intercambia con el elemento siguiente
            [this._shortcuts[index + 1], this._shortcuts[index]] = [this._shortcuts[index], this._shortcuts[index + 1]];
        }
        this._saveShortcuts();
    }

    attach(selectorOrElement) {
        const elements = typeof selectorOrElement === 'string'
            ? document.querySelectorAll(selectorOrElement)
            : [selectorOrElement];
        elements.forEach(element => {
            if (element && typeof element.addEventListener === 'function') {
                element.addEventListener('keydown', this._handleKeydown.bind(this));
            }
        });
    }

    _handleKeydown(event) {
        if (event.key !== ' ') return;
        const element = event.target;
        const cursorPosition = element.selectionStart;
        if (cursorPosition === 0) return;
        const textBeforeCursor = element.value.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        if (lastAtIndex === -1 || textBeforeCursor.substring(lastAtIndex).includes(' ')) {
            return;
        }
        const potentialShortcut = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase();
        
        // La búsqueda ahora se hace sobre el array
        const shortcut = this._shortcuts.find(s => s.key === potentialShortcut);

        if (shortcut) {
            event.preventDefault();
            const expansion = shortcut.value + ' ';
            const textAfterCursor = element.value.substring(cursorPosition);
            const newText = element.value.substring(0, lastAtIndex) + expansion + textAfterCursor;
            element.value = newText;
            const newCursorPosition = lastAtIndex + expansion.length;
            element.selectionStart = element.selectionEnd = newCursorPosition;
        }
    }
}

/**
 * Lógica de la Aplicación
 */
document.addEventListener('DOMContentLoaded', () => {
    console.info('[Shortkey] Módulo cargado y listo.');
    const shortkeyManager = new Shortkey();
    shortkeyManager.attach('.shortkey-enabled');

    // --- Elementos del DOM ---
    const modal = document.getElementById('settingsModal');
    const openBtn = document.getElementById('openSettingsBtn');
    const closeBtn = document.getElementById('closeSettingsBtn');
    const overlay = document.getElementById('modalOverlay');
    const addForm = document.getElementById('addShortcutForm');
    const keyInput = document.getElementById('shortcutKeyInput');
    const valueInput = document.getElementById('shortcutValueInput');
    const listContainer = document.getElementById('shortcutsList');
    const notification = document.getElementById('shortcut-notification');
    const formTitle = document.getElementById('form-title');
    const submitButton = document.getElementById('submit-button');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const exportButton = document.getElementById('export-button');
    const importButton = document.getElementById('import-button');
    const importFileInput = document.getElementById('import-file-input');
    
    // --- Funciones de la UI ---
    const openModal = () => modal.classList.add('visible');
    const closeModal = () => {
        cancelEditing();
        modal.classList.remove('visible');
    };

    const showNotification = (message, type = 'error') => {
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        setTimeout(() => notification.classList.remove('show'), 3000);
    };

    const highlightShortcut = (key) => {
        const item = document.querySelector(`.shortcut-item[data-key="${key}"]`);
        if (item) {
            item.classList.add('highlight');
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => item.classList.remove('highlight'), 2000);
        }
    };

    const startEditing = (key) => {
        const shortcut = shortkeyManager.getShortcuts().find(s => s.key === key);
        if (!shortcut) return;
        shortkeyManager.setIsEditingKey(key);
        keyInput.value = shortcut.key;
        valueInput.value = shortcut.value;
        formTitle.textContent = 'Editar Shortkey';
        submitButton.textContent = 'Guardar Cambios';
        cancelEditButton.classList.remove('hidden');
        keyInput.focus();
    };

    const cancelEditing = () => {
        shortkeyManager.setIsEditingKey(null);
        addForm.reset();
        formTitle.textContent = 'Añadir Nuevo Shortkey';
        submitButton.textContent = 'Añadir';
        cancelEditButton.classList.add('hidden');
    };

    const renderShortcuts = () => {
        listContainer.innerHTML = '';
        const shortcuts = shortkeyManager.getShortcuts();
        if (shortcuts.length === 0) {
            listContainer.innerHTML = `<p style="text-align: center; color: #6b7280; padding: 1rem;">No tienes shortkeys guardados.</p>`;
            return;
        }
        shortcuts.forEach((shortcut, index) => {
            const { key, value } = shortcut;
            const item = document.createElement('div');
            item.className = 'shortcut-item';
            item.dataset.key = key;
            item.innerHTML = `
                <div class="shortcut-reorder">
                    <button class="action-btn move-up-btn" title="Mover arriba" ${index === 0 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                    </button>
                    <button class="action-btn move-down-btn" title="Mover abajo" ${index === shortcuts.length - 1 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </button>
                </div>
                <div class="shortcut-details">
                    <span class="shortcut-key">@${key}</span>
                    <span class="shortcut-arrow">→</span>
                    <span class="shortcut-value">${value}</span>
                </div>
                <div class="shortcut-actions">
                    <button class="action-btn edit-btn" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                    </button>
                    <button class="action-btn delete-btn" title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                </div>`;
            listContainer.appendChild(item);
        }
    };

    // --- Event Listeners ---
    if (openBtn) openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    cancelEditButton.addEventListener('click', cancelEditing);

    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const editingKey = shortkeyManager.getIsEditingKey();
        const result = editingKey
            ? shortkeyManager.updateShortcut(editingKey, keyInput.value, valueInput.value)
            : shortkeyManager.addShortcut(keyInput.value, valueInput.value);

        if (result.success) {
            cancelEditing();
            renderShortcuts();
        } else if (result.error === 'duplicate') {
            showNotification(`El shortkey "@${result.key}" ya existe.`);
            highlightShortcut(result.key);
        }
    });

    listContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        const item = target.closest('.shortcut-item');
        const key = item ? item.dataset.key : null;

        if (target.classList.contains('edit-btn')) {
            startEditing(key);
        } else if (target.classList.contains('delete-btn')) {
            item.innerHTML = `
                <div class="delete-confirmation">
                    <span>¿Eliminar "@${key}"?</span>
                    <div>
                        <button class="confirm-yes" data-key="${key}">Sí</button>
                        <button class="confirm-no">No</button>
                    </div>
                </div>`;
        } else if (target.classList.contains('confirm-yes')) {
            shortkeyManager.removeShortcut(target.dataset.key);
            renderShortcuts();
        } else if (target.classList.contains('confirm-no')) {
            renderShortcuts();
        } else if (target.classList.contains('move-up-btn')) {
            shortkeyManager.moveShortcut(key, 'up');
            renderShortcuts();
        } else if (target.classList.contains('move-down-btn')) {
            shortkeyManager.moveShortcut(key, 'down');
            renderShortcuts();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('visible')) closeModal();
        if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
            e.preventDefault();
            modal.classList.contains('visible') ? closeModal() : openModal();
        }
    });

    // Import/Export
    exportButton.addEventListener('click', () => {
        const shortcuts = shortkeyManager.getShortcuts();
        if (shortcuts.length === 0) {
            showNotification('No hay shortkeys para exportar.', 'error');
            return;
        }
        const dataStr = JSON.stringify(shortcuts, null, 2);
        const dataBlob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.download = 'shortkeys_backup.json';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    });

    importButton.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                const shortcutsToImport = Array.isArray(importedData)
                    ? importedData
                    : Object.entries(importedData).map(([key, value]) => ({ key, value }));

                let addedCount = 0;
                shortcutsToImport.forEach(({key, value}) => {
                    const result = shortkeyManager.addShortcut(key, value);
                    if (result.success) addedCount++;
                });
                renderShortcuts();
                showNotification(`${addedCount} shortkey(s) importado(s) con éxito.`, 'success');
            } catch (error) {
                showNotification('Error: El archivo no es un JSON válido.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // Carga inicial
    renderShortcuts();
});
