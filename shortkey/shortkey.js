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
    // ... (El código de esta clase no cambia)
    constructor() { this._shortcuts = []; this._interactionManager = null; this._loadShortcuts(); }
    _loadShortcuts() { const saved = localStorage.getItem('userShortkeys'); if (saved) { this._shortcuts = JSON.parse(saved); } else { this._shortcuts = [ { key: 'sds', description: 'Un saludo simple.', steps: [{ id: 'result', type: 'template', template: 'Saludos cordiales,' }] }, { key: 'cxinternet', description: 'Reporte de problema de internet.', steps: [ { id: 'type', type: 'select', prompt: 'Tipo de conexión:', options: [ { label: 'Fibra Óptica', value: 'Fibra', nextStep: 'result' }, { label: 'Cobre', value: 'Cobre', nextStep: 'result' } ] }, { id: 'result', type: 'template', template: 'Cliente reporta inconvenientes con su servicio de internet tipo {type}. Se ha iniciado el proceso de diagnóstico.' } ] } ]; this._saveShortcuts(); } }
    _saveShortcuts() { localStorage.setItem('userShortkeys', JSON.stringify(this._shortcuts)); }
    getShortcuts() { return this._shortcuts; }
    addShortcut(shortcutData) { this._shortcuts.push(shortcutData); this._saveShortcuts(); }
    updateShortcut(oldKey, shortcutData) { const index = this._shortcuts.findIndex(s => s.key === oldKey); if (index > -1) { this._shortcuts[index] = shortcutData; } else { this.addShortcut(shortcutData); } this._saveShortcuts(); }
    removeShortcut(key) { this._shortcuts = this._shortcuts.filter(s => s.key !== key); this._saveShortcuts(); }
    attach(selectorOrElement) { const elements = typeof selectorOrElement === 'string' ? document.querySelectorAll(selectorOrElement) : [selectorOrElement]; elements.forEach(element => { if (element) element.addEventListener('keydown', this._handleKeydown.bind(this)); }); }
    _handleKeydown(event) { if (this._interactionManager && this._interactionManager.popup.classList.contains('visible')) { return; } if (event.key !== ' ') return; const element = event.target; const cursorPosition = element.selectionStart; if (cursorPosition === 0) return; const textBeforeCursor = element.value.substring(0, cursorPosition); const lastAtIndex = textBeforeCursor.lastIndexOf('@'); if (lastAtIndex === -1 || textBeforeCursor.substring(lastAtIndex).includes(' ')) return; const potentialShortcutKey = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase(); const shortcutData = this._shortcuts.find(s => s.key === potentialShortcutKey); if (shortcutData) { event.preventDefault(); const firstStep = shortcutData.steps[0]; if (firstStep.type === 'template') { this._performReplacement(lastAtIndex, shortcutData.key, firstStep.template, {}); } else { this._interactionManager = new InteractionManager(element, this._performReplacement.bind(this)); this._interactionManager.start(shortcutData, lastAtIndex); } } }
    _performReplacement(triggerPosition, key, template, variables) { let final_text = template; for (const varName in variables) { final_text = final_text.replace(new RegExp(`{${varName}}`, 'g'), variables[varName]); } final_text += ' '; const element = document.activeElement; const originalText = element.value; const textAfterCursor = originalText.substring(triggerPosition + key.length + 1); const newText = originalText.substring(0, triggerPosition) + final_text + textAfterCursor; element.value = newText; const newCursorPosition = triggerPosition + final_text.length; element.selectionStart = element.selectionEnd = newCursorPosition; }
}

/**
 * Lógica de la Aplicación
 */
