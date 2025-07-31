/**
 * Clase para manejar los pop-ups de interacción y búsqueda.
 */
class PopupManager {
    constructor(element, onSelect) {
        this.element = element;
        this.onSelect = onSelect;
        this.popup = null;
        this.items = [];
        this.selectedIndex = -1;
        this._boundHandleKeydown = this._handleKeydown.bind(this);
        this._boundHandleClick = this._handleClick.bind(this);
    }

    show(items, type, prompt = null) {
        this.items = items;
        this.selectedIndex = 0;
        this.popup = document.getElementById(type === 'search' ? 'shortkey-search-popup' : 'shortkey-interaction-popup');
        
        let content = prompt ? `<div class="popup-prompt">${prompt}</div>` : '';
        items.forEach((item, index) => {
            if (type === 'search') {
                content += `<button class="popup-option" data-index="${index}" data-key="${item.key}">
                    <span class="search-key">@${item.key}</span>
                    <span class="search-desc">${item.description}</span>
                </button>`;
            } else {
                content += `<button class="popup-option" data-index="${index}" data-value="${item.value}" data-next="${item.nextStep}">${item.label}</button>`;
            }
        });
        this.popup.innerHTML = content;
        
        this.positionPopup();
        this.popup.classList.add('visible');
        this.updateSelected();
        
        document.addEventListener('keydown', this._boundHandleKeydown, true);
        document.addEventListener('click', this._boundHandleClick, true);
    }

    destroy() {
        if (!this.popup) return;
        this.popup.classList.remove('visible');
        this.popup.innerHTML = '';
        this.popup = null;
        document.removeEventListener('keydown', this._boundHandleKeydown, true);
        document.removeEventListener('click', this._boundHandleClick, true);
    }

    positionPopup() {
        const textarea = this.element;
        const cursorPosition = textarea.selectionStart;

        const div = document.createElement('div');
        document.body.appendChild(div);
        
        const style = window.getComputedStyle(textarea);
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'textTransform', 'wordSpacing', 'paddingLeft', 'paddingTop', 'borderLeftWidth', 'borderTopWidth'].forEach(prop => {
            div.style[prop] = style[prop];
        });
        div.style.width = style.width;

        div.textContent = textarea.value.substring(0, cursorPosition);
        const span = document.createElement('span');
        span.textContent = '.';
        div.appendChild(span);

        const { left: areaLeft, top: areaTop } = textarea.getBoundingClientRect();
        const { offsetLeft: spanLeft, offsetTop: spanTop, offsetHeight: spanHeight } = span;
        
        document.body.removeChild(div);

        const popupTop = areaTop + spanTop + spanHeight;
        let popupLeft = areaLeft + spanLeft;

        const popupWidth = this.popup.offsetWidth || 240;
        const windowWidth = window.innerWidth;

        if (popupLeft + popupWidth > windowWidth - 10) { 
            popupLeft = windowWidth - popupWidth - 10;
        }

        this.popup.style.top = `${popupTop}px`;
        this.popup.style.left = `${popupLeft}px`;
    }

    _handleKeydown(event) {
        if (!this.popup || this.items.length === 0) return;
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault(); event.stopPropagation();
                this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
                this.updateSelected();
                break;
            case 'ArrowUp':
                event.preventDefault(); event.stopPropagation();
                this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
                this.updateSelected();
                break;
            case 'Enter':
            case 'Tab':
                event.preventDefault(); event.stopPropagation();
                this.onSelect(this.items[this.selectedIndex]);
                break;
            case 'Escape':
                event.preventDefault(); event.stopPropagation();
                this.destroy();
                break;
        }
    }
    
    _handleClick(event) {
        if (!this.popup) return;
        const option = event.target.closest('.popup-option');
        if (option && this.popup.contains(option)) {
            this.onSelect(this.items[option.dataset.index]);
        } else {
            this.destroy();
        }
    }

    updateSelected() {
        if (!this.popup) return;
        this.popup.querySelectorAll('.popup-option').forEach((opt, index) => {
            opt.classList.toggle('selected', index === this.selectedIndex);
            if (index === this.selectedIndex) {
                opt.scrollIntoView({ block: 'nearest' });
            }
        });
    }
}

/**
 * Clase principal Shortkey
 */
class Shortkey {
    constructor() {
        this._shortcuts = [];
        this._activePopupManager = null;
        this._currentElement = null;
        this._loadShortcuts();
    }
    
