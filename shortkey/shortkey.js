/**
 * Clase para manejar la interacción del usuario con los shortkeys dinámicos.
 */
class InteractionManager {
    // ... (El código de esta clase no cambia)
    constructor(element, onComplete) { this.element = element; this.onComplete = onComplete; this.popup = document.getElementById('shortkey-interaction-popup'); this.variables = {}; this.currentStep = null; this.shortkeyData = null; this.triggerPosition = -1; this.selectedOptionIndex = -1; this._boundHandleKeydown = this._handleKeydown.bind(this); this._boundHandleClick = this._handleClick.bind(this); }
    start(shortkeyData, triggerPosition) { this.shortkeyData = shortkeyData; this.triggerPosition = triggerPosition; this.variables = {}; this.currentStep = shortkeyData.steps[0]; this.showPopup(); document.addEventListener('keydown', this._boundHandleKeydown, true); document.addEventListener('click', this._boundHandleClick, true); }
    showPopup() { if (!this.currentStep || this.currentStep.type !== 'select') { this.destroy(); return; } let content = `<div class="popup-prompt">${this.currentStep.prompt}</div>`; this.currentStep.options.forEach((opt, index) => { content += `<button class="popup-option" data-index="${index}" data-value="${opt.value}" data-next="${opt.nextStep}">${opt.label}</button>`; }); this.popup.innerHTML = content; this.positionPopup(); this.popup.classList.add('visible'); this.selectedOptionIndex = 0; this.updateSelectedOption(); }
    positionPopup() { const rect = this.element.getBoundingClientRect(); const cursorPosition = this.element.selectionStart; const textBeforeCursor = this.element.value.substring(0, cursorPosition); const lines = textBeforeCursor.split('\n'); const lastLine = lines[lines.length - 1]; const lineHeight = parseFloat(getComputedStyle(this.element).lineHeight); const top = rect.top + (lines.length * lineHeight) + window.scrollY; const left = rect.left + (lastLine.length * 8) + window.scrollX; this.popup.style.top = `${top + 5}px`; this.popup.style.left = `${left}px`; }
    destroy() { this.popup.classList.remove('visible'); this.popup.innerHTML = ''; document.removeEventListener('keydown', this._boundHandleKeydown, true); document.removeEventListener('click', this._boundHandleClick, true); }
    _handleKeydown(event) { event.stopPropagation(); event.preventDefault(); const options = this.popup.querySelectorAll('.popup-option'); switch (event.key) { case 'ArrowDown': this.selectedOptionIndex = (this.selectedOptionIndex + 1) % options.length; this.updateSelectedOption(); break; case 'ArrowUp': this.selectedOptionIndex = (this.selectedOptionIndex - 1 + options.length) % options.length; this.updateSelectedOption(); break; case 'Enter': case 'Tab': this.selectOption(options[this.selectedOptionIndex]); break; case 'Escape': this.destroy(); break; } }
    _handleClick(event) { const option = event.target.closest('.popup-option'); if (option && this.popup.contains(option)) { this.selectOption(option); } else { this.destroy(); } }
    updateSelectedOption() { const options = this.popup.querySelectorAll('.popup-option'); options.forEach((opt, index) => { opt.classList.toggle('selected', index === this.selectedOptionIndex); }); }
    selectOption(optionElement) { if (!optionElement) return; const value = optionElement.dataset.value; const nextStepId = optionElement.dataset.next; this.variables[this.currentStep.id] = value; const nextStep = this.shortkeyData.steps.find(s => s.id === nextStepId); if (nextStep && nextStep.type === 'select') { this.currentStep = nextStep; this.showPopup(); } else if (nextStep && nextStep.type === 'template') { this.onComplete(this.triggerPosition, this.shortkeyData.key, nextStep.template, this.variables); this.destroy(); } else { this.destroy(); } }
}

/**
 * Clase principal Shortkey
 */
