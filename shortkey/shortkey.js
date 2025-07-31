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
        
        if (!this.popup) return;

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

    const confirmModal = document.getElementById('confirm-modal');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const confirmDiscardBtn = document.getElementById('confirm-discard-btn');
    const confirmSaveBtn = document.getElementById('confirm-save-btn');
    
    let currentEditingKey = null;
    let isDirty = false;

    // --- Funciones de control de UI ---
    const openModal = () => {
        showListView();
        if (modal) modal.classList.add('visible');
    };

    const attemptClose = () => {
        if (!viewEditor) return;
        const isEditorVisible = !viewEditor.classList.contains('hidden');
        if (!isEditorVisible) {
            closeModalCleanup();
            return;
        }
        if (isDirty) {
            if (confirmModal) confirmModal.classList.remove('hidden');
        } else {
            showListView();
        }
    };

    const closeModalCleanup = () => {
        if (modal) modal.classList.remove('visible');
        if (confirmModal) confirmModal.classList.add('hidden');
    };

    const showListView = () => {
        if (viewEditor) viewEditor.classList.add('hidden');
        if (viewList) viewList.classList.remove('hidden');
        if (confirmModal) confirmModal.classList.add('hidden');
        isDirty = false;
        renderShortcuts();
    };

    const showEditorView = (shortcutKey = null) => {
        if (viewList) viewList.classList.add('hidden');
        if (viewEditor) viewEditor.classList.remove('hidden');
        isDirty = false;
        currentEditingKey = shortcutKey;
        buildEditor(shortcutKey);
    };

    const setEditorMode = (mode) => {
        if (!simpleModeView || !dynamicModeView || !addVarBtnContainer) return;
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
        if (!editorForm) return;
        editorForm.reset();
        if (stepsContainer) stepsContainer.innerHTML = '';
        if (templateStepContainer) templateStepContainer.innerHTML = '';
        const shortcut = key ? shortkeyManager.getShortcuts().find(s => s.key === key) : null;

        if (shortcut) {
            if (editorKeyInput) editorKeyInput.value = shortcut.key;
            const hasSteps = shortcut.steps && shortcut.steps.length > 0;
            if (hasSteps) {
                setEditorMode('dynamic');
                const selectSteps = shortcut.steps.filter(s => s.type === 'select');
                const templateStep = shortcut.steps.find(s => s.type === 'template');
                selectSteps.forEach(step => addStepToDOM('select', step));
                if (templateStep) addStepToDOM('template', templateStep);
            } else {
                setEditorMode('simple');
                if (editorDescInput) editorDescInput.value = shortcut.description;
            }
        } else {
            setEditorMode('simple');
        }
        updateLivePreview();
    };

    const addStepToDOM = (type, data = null) => {
        const container = type === 'template' ? templateStepContainer : stepsContainer;
        if (!container) return;
        const templateId = `template-step-${type}`;
        const template = document.getElementById(templateId);
        if (!template) return;
        const clone = template.content.cloneNode(true);
        const stepContainer = clone.querySelector('.step-container');
        
        if (type === 'select') {
            const idInput = clone.querySelector('[data-config="id"]');
            if (idInput) {
                if (data) {
                    idInput.value = data.id;
                } else {
                    const newId = `variable_${stepsContainer.children.length + 1}`;
                    idInput.value = newId;
                    addPlaceholderToTemplate(newId);
                }
                idInput.addEventListener('focus', () => idInput.dataset.oldValue = idInput.value);
                idInput.addEventListener('input', () => {
                    const oldValue = idInput.dataset.oldValue;
                    updateTemplateOnIdChange(oldValue, idInput.value);
                    idInput.dataset.oldValue = idInput.value;
                    updateLivePreview();
                });
            }
        }

        if (data) {
            stepContainer.querySelectorAll('[data-config]').forEach(input => {
                if (data[input.dataset.config] && input.dataset.config !== 'id') {
                    input.value = data[input.dataset.config];
                }
            });
            if (type === 'select' && data.options) {
                const optionsContainer = stepContainer.querySelector('.options-container');
                if (optionsContainer) data.options.forEach(opt => addOptionToDOM(optionsContainer, opt));
            }
        }
        
        if (type === 'template') {
            const templateTextarea = clone.querySelector('[data-config="template"]');
            if (templateTextarea) templateTextarea.addEventListener('input', updateLivePreview);
        }

        container.appendChild(stepContainer);
        autoResizeTextareas();
        updateLivePreview();
    };

    const addOptionToDOM = (container, data = null) => {
        const template = document.getElementById('template-step-option');
        if (!template) return;
        const clone = template.content.cloneNode(true);
        if (data) {
            clone.querySelectorAll('[data-config]').forEach(input => {
                if (data[input.dataset.config]) input.value = data[input.dataset.config];
            });
        } else {
            const nextStepInput = clone.querySelector('[data-config="nextStep"]');
            if (nextStepInput) nextStepInput.value = 'result';
        }
        
        clone.querySelectorAll('[data-config]').forEach(input => {
            input.addEventListener('input', updateLivePreview);
        });

        clone.querySelectorAll('.no-spaces').forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\s/g, '');
            });
        });

        container.appendChild(clone);
        autoResizeTextareas();
    };

    const autoResizeTextareas = () => {
        document.querySelectorAll('.step-textarea-flexible').forEach(textarea => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            });
        });
    };
    
    const parseEditor = () => {
        if (!editorKeyInput || !dynamicModeView) return null;
        const key = editorKeyInput.value.trim().toLowerCase();
        if (!key) return null;

        const isDynamicMode = !dynamicModeView.classList.contains('hidden');
        let description = '';
        const steps = [];

        if (isDynamicMode) {
            description = "Shortkey dinámico con variables.";
            if (stepsContainer) {
                stepsContainer.querySelectorAll('.step-container').forEach(stepEl => {
                    const stepData = { type: 'select', id: '', options: [] };
                    stepEl.querySelectorAll('[data-config]').forEach(input => stepData[input.dataset.config] = input.value.trim());
                    stepEl.querySelectorAll('.option-item').forEach(optEl => {
                        const optionData = {};
                        optEl.querySelectorAll('[data-config]').forEach(input => optionData[input.dataset.config] = input.value.trim());
                        stepData.options.push(optionData);
                    });
                    steps.push(stepData);
                });
            }
            if (templateStepContainer) {
                const templateStep = templateStepContainer.querySelector('.step-container');
                if (templateStep) {
                    const templateData = { type: 'template' };
                    templateStep.querySelectorAll('[data-config]').forEach(input => templateData[input.dataset.config] = input.value);
                    steps.push(templateData);
                }
            }
        } else {
            if (editorDescInput) description = editorDescInput.value.trim();
        }
        
        if (!description && steps.length === 0) return null;

        return { key, description, steps };
    };
    
    const addPlaceholderToTemplate = (newId) => {
        if (!templateStepContainer) return;
        const templateTextarea = templateStepContainer.querySelector('[data-config="template"]');
        if (!templateTextarea) return;
        const sanitizedNewId = newId.trim().replace(/\s/g, '_');
        if (sanitizedNewId && !templateTextarea.value.includes(`{${sanitizedNewId}}`)) {
             templateTextarea.value = (templateTextarea.value ? templateTextarea.value + ' ' : '') + `{${sanitizedNewId}}`;
        }
    };

    const updateTemplateOnIdChange = (oldId, newId) => {
        if (!templateStepContainer) return;
        const templateTextarea = templateStepContainer.querySelector('[data-config="template"]');
        if (!templateTextarea) return;
        
        const currentTemplate = templateTextarea.value;
        const sanitizedNewId = newId.trim().replace(/\s/g, '');

        if (oldId && currentTemplate.includes(`{${oldId}}`)) {
            templateTextarea.value = currentTemplate.replace(new RegExp(`{${oldId}}`, 'g'), `{${sanitizedNewId}}`);
        }
    };

    const updateTemplateOnDelete = (idToRemove) => {
        if (!templateStepContainer || !idToRemove) return;
        const templateTextarea = templateStepContainer.querySelector('[data-config="template"]');
        if (!templateTextarea) return;
        
        templateTextarea.value = templateTextarea.value.replace(new RegExp(`\\s?{${idToRemove}}`, 'g'), '').trim();
    };

    const updateLivePreview = () => {
        if (!livePreviewContainer || !livePreviewOutput) return;
        const data = parseEditor();
        if (!data || !data.steps || data.steps.length === 0) {
            livePreviewContainer.classList.add('hidden');
            return;
        }
        livePreviewContainer.classList.remove('hidden');

        const templateStep = data.steps.find(s => s.type === 'template');
        if (!templateStep || !templateStep.template) {
            livePreviewOutput.textContent = 'Escribe en la Plantilla Final para ver la vista previa.';
            return;
        }
        
        let previewText = templateStep.template;
        data.steps.filter(s => s.type === 'select').forEach(step => {
            const varName = step.id || 'variable';
            const firstOption = step.options.length > 0 ? step.options[0] : null;
            const exampleValue = firstOption && firstOption.label ? `[${firstOption.label}]` : `[ejemplo]`;
            previewText = previewText.replace(new RegExp(`{${varName}}`, 'g'), exampleValue);
        });
        livePreviewOutput.textContent = previewText;
    };

    const renderShortcuts = () => {
        const listContainer = document.getElementById('shortcutsList');
        if (!listContainer) return;
        listContainer.innerHTML = '';
        const shortcuts = shortkeyManager.getShortcuts();
        if (shortcuts.length === 0) {
            listContainer.innerHTML = `<p style="text-align: center; color: #6b7280; padding: 1rem;">No tienes shortkeys. ¡Añade uno nuevo!</p>`;
            return;
        }
        shortcuts.forEach((shortcut, index) => {
            const isDynamic = shortcut.steps && shortcut.steps.length > 0;
            const item = document.createElement('div');
            item.className = 'shortcut-item';
            item.innerHTML = `
                <div class="shortcut-reorder">
                    <button class="action-btn move-up-btn" data-key="${shortcut.key}" title="Mover arriba" ${index === 0 ? 'disabled' : ''}>
                        <svg style="pointer-events: none;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                    </button>
                    <button class="action-btn move-down-btn" data-key="${shortcut.key}" title="Mover abajo" ${index === shortcuts.length - 1 ? 'disabled' : ''}>
                        <svg style="pointer-events: none;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </button>
                </div>
                <div style="display: flex; align-items: center; min-width: 0;">
                    <div>
                        <span class="shortcut-key">@${shortcut.key}</span>
                        <p class="shortcut-description">${shortcut.description}</p>
                    </div>
                </div>
                <div class="shortcut-actions">
                    ${isDynamic ? `<svg class="dynamic-indicator" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>` : ''}
                    <button class="action-btn edit-btn" data-key="${shortcut.key}" title="Editar">
                        <svg style="pointer-events: none;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                    </button>
                    <button class="action-btn delete-btn" data-key="${shortcut.key}" title="Eliminar">
                        <svg style="pointer-events: none;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                </div>`;
            listContainer.appendChild(item);
        });
    };

    // --- Event Listeners ---
    if (closeBtn) closeBtn.addEventListener('click', attemptClose);
    if (overlay) overlay.addEventListener('click', attemptClose);
    if (addNewBtn) addNewBtn.addEventListener('click', () => showEditorView());
    if (editorCancelBtn) editorCancelBtn.addEventListener('click', attemptClose);

    // CAMBIO: Lógica de botones de confirmación corregida
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => {
            if (confirmModal) confirmModal.classList.add('hidden');
        });
    }
    if (confirmDiscardBtn) {
        confirmDiscardBtn.addEventListener('click', () => {
            // La función showListView ya se encarga de ocultar el modal de confirmación
            showListView();
        });
    }
    if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', () => {
            // La función de guardado (submit) llama a showListView al terminar,
            // que a su vez oculta el modal de confirmación.
            if (editorForm) editorForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        });
    }
    
    if (addVarBtnContainer) {
        addVarBtnContainer.addEventListener('click', () => {
            const isSimpleMode = simpleModeView && !simpleModeView.classList.contains('hidden');
            if (isSimpleMode) {
                setEditorMode('dynamic');
                if (templateStepContainer && templateStepContainer.children.length === 0) {
                    addStepToDOM('template');
                }
                if (stepsContainer && stepsContainer.children.length === 0) {
                    addStepToDOM('select');
                }
            } else {
                addStepToDOM('select');
            }
        });
    }

    if (editorForm) {
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
            isDirty = false;
            showListView();
        });

        editorForm.addEventListener('input', () => {
            isDirty = true;
        });
    }

    if (editorKeyInput) {
        editorKeyInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\s/g, '');
        });
    }

    if (stepsContainer) {
        stepsContainer.addEventListener('input', (e) => {
            if (e.target.matches('.no-spaces')) {
                e.target.value = e.target.value.replace(/\s/g, '');
            }
        });
    }

    if (dynamicModeView) {
        dynamicModeView.addEventListener('click', (e) => {
            const removeStepBtn = e.target.closest('.remove-step-btn');
            if (removeStepBtn) {
                const stepContainer = removeStepBtn.closest('.step-container');
                const idToRemove = stepContainer.querySelector('[data-config="id"]')?.value;
                updateTemplateOnDelete(idToRemove);
                stepContainer.remove();
                
                if (stepsContainer && stepsContainer.children.length === 0) {
                    if (templateStepContainer) templateStepContainer.innerHTML = '';
                    setEditorMode('simple');
                }
                updateLivePreview();
            }
            if (e.target.classList.contains('add-option-btn')) {
                addOptionToDOM(e.target.previousElementSibling);
                updateLivePreview();
            }
            if (e.target.classList.contains('remove-option-btn')) {
                e.target.closest('.option-item').remove();
                updateLivePreview();
            }

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
    }
    
    const shortcutsListEl = document.getElementById('shortcutsList');
    if (shortcutsListEl) {
        shortcutsListEl.addEventListener('click', (e) => {
            const button = e.target.closest('.action-btn');
            if (!button) return;
            const key = button.dataset.key;
            if (button.classList.contains('edit-btn')) {
                showEditorView(key);
            } else if (button.classList.contains('move-up-btn')) {
                shortkeyManager.moveShortcut(key, 'up');
                renderShortcuts();
            } else if (button.classList.contains('move-down-btn')) {
                shortkeyManager.moveShortcut(key, 'down');
                renderShortcuts();
            } else if (button.classList.contains('delete-btn')) {
                if (confirm(`¿Estás seguro de que quieres eliminar el shortkey "@${key}"?`)) {
                    shortkeyManager.removeShortcut(key);
                    renderShortcuts();
                }
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('visible')) {
            if (confirmModal && !confirmModal.classList.contains('hidden')) {
                confirmModal.classList.add('hidden');
            } else {
                attemptClose();
            }
        }
        if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
            e.preventDefault();
            if (modal) {
                modal.classList.contains('visible') ? attemptClose() : openModal();
            }
        }
    });

    // Carga inicial
    showListView();
    autoResizeTextareas();
});