    _loadShortcuts() {
        const saved = localStorage.getItem('userShortkeys');
        if (saved) { this._shortcuts = JSON.parse(saved); }
        else {
            this._shortcuts = [
                { key: 'sds', description: 'Saludos cordiales,', steps: [] },
                { key: 'cxtv', description: 'Flujo de TV.', steps: [ { id: 'issue', type: 'select', options: [ { label: 'stb_no_boot', value: 'tv is not powering on', nextStep: 'result' }, { label: 'recording', value: 'cx cannot record', nextStep: 'recordings' } ] }, { id: 'recordings', type: 'select', options: [ { label: 'rec_list', value: 'cannot see the recording list', nextStep: 'result' }, { label: 'play_rec', value: 'cx cannot play recordings', nextStep: 'result' } ] }, { id: 'result', type: 'template', template: '{issue} {recordings}.' } ] }
            ];
            this._saveShortcuts();
        }
    }
    _saveShortcuts() { localStorage.setItem('userShortkeys', JSON.stringify(this._shortcuts)); }
    getShortcuts() { return this._shortcuts; }
    addShortcut(shortcutData) { this._shortcuts.push(shortcutData); this._saveShortcuts(); }
    updateShortcut(oldKey, shortcutData) { const index = this._shortcuts.findIndex(s => s.key === oldKey); if (index > -1) { this._shortcuts[index] = shortcutData; } else { this.addShortcut(shortcutData); } this._saveShortcuts(); }
    removeShortcut(key) { this._shortcuts = this._shortcuts.filter(s => s.key !== key); this._saveShortcuts(); }
    moveShortcut(key, direction) {
        const index = this._shortcuts.findIndex(s => s.key === key);
        if (index === -1) return;
        if (direction === 'up' && index > 0) { [this._shortcuts[index - 1], this._shortcuts[index]] = [this._shortcuts[index], this._shortcuts[index - 1]]; }
        else if (direction === 'down' && index < this._shortcuts.length - 1) { [this._shortcuts[index + 1], this._shortcuts[index]] = [this._shortcuts[index], this._shortcuts[index + 1]]; }
        this._saveShortcuts();
    }
    
    attach(selectorOrElement) { 
        const elements = typeof selectorOrElement === 'string' ? document.querySelectorAll(selectorOrElement) : [selectorOrElement]; 
        elements.forEach(element => { 
            if (element) {
                element.addEventListener('input', this._handleInput.bind(this)); 
                element.addEventListener('click', () => {
                   if (this._activePopupManager) this._activePopupManager.destroy();
                });
            }
        }); 
    }
    
    _handleInput(event) {
        this._currentElement = event.target;
        const text = this._currentElement.value;
        const cursorPosition = this._currentElement.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex === -1 || textBeforeCursor.substring(lastAtIndex).includes(' ')) {
            if (this._activePopupManager) this._activePopupManager.destroy();
            return;
        }

        const query = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase();
        const filteredShortcuts = this._shortcuts.filter(s => s.key.toLowerCase().startsWith(query));