class Shortkey {
    constructor() {
        this._shortcuts = [];
        this._interactionManager = null;
        this._loadShortcuts();
    }
    _loadShortcuts() {
        const saved = localStorage.getItem('userShortkeys');
        if (saved) {
            this._shortcuts = JSON.parse(saved);
        } else {
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
    attach(selectorOrElement) { const elements = typeof selectorOrElement === 'string' ? document.querySelectorAll(selectorOrElement) : [selectorOrElement]; elements.forEach(element => { if (element) element.addEventListener('keydown', this._handleKeydown.bind(this)); }); }
    
    _handleKeydown(event) {
        if (this._interactionManager && this._interactionManager.popup.classList.contains('visible')) return;
        if (event.key !== ' ') return;
        const element = event.target;
        const cursorPosition = element.selectionStart;
        if (cursorPosition === 0) return;
        const textBeforeCursor = element.value.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        if (lastAtIndex === -1 || textBeforeCursor.substring(lastAtIndex).includes(' ')) return;
        
        const potentialShortcutKey = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase();
        const shortcutData = this._shortcuts.find(s => s.key === potentialShortcutKey);

        if (shortcutData) {
            event.preventDefault();
            const isDynamic = shortcutData.steps && shortcutData.steps.length > 0;
            if (isDynamic) {
                this._interactionManager = new InteractionManager(element, this._performReplacement.bind(this));
                this._interactionManager.start(shortcutData, lastAtIndex);
            } else {
                this._performReplacement(lastAtIndex, shortcutData.key, shortcutData.description, {});
            }
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
        const textAfterCursor = originalText.substring(triggerPosition + key.length + 2); // +2 for @ and space
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
                dynamicSection.classList.remove('hidden');
                selectSteps.forEach(step => addStepToDOM('select', step));
                addStepToDOM('template', templateStep);
            } else {
                dynamicSection.classList.add('hidden');
            }
        } else {
            editorForm.reset();
            dynamicSection.classList.add('hidden');
        }
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

    const parseEditor = () => {
        const key = editorKeyInput.value.trim().toLowerCase();
        const description = editorDescInput.value.trim();
        if (!key || !description) return null;

        const steps = [];
        if (!dynamicSection.classList.contains('hidden')) {
            stepsContainer.querySelectorAll('.step-container').forEach(stepEl => {
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
        if (!data || data.steps.length === 0) {
            livePreviewOutput.textContent = data ? data.description : '';
            return;
        }
        
        const templateStep = data.steps.find(s => s.type === 'template');
        if (!templateStep) {
            livePreviewOutput.textContent = 'Error: Falta la plantilla final.';
            return;
        }
        
        let previewText = templateStep.template;
        const selectSteps = data.steps.filter(s => s.type === 'select');
        selectSteps.forEach(step => {
            const varName = step.id || 'variable';
            const exampleValue = step.options.length > 0 ? `[${step.options[0].label}]` : `[ejemplo]`;
            previewText = previewText.replace(new RegExp(`{${varName}}`, 'g'), exampleValue);
        });
        livePreviewOutput.textContent = previewText;
    };

    const renderShortcuts = () => {
        const listContainer = document.getElementById('shortcutsList');
        listContainer.innerHTML = '';
        const shortcuts = shortkeyManager.getShortcuts();
        shortcuts.forEach(shortcut => {
            const isDynamic = shortcut.steps && shortcut.steps.length > 0;
            const item = document.createElement('div');
            item.className = 'shortcut-item';
            item.innerHTML = `
                <div style="display: flex; align-items: center; min-width: 0;">
                    ${isDynamic ? `<svg class="dynamic-indicator" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" /></svg>` : ''}
                    <div>
                        <span class="shortcut-key">@${shortcut.key}</span>
                        <p class="shortcut-description">${shortcut.description}</p>
                    </div>
                </div>
                <div class="shortcut-actions">
                    <button class="action-btn edit-btn" data-key="${shortcut.key}">Editar</button>
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
        if (stepsContainer.children.length === 0) { // Si es el primer paso dinámico
            addStepToDOM('template');
        }
        addStepToDOM('select');
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

    stepsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-step-btn')) e.target.closest('.step-container').remove();
        if (e.target.classList.contains('add-option-btn')) addOptionToDOM(e.target.previousElementSibling);
        if (e.target.classList.contains('remove-option-btn')) e.target.closest('.option-item').remove();
    });
    
    document.getElementById('shortcutsList').addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) showEditorView(e.target.dataset.key);
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('visible')) closeModal();
        if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
            e.preventDefault();
            modal.classList.contains('visible') ? closeModal() : openModal();
        }
    });

    // Carga inicial
    showListView();
});