document.addEventListener('DOMContentLoaded', () => {
    console.info('[Shortkey] Módulo dinámico cargado y listo.');
    const shortkeyManager = new Shortkey();
    shortkeyManager.attach('.shortkey-enabled');

    // --- Elementos del DOM ---
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
    const stepsContainer = document.getElementById('steps-container');
    const addSelectStepBtn = document.getElementById('add-select-step-btn');
    const addTemplateStepBtn = document.getElementById('add-template-step-btn');
    const editorCancelBtn = document.getElementById('editor-cancel-btn');
    
    let currentEditingKey = null;

    // --- Funciones de Navegación y UI ---
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
        const shortcut = key ? shortkeyManager.getShortcuts().find(s => s.key === key) : null;

        if (shortcut) {
            editorKeyInput.value = shortcut.key;
            editorDescInput.value = shortcut.description;
            shortcut.steps.forEach(step => addStepToDOM(step.type, step));
        } else {
            editorForm.reset();
            addStepToDOM('template'); // Empezar con una plantilla vacía
        }
    };

    const addStepToDOM = (type, data = null) => {
        const templateId = type === 'select' ? 'template-step-select' : 'template-step-template';
        const template = document.getElementById(templateId);
        const clone = template.content.cloneNode(true);
        const stepContainer = clone.querySelector('.step-container');

        if (data) {
            // Rellenar datos si estamos editando
            stepContainer.querySelectorAll('[data-config]').forEach(input => {
                const configKey = input.dataset.config;
                if (data[configKey]) {
                    input.value = data[configKey];
                }
            });
            if (type === 'select' && data.options) {
                const optionsContainer = stepContainer.querySelector('.options-container');
                data.options.forEach(opt => addOptionToDOM(optionsContainer, opt));
            }
        }
        stepsContainer.appendChild(stepContainer);
    };

    const addOptionToDOM = (container, data = null) => {
        const template = document.getElementById('template-step-option');
        const clone = template.content.cloneNode(true);
        if (data) {
            clone.querySelectorAll('[data-config]').forEach(input => {
                const configKey = input.dataset.config;
                if (data[configKey]) input.value = data[configKey];
            });
        }
        container.appendChild(clone);
    };

    const parseEditor = () => {
        const key = editorKeyInput.value.trim().toLowerCase();
        const description = editorDescInput.value.trim();
        if (!key || !description) return null;

        const steps = [];
        stepsContainer.querySelectorAll('.step-container').forEach(stepEl => {
            const stepData = { type: stepEl.dataset.stepType };
            stepEl.querySelectorAll('[data-config]').forEach(input => {
                stepData[input.dataset.config] = input.value.trim();
            });

            if (stepData.type === 'select') {
                stepData.options = [];
                stepEl.querySelectorAll('.option-item').forEach(optEl => {
                    const optionData = {};
                    optEl.querySelectorAll('[data-config]').forEach(input => {
                        optionData[input.dataset.config] = input.value.trim();
                    });
                    stepData.options.push(optionData);
                });
            }
            steps.push(stepData);
        });
        return { key, description, steps };
    };

    const renderShortcuts = () => {
        const listContainer = document.getElementById('shortcutsList');
        listContainer.innerHTML = '';
        const shortcuts = shortkeyManager.getShortcuts();
        if (shortcuts.length === 0) {
            listContainer.innerHTML = `<p style="text-align: center; color: #6b7280; padding: 1rem;">No tienes shortkeys guardados.</p>`;
            return;
        }
        shortcuts.forEach(shortcut => {
            const item = document.createElement('div');
            item.className = 'shortcut-item';
            item.innerHTML = `
                <div>
                    <span class="shortcut-key">@${shortcut.key}</span>
                    <p class="shortcut-description">${shortcut.description}</p>
                </div>
                <div>
                    <button class="main-button edit-btn" data-key="${shortcut.key}">Editar</button>
                </div>
            `;
            listContainer.appendChild(item);
        });
    };

    // --- Event Listeners ---
    if (openBtn) openBtn.addEventListener('click', () => { showListView(); modal.classList.add('visible'); });
    closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
    overlay.addEventListener('click', () => modal.classList.remove('visible'));
    addNewBtn.addEventListener('click', () => showEditorView());
    editorCancelBtn.addEventListener('click', showListView);
    addSelectStepBtn.addEventListener('click', () => addStepToDOM('select'));
    addTemplateStepBtn.addEventListener('click', () => addStepToDOM('template'));

    editorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = parseEditor();
        if (!data) {
            alert('Por favor, completa la llave y la descripción del shortkey.');
            return;
        }
        if (currentEditingKey) {
            shortkeyManager.updateShortcut(currentEditingKey, data);
        } else {
            shortkeyManager.addShortcut(data);
        }
        showListView();
    });

    stepsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-step-btn')) {
            e.target.closest('.step-container').remove();
        }
        if (e.target.classList.contains('add-option-btn')) {
            addOptionToDOM(e.target.previousElementSibling);
        }
        if (e.target.classList.contains('remove-option-btn')) {
            e.target.closest('.option-item').remove();
        }
    });
    
    document.getElementById('shortcutsList').addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            showEditorView(e.target.dataset.key);
        }
    });

    // Carga inicial
    showListView();
});