        if (filteredShortcuts.length > 0) {
            if (!this._activePopupManager || !this._activePopupManager.popup) {
                this._activePopupManager = new PopupManager(this._currentElement, (selected) => this._triggerShortkey(selected.key));
            }
            this._activePopupManager.show(filteredShortcuts, 'search');
        } else {
            if (this._activePopupManager) this._activePopupManager.destroy();
        }
    }

    _triggerShortkey(key) {
        if (this._activePopupManager) {
            this._activePopupManager.destroy();
            this._activePopupManager = null;
        }

        const shortcutData = this._shortcuts.find(s => s.key === key);
        if (!shortcutData) return;

        const isDynamic = shortcutData.steps && shortcutData.steps.length > 0;

        if (isDynamic) {
            this._performReplacement('');
            // CAMBIO: Se eliminó el `prompt` de la llamada
            this._runDynamicFlow(shortcutData, {}, shortcutData.steps[0]);
        } else {
            this._performReplacement(shortcutData.description + ' ');
        }
    }

    _runDynamicFlow(shortkeyData, variables, currentStep) {
        if (!currentStep) return;

        if (currentStep.type === 'select') {
            this._activePopupManager = new PopupManager(this._currentElement, (selectedOption) => {
                if (this._activePopupManager) this._activePopupManager.destroy();
                const newVariables = {...variables, [currentStep.id]: selectedOption.value };
                const nextStep = shortkeyData.steps.find(s => s.id === selectedOption.nextStep);
                this._runDynamicFlow(shortkeyData, newVariables, nextStep);
            });
            // CAMBIO: Se eliminó el `prompt` de la llamada
            this._activePopupManager.show(currentStep.options, 'interaction');
        } else if (currentStep.type === 'template') {
            let finalText = currentStep.template;
            
            for (const varName in variables) {
                finalText = finalText.replace(new RegExp(`{${varName}}`, 'g'), variables[varName]);
            }
            
            finalText = finalText.replace(/ ?\{[a-zA-Z0-9_]+\}/g, '').trim();

            this._insertTextAtCursor(finalText + ' ');
        }
    }
    
    _performReplacement(replacementText) {
        const element = this._currentElement;
        const text = element.value;
        const cursorPosition = element.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPosition);
        const triggerAt = textBeforeCursor.lastIndexOf('@');

        if (triggerAt === -1) {
            this._insertTextAtCursor(replacementText);
            return;
        }

        const newText = text.substring(0, triggerAt) + replacementText + text.substring(cursorPosition);
        element.value = newText;
        const newCursorPosition = triggerAt + replacementText.length;
        element.selectionStart = element.selectionEnd = newCursorPosition;
        element.focus();
    }

    _insertTextAtCursor(textToInsert) {
        const element = this._currentElement;
        const start = element.selectionStart;
        const end = element.selectionEnd;
        const text = element.value;
        element.value = text.substring(0, start) + textToInsert + text.substring(end);
        element.selectionStart = element.selectionEnd = start + textToInsert.length;
        element.focus();
    }
}

/**
 * Lógica de la Aplicación
 */
