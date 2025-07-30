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
            } else { // interaction
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
        // Lógica de posicionamiento robusta
        const textarea = this.element;
        const text = textarea.value;
        const cursorPosition = textarea.selectionStart;

        const div = document.createElement('div');
        const style = window.getComputedStyle(textarea);
        ['font', 'padding', 'width', 'height', 'border', 'lineHeight', 'letterSpacing', 'textIndent'].forEach(prop => div.style[prop] = style[prop]);
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.textContent = text.substring(0, cursorPosition);
        
        const span = document.createElement('span');
        span.textContent = text.substring(cursorPosition) || '.';
        div.appendChild(span);
        
        document.body.appendChild(div);
        const { offsetLeft: spanLeft, offsetTop: spanTop, offsetHeight: spanHeight } = span;
        document.body.removeChild(div);
        
        const { left: areaLeft, top: areaTop } = textarea.getBoundingClientRect();
        
        this.popup.style.top = `${areaTop + spanTop + spanHeight + window.scrollY}px`;
        this.popup.style.left = `${areaLeft + spanLeft + window.scrollX}px`;
    }

    _handleKeydown(event) {
        if (this.items.length === 0) return;
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
                this.destroy();
                break;
            case 'Escape':
                event.preventDefault(); event.stopPropagation();
                this.destroy();
                break;
        }
    }
    
    _handleClick(event) {
        const option = event.target.closest('.popup-option');
        if (option && this.popup.contains(option)) {
            this.onSelect(this.items[option.dataset.index]);
        }
        this.destroy();
    }

    updateSelected() {
        this.popup.querySelectorAll('.popup-option').forEach((opt, index) => {
            opt.classList.toggle('selected', index === this.selectedIndex);
        });
    }
}

/**
 * Clase principal Shortkey
 */