document.addEventListener('DOMContentLoaded', () => {
    console.info('[Shortkey] Módulo dinámico cargado y listo.');
    const shortkeyManager = new Shortkey();
    shortkeyManager.attach('.shortkey-enabled');

    // --- Selectores del DOM ---
    const modal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettingsBtn');
    const overlay = document.getElementById('modalOverlay');
    const viewList = document.getElementById('view-list');
    const viewEditor = document.getElementById('view-editor');
    const addNewBtn = document.getElementById('add-new-shortkey-btn');
    const editorForm = document.getElementById('shortkey-editor-form');
    const editorKeyInput = document.getElementById('editor-key');
    const editorCancelBtn = document.getElementById('editor-cancel-btn');
    
    const simpleModeView = document.getElementById('simple-mode-view');
    const dynamicModeView = document.getElementById('dynamic-mode-view');
    const editorDescInput = document.getElementById('editor-description');
    const addVarBtnContainer = document.getElementById('add-select-step-btn');
    
    const stepsContainer = document.getElementById('steps-container');
    const templateStepContainer = document.getElementById('template-step-container');
    const livePreviewContainer = document.getElementById('live-preview-container');
    const livePreviewOutput = document.getElementById('live-preview-output');

    // CAMBIO: Selectores para el nuevo modal de confirmación
    const confirmModal = document.getElementById('confirm-modal');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const confirmDiscardBtn = document.getElementById('confirm-discard-btn');
    const confirmSaveBtn = document.getElementById('confirm-save-btn');
    
    let currentEditingKey = null;
    let isDirty = false; // CAMBIO: Flag para cambios sin guardar

    // --- Funciones de control de UI ---
    const openModal = () => {
        showListView();
        modal.classList.add('visible');
    };

    // CAMBIO: Lógica de cierre modificada
    const attemptClose = () => {
        const isEditorVisible = !viewEditor.classList.contains('hidden');
        if (isEditorVisible && isDirty) {
            confirmModal.classList.remove('hidden');
        } else {
            closeModalCleanup();
        }
    };

    const closeModalCleanup = () => {
        modal.classList.remove('visible');
        confirmModal.classList.add('hidden');
        // Si el editor estaba abierto, al cerrar siempre volvemos a la lista
        if (!viewEditor.classList.contains('hidden')) {
            showListView();
        }
    };

    const showListView = () => {
        viewEditor.classList.add('hidden');
        viewList.classList.remove('hidden');
        isDirty = false; // Reseteamos el flag al volver a la lista
        renderShortcuts();
    };

    const showEditorView = (shortcutKey = null) => {
        viewList.classList.add('hidden');
        viewEditor.classList.remove('hidden');
        isDirty = false; // Reseteamos al empezar a editar
        currentEditingKey = shortcutKey;
        buildEditor(shortcutKey);
    };

    const setEditorMode = (mode) => {
        if (mode === 'dynamic') {
            simpleModeView.classList.add('hidden');
            dynamicModeView.classList.remove('hidden');
            addVarBtnContainer.textContent = "+ Añadir Otra Variable";
        } else {
            dynamicModeView.classList.add('hidden');
            simpleModeView.classList.remove('hidden');
            addVarBtnContainer.textContent = "+ Añadir Variables (Modo Dinámico)";
        }
        addVarBtnContainer.classList.remove('hidden');
    };

    const buildEditor = (key) => {
        editorForm.reset();
        stepsContainer.innerHTML = '';
        templateStepContainer.innerHTML = '';
        const shortcut = key ? shortkeyManager.getShortcuts().find(s => s.key === key) : null;

        if (shortcut) {
            editorKeyInput.value = shortcut.key;
            const hasSteps = shortcut.steps && shortcut.steps.length > 0;
            if (hasSteps) {
                setEditorMode('dynamic');
                const selectSteps = shortcut.steps.filter(s => s.type === 'select');
                const templateStep = shortcut.steps.find(s => s.type === 'template');
                selectSteps.forEach(step => addStepToDOM('select', step));
                if (templateStep) addStepToDOM('template', templateStep);
            } else {
                setEditorMode('simple');
                editorDescInput.value = shortcut.description;
            }
        } else {
            setEditorMode('simple');
        }
        updateLivePreview();
    };

    const addStepToDOM = (type, data = null) => {
        const container = type === 'template' ? templateStepContainer : stepsContainer;
        const templateId = `template-step-${type}`;
        const template = document.getElementById(templateId);
        const clone = template.content.cloneNode(true);
        const stepContainer = clone.querySelector('.step-container');
        
        if (type === 'select') {
            const idInput = clone.querySelector('[data-config="id"]');
            if (data) {
                idInput.value = data.id;
            } else {
                const newId = `variable_${stepsContainer.children.length + 1}`;
                idInput.value = newId;
                updateTemplateOnIdChange('', newId);
            }
            idInput.addEventListener('focus', () => idInput.dataset.oldValue = idInput.value);
            idInput.addEventListener('input', () => {
                const oldValue = idInput.dataset.oldValue;
                updateTemplateOnIdChange(oldValue, idInput.value);
                idInput.dataset.oldValue = idInput.value;
                updateLivePreview();
            });
        }

        if (data) {
            stepContainer.querySelectorAll('[data-config]').forEach(input => {
                if (data[input.dataset.config] && input.dataset.config !== 'id') {
                    input.value = data[input.dataset.config];
                }
            });
            if (type === 'select' && data.options) {
                const optionsContainer = stepContainer.querySelector('.options-container');
                data.options.forEach(opt => addOptionToDOM(optionsContainer, opt));
            }
        }
        
        if (type === 'template') {
            clone.querySelector('[data-config="template"]').addEventListener('input', updateLivePreview);
        }

        container.appendChild(stepContainer);
        autoResizeTextareas();
        updateLivePreview();
    };

    const addOptionToDOM = (container, data = null) => {
        const template = document.getElementById('template-step-option');
        const clone = template.content.cloneNode(true);
        if (data) {
            clone.querySelectorAll('[data-config]').forEach(input => {
                if (data[input.dataset.config]) input.value = data[input.dataset.config];
            });
        } else {
            clone.querySelector('[data-config="nextStep"]').value = 'result';
        }
        
        clone.querySelectorAll('[data-config]').forEach(input => {
            input.addEventListener('input', updateLivePreview);
        });

        // CAMBIO: Añadir listener para no permitir espacios
        clone.querySelectorAll('.no-spaces').forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\s/g, '');
            });
        });

        container.appendChild(clone);
        autoResizeTextareas();
    };

    const autoResizeTextareas = () => { /* ... sin cambios ... */ };
    
    const parseEditor = () => {
        const key = editorKeyInput.value.trim().toLowerCase();
        if (!key) return null;

        const isDynamicMode = !dynamicModeView.classList.contains('hidden');
        let description = '';
        const steps = [];

        if (isDynamicMode) {
            description = "Shortkey dinámico con variables.";
            stepsContainer.querySelectorAll('.step-container').forEach(stepEl => {
                // CAMBIO: Se eliminó el `prompt`
                const stepData = { type: 'select', id: '', options: [] };
                stepEl.querySelectorAll('[data-config]').forEach(input => stepData[input.dataset.config] = input.value.trim());
                stepEl.querySelectorAll('.option-item').forEach(optEl => {
                    const optionData = {};
                    optEl.querySelectorAll('[data-config]').forEach(input => optionData[input.dataset.config] = input.value.trim());
                    steps.push(optionData);
                });
                steps.push(stepData);
            });
            const templateStep = templateStepContainer.querySelector('.step-container');
            if (templateStep) {
                const templateData = { type: 'template' };
                templateStep.querySelectorAll('[data-config]').forEach(input => templateData[input.dataset.config] = input.value);
                steps.push(templateData);
            }
        } else {
            description = editorDescInput.value.trim();
        }
        
        if (!description && steps.length === 0) return null;

        return { key, description, steps };
    };
    
    const updateTemplateOnIdChange = (oldId, newId) => { /* ... sin cambios ... */ };
    const updateTemplateOnDelete = (idToRemove) => { /* ... sin cambios ... */ };
    const updateLivePreview = () => { /* ... sin cambios ... */ };
    const renderShortcuts = () => { /* ... sin cambios ... */ };

    // --- Event Listeners ---
    closeBtn.addEventListener('click', attemptClose);
    overlay.addEventListener('click', attemptClose);
    addNewBtn.addEventListener('click', () => showEditorView());
    editorCancelBtn.addEventListener('click', attemptClose);

    // CAMBIO: Listeners para el nuevo modal de confirmación
    confirmCancelBtn.addEventListener('click', () => confirmModal.classList.add('hidden'));
    confirmDiscardBtn.addEventListener('click', closeModalCleanup);
    confirmSaveBtn.addEventListener('click', () => {
        editorForm.dispatchEvent(new Event('submit', { cancelable: true }));
        // La lógica de guardado ya se encarga de cerrar si tiene éxito
    });
    
    addVarBtnContainer.addEventListener('click', () => { /* ... sin cambios ... */ });

    editorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = parseEditor();
        if (!data) { alert('Por favor, completa al menos la llave.'); return; }
        
        const existing = shortkeyManager.getShortcuts().find(s => s.key === data.key);
        if (existing && data.key !== currentEditingKey) {
            alert(`El shortkey "@${data.key}" ya existe. Por favor, elige otra llave.`);
            return;
        }

        if (currentEditingKey) {
            shortkeyManager.updateShortcut(currentEditingKey, data);
        } else {
            shortkeyManager.addShortcut(data);
        }
        isDirty = false; // Marcar como no sucio después de guardar
        closeModalCleanup(); // CAMBIO: Usar la función de limpieza para cerrar
    });

    // CAMBIO: Marcar el formulario como "sucio" al detectar cambios
    editorForm.addEventListener('input', () => {
        isDirty = true;
    });

    // CAMBIO: Añadir listener para no permitir espacios en ID de variable
    stepsContainer.addEventListener('input', (e) => {
        if (e.target.matches('.no-spaces')) {
            e.target.value = e.target.value.replace(/\s/g, '');
        }
    });

    dynamicModeView.addEventListener('click', (e) => {
        const removeStepBtn = e.target.closest('.remove-step-btn');
        if (removeStepBtn) { /* ... sin cambios ... */ }
        if (e.target.classList.contains('add-option-btn')) { /* ... sin cambios ... */ }
        if (e.target.classList.contains('remove-option-btn')) { /* ... sin cambios ... */ }

        // CAMBIO: Lógica para reordenar opciones
        const moveUpBtn = e.target.closest('.move-option-up-btn');
        if (moveUpBtn) {
            const item = moveUpBtn.closest('.option-item');
            if (item.previousElementSibling) {
                item.parentElement.insertBefore(item, item.previousElementSibling);
                isDirty = true;
            }
        }
        const moveDownBtn = e.target.closest('.move-option-down-btn');
        if (moveDownBtn) {
            const item = moveDownBtn.closest('.option-item');
            if (item.nextElementSibling) {
                item.parentElement.insertBefore(item.nextElementSibling, item);
                isDirty = true;
            }
        }
    });
    
    document.getElementById('shortcutsList').addEventListener('click', (e) => { /* ... sin cambios ... */ });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('visible')) {
            attemptClose();
        }
        if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
            e.preventDefault();
            modal.classList.contains('visible') ? attemptClose() : openModal();
        }
    });

    // Carga inicial
    showListView();
    autoResizeTextareas();
});