class Shortkey {
    constructor() {
        this._shortcuts = [];
        this._popupManager = null;
        this._loadShortcuts();
    }
    _loadShortcuts() {
        const saved = localStorage.getItem('userShortkeys');
        if (saved) { this._shortcuts = JSON.parse(saved); }
        else {
            this._shortcuts = [
                { key: 'sds', description: 'Saludos cordiales,', steps: [] },
                { key: 'cxinternet', description: 'Reporte de problema de internet.', steps: [ { id: 'type', type: 'select', prompt: 'Tipo de conexión:', options: [ { label: 'Fibra Óptica', value: 'Fibra', nextStep: 'result' }, { label: 'Cobre', value: 'Cobre', nextStep: 'result' } ] }, { id: 'result', type: 'template', template: 'Cliente reporta inconvenientes con su servicio de internet tipo {type}. Se ha iniciado el proceso de diagnóstico.' } ] }
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
    attach(selectorOrElement) { const elements = typeof selectorOrElement === 'string' ? document.querySelectorAll(selectorOrElement) : [selectorOrElement]; elements.forEach(element => { if (element) element.addEventListener('input', this._handleInput.bind(this)); }); }
    
    _handleInput(event) {
        const element = event.target;
        const text = element.value;
        const cursorPosition = element.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (this._popupManager) this._popupManager.destroy();

        if (lastAtIndex === -1 || textBeforeCursor.substring(lastAtIndex).includes(' ')) {
            return;
        }

        const query = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase();
        const filteredShortcuts = this._shortcuts.filter(s => s.key.startsWith(query));

        if (filteredShortcuts.length > 0) {
            this._popupManager = new PopupManager(element, (selected) => this._triggerShortkey(selected.key));
            this._popupManager.show(filteredShortcuts, 'search');
        }
    }

    _triggerShortkey(key) {
        const shortcutData = this._shortcuts.find(s => s.key === key);
        if (!shortcutData) return;

        const element = document.activeElement;
        const text = element.value;
        const cursorPosition = element.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        const isDynamic = shortcutData.steps && shortcutData.steps.length > 0;
        if (isDynamic) {
            this._popupManager = new PopupManager(element, (selectedOption) => {
                this._runDynamicFlow(shortcutData, lastAtIndex, { [shortcutData.steps[0].id]: selectedOption.value }, selectedOption.nextStep);
            });
            this._popupManager.show(shortcutData.steps[0].options, 'interaction', shortcutData.steps[0].prompt);
        } else {
            this._performReplacement(lastAtIndex, key, shortcutData.description, {});
        }
    }

    _runDynamicFlow(shortkeyData, triggerPosition, variables, nextStepId) {
        const nextStep = shortkeyData.steps.find(s => s.id === nextStepId);
        if (nextStep && nextStep.type === 'select') {
             this._popupManager = new PopupManager(document.activeElement, (selectedOption) => {
                const newVariables = {...variables, [nextStep.id]: selectedOption.value };
                this._runDynamicFlow(shortkeyData, triggerPosition, newVariables, selectedOption.nextStep);
            });
            this._popupManager.show(nextStep.options, 'interaction', nextStep.prompt);
        } else if (nextStep && nextStep.type === 'template') {
            this._performReplacement(triggerPosition, shortkeyData.key, nextStep.template, variables);
        }
    }
    
    _performReplacement(triggerPosition, key, template, variables) {
        let final_text = template;
        for (const varName in variables) {
            final_text = final_text.replace(new RegExp(`{${varName}}`, 'g'), variables[varName]);
        }
        final_text += ' ';
        const element = document.activeElement;
        const originalText = element.value;
        const textAfterCursor = originalText.substring(triggerPosition + key.length + 1);
        const newText = originalText.substring(0, triggerPosition) + final_text + textAfterCursor;
        element.value = newText;
        const newCursorPosition = triggerPosition + final_text.length;
        element.selectionStart = element.selectionEnd = newCursorPosition;
    }
}

/**
 * Lógica de la Aplicación
 */
document.addEventListener('DOMContentLoaded', () => {
    console.info('[Shortkey] Módulo dinámico cargado y listo.');
    const shortkeyManager = new Shortkey();
    shortkeyManager.attach('.shortkey-enabled');

    const modal = document.getElementById('settingsModal');
    const openBtn = document.getElementById('openSettingsBtn');
    const closeBtn = document.getElementById('closeSettingsBtn');
    const overlay = document.getElementById('modalOverlay');
    const viewList = document.getElementById('view-list');
    const viewEditor = document.getElementById('view-editor');
    const addNewBtn = document.getElementById('add-new-shortkey-btn');
    const editorForm = document.getElementById('shortkey-editor-form');
    const editorKeyInput = document.getElementById('editor-key');
    const editorDescInput = document.getElementById('editor-description');
    const dynamicSection = document.getElementById('dynamic-section');
    const stepsContainer = document.getElementById('steps-container');
    const templateStepContainer = document.getElementById('template-step-container');
    const addSelectStepBtn = document.getElementById('add-select-step-btn');
    const editorCancelBtn = document.getElementById('editor-cancel-btn');
    const livePreviewOutput = document.getElementById('live-preview-output');
    
    let currentEditingKey = null;

    const showListView = () => {
        viewEditor.classList.add('hidden');
        viewList.classList.remove('hidden');
        renderShortcuts();
    };

    const showEditorView = (shortcutKey = null) => {
        viewList.classList.add('hidden');
        viewEditor.classList.remove('hidden');
        currentEditingKey = shortcutKey;
        buildEditor(shortcutKey);
    };

    const buildEditor = (key) => {
        stepsContainer.innerHTML = '';
        templateStepContainer.innerHTML = '';
        const shortcut = key ? shortkeyManager.getShortcuts().find(s => s.key === key) : null;

        if (shortcut) {
            editorKeyInput.value = shortcut.key;
            editorDescInput.value = shortcut.description;
            const selectSteps = shortcut.steps.filter(s => s.type === 'select');
            const templateStep = shortcut.steps.find(s => s.type === 'template');
            
            if (selectSteps.length > 0) {
                selectSteps.forEach(step => addStepToDOM('select', step));
                addStepToDOM('template', templateStep);
            }
        } else {
            editorForm.reset();
        }
        toggleDynamicSection();
        updateLivePreview();
    };

    const addStepToDOM = (type, data = null) => {
        const container = type === 'template' ? templateStepContainer : stepsContainer;
        const templateId = `template-step-${type}`;
        const template = document.getElementById(templateId);
        const clone = template.content.cloneNode(true);
        const stepContainer = clone.querySelector('.step-container');

        if (data) {
            stepContainer.querySelectorAll('[data-config]').forEach(input => {
                if (data[input.dataset.config]) input.value = data[input.dataset.config];
            });
            if (type === 'select' && data.options) {
                const optionsContainer = stepContainer.querySelector('.options-container');
                data.options.forEach(opt => addOptionToDOM(optionsContainer, opt));
            }
        }
        container.appendChild(stepContainer);
    };

    const addOptionToDOM = (container, data = null) => {
        const template = document.getElementById('template-step-option');
        const clone = template.content.cloneNode(true);
        if (data) {
            clone.querySelectorAll('[data-config]').forEach(input => {
                if (data[input.dataset.config]) input.value = data[input.dataset.config];
            });
        }
        container.appendChild(clone);
    };
    
    const toggleDynamicSection = () => {
        const hasSelectSteps = stepsContainer.children.length > 0;
        dynamicSection.classList.toggle('hidden', !hasSelectSteps);
        editorDescInput.disabled = hasSelectSteps;
    };

    const parseEditor = () => {
        const key = editorKeyInput.value.trim().toLowerCase();
        const description = editorDescInput.value.trim();
        if (!key || !description) return null;

        const steps = [];
        const selectSteps = stepsContainer.querySelectorAll('.step-container');
        
        if (selectSteps.length > 0) {
             selectSteps.forEach(stepEl => {
                const stepData = { type: 'select', options: [] };
                stepEl.querySelectorAll('[data-config]').forEach(input => stepData[input.dataset.config] = input.value.trim());
                stepEl.querySelectorAll('.option-item').forEach(optEl => {
                    const optionData = {};
                    optEl.querySelectorAll('[data-config]').forEach(input => optionData[input.dataset.config] = input.value.trim());
                    stepData.options.push(optionData);
                });
                steps.push(stepData);
            });
            const templateStep = templateStepContainer.querySelector('.step-container');
            if (templateStep) {
                const templateData = { type: 'template' };
                templateStep.querySelectorAll('[data-config]').forEach(input => templateData[input.dataset.config] = input.value);
                steps.push(templateData);
            }
        }
        return { key, description, steps };
    };
    
    const updateLivePreview = () => {
        const data = parseEditor();
        if (!data) { livePreviewOutput.textContent = ''; return; }
        const hasDynamicSteps = stepsContainer.children.length > 0;
        if (!hasDynamicSteps) {
            livePreviewOutput.textContent = data.description;
            return;
        }
        const templateStepEl = templateStepContainer.querySelector('[data-config="template"]');
        if (!templateStepEl) { livePreviewOutput.textContent = 'Añade una Plantilla Final para ver la vista previa.'; return; }
        let previewText = templateStepEl.value;
        stepsContainer.querySelectorAll('.step-container').forEach(stepEl => {
            const varName = stepEl.querySelector('[data-config="id"]').value || 'variable';
            const firstOption = stepEl.querySelector('[data-config="label"]');
            const exampleValue = firstOption && firstOption.value ? `[${firstOption.value}]` : `[ejemplo]`;
            previewText = previewText.replace(new RegExp(`{${varName}}`, 'g'), exampleValue);
        });
        livePreviewOutput.textContent = previewText;
    };

    const renderShortcuts = () => {
        const listContainer = document.getElementById('shortcutsList');
        listContainer.innerHTML = '';
        const shortcuts = shortkeyManager.getShortcuts();
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
                    ${isDynamic ? `<svg class="dynamic-indicator" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>` : ''}
                    <div>
                        <span class="shortcut-key">@${shortcut.key}</span>
                        <p class="shortcut-description">${shortcut.description}</p>
                    </div>
                </div>
                <div class="shortcut-actions">
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
    if (openBtn) openBtn.addEventListener('click', () => { showListView(); modal.classList.add('visible'); });
    closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
    overlay.addEventListener('click', () => modal.classList.remove('visible'));
    addNewBtn.addEventListener('click', () => showEditorView());
    editorCancelBtn.addEventListener('click', showListView);
    
    addSelectStepBtn.addEventListener('click', () => {
        if (templateStepContainer.children.length === 0) {
            addStepToDOM('template');
        }
        addStepToDOM('select');
        toggleDynamicSection();
        updateLivePreview();
    });

    editorForm.addEventListener('input', updateLivePreview);
    editorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = parseEditor();
        if (!data) { alert('Por favor, completa la llave y la descripción.'); return; }
        if (currentEditingKey) {
            shortkeyManager.updateShortcut(currentEditingKey, data);
        } else {
            shortkeyManager.addShortcut(data);
        }
        showListView();
    });

    dynamicSection.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-step-btn')) {
            e.target.closest('.step-container').remove();
            toggleDynamicSection();
            updateLivePreview();
        }
        if (e.target.classList.contains('add-option-btn')) {
            addOptionToDOM(e.target.previousElementSibling);
        }
        if (e.target.classList.contains('remove-option-btn')) {
            e.target.closest('.option-item').remove();
        }
    });
    
    document.getElementById('shortcutsList').addEventListener('click', (e) => {
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
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('visible')) {
            closeModal();
        }
        if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
            e.preventDefault();
            modal.classList.contains('visible') ? closeModal() : openModal();
        }
    });

    // Carga inicial
    showListView();
});
