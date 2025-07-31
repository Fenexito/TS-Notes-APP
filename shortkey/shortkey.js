class PopupManager {
    constructor() {
        this.searchPopup = document.getElementById('shortkey-search-popup');
        this.interactionPopup = document.getElementById('shortkey-interaction-popup');
        this.activePopup = null;
        this.activeTextarea = null;
        this.selectedIndex = 0;
    }

    showSearch(textarea, content) {
        this.activeTextarea = textarea;
        this.show(this.searchPopup, content);
    }

    showInteraction(textarea, title, options, callback) {
        this.activeTextarea = textarea;
        const ul = document.createElement('ul');
        options.forEach((option, index) => {
            const li = document.createElement('li');
            li.dataset.index = index;
            li.innerHTML = `<span class="option-label">${option.label}</span>`;
            li.addEventListener('click', () => callback(option));
            ul.appendChild(li);
        });
        const content = `<h5>${title}</h5>`;
        this.interactionPopup.innerHTML = content;
        this.interactionPopup.appendChild(ul);
        this.show(this.interactionPopup);
    }

    show(popup, content = null) {
        if (content) {
            popup.innerHTML = content;
        }
        const pos = this.getCursorPosition(this.activeTextarea);
        popup.style.top = `${pos.top + 20}px`;
        popup.style.left = `${pos.left}px`;
        popup.style.display = 'block';
        this.activePopup = popup;
        this.selectedIndex = 0;
        this.updateSelection();
    }

    hide() {
        if (this.activePopup) {
            this.activePopup.style.display = 'none';
            this.activePopup.innerHTML = '';
        }
        this.activePopup = null;
        this.activeTextarea = null;
    }

    getCursorPosition(textarea) {
        const dummy = document.createElement('div');
        const style = window.getComputedStyle(textarea);
        ['font', 'letterSpacing', 'lineHeight', 'padding', 'textTransform', 'whiteSpace', 'wordBreak', 'wordSpacing', 'wordWrap'].forEach(prop => {
            dummy.style[prop] = style[prop];
        });
        dummy.style.position = 'absolute';
        dummy.style.visibility = 'hidden';
        dummy.style.top = `${textarea.offsetTop}px`;
        dummy.style.left = `${textarea.offsetLeft}px`;
        dummy.style.width = `${textarea.clientWidth}px`;
        document.body.appendChild(dummy);

        const text = textarea.value.substring(0, textarea.selectionStart);
        dummy.textContent = text;
        
        const span = document.createElement('span');
        span.textContent = '.';
        dummy.appendChild(span);
        
        const pos = {
            top: span.offsetTop + textarea.offsetTop - textarea.scrollTop,
            left: span.offsetLeft + textarea.offsetLeft - textarea.scrollLeft,
        };
        
        document.body.removeChild(dummy);
        return pos;
    }

    navigate(direction) {
        if (!this.activePopup) return;
        const items = this.activePopup.querySelectorAll('li');
        if (items.length === 0) return;
        
        this.selectedIndex += direction;
        
        if (this.selectedIndex < 0) this.selectedIndex = items.length - 1;
        if (this.selectedIndex >= items.length) this.selectedIndex = 0;
        
        this.updateSelection();
    }

    selectItem() {
        if (!this.activePopup) return false;
        const items = this.activePopup.querySelectorAll('li');
        if (items[this.selectedIndex]) {
            items[this.selectedIndex].click();
            return true;
        }
        return false;
    }

    updateSelection() {
        const items = this.activePopup.querySelectorAll('li');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
    }
}

class Shortkey {
    constructor() {
        this.storageKey = 'shortkeys';
        this.shortkeys = this.loadShortkeys();
        this.popupManager = new PopupManager();
        this.dom = this.getDomElements();
        this.currentDynamicState = null;
        this.isModalOpen = false;
        this.init();
    }

    getDomElements() {
        return {
            settingsModal: document.getElementById('settingsModal'),
            modalOverlay: document.getElementById('modalOverlay'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            shortcutsList: document.getElementById('shortcutsList'),
            addNewBtn: document.getElementById('add-new-shortkey-btn'),
            viewList: document.getElementById('view-list'),
            viewEditor: document.getElementById('view-editor'),
            editorForm: document.getElementById('shortkey-editor-form'),
            editorKey: document.getElementById('editor-key'),
            editorDescription: document.getElementById('editor-description'),
            simpleModeView: document.getElementById('simple-mode-view'),
            dynamicModeView: document.getElementById('dynamic-mode-view'),
            stepsContainer: document.getElementById('steps-container'),
            templateStepContainer: document.getElementById('template-step-container'),
            livePreviewOutput: document.getElementById('live-preview-output'),
            addSelectStepBtn: document.getElementById('add-select-step-btn'),
            editorCancelBtn: document.getElementById('editor-cancel-btn'),
            editorSaveBtn: document.getElementById('editor-save-btn'),
            templates: {
                select: document.getElementById('template-step-select'),
                option: document.getElementById('template-step-option'),
                template: document.getElementById('template-step-template'),
            },
        };
    }

    init() {
        this.attachToTextareas();
        this.initEventListeners();
        this.renderShortcutsList();
    }

    loadShortkeys() {
        const data = localStorage.getItem(this.storageKey);
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error parsing shortkeys from localStorage", e);
            return [];
        }
    }

    saveShortkeys() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.shortkeys));
        this.renderShortcutsList();
    }

    attachToTextareas() {
        document.querySelectorAll('textarea').forEach(textarea => {
            // Avoid attaching to our own editor textareas
            if (!textarea.closest('#settingsModal')) {
                textarea.addEventListener('input', (e) => this.handleTextareaInput(e));
                textarea.addEventListener('keydown', (e) => this.handleTextareaKeydown(e));
            }
        });
    }

    handleTextareaInput(e) {
        const textarea = e.target;
        const text = textarea.value.substring(0, textarea.selectionStart);
        const atMatch = text.match(/@(\w*)$/);

        if (this.currentDynamicState) {
            this.popupManager.hide();
            return;
        }

        if (atMatch) {
            const query = atMatch[1];
            const filtered = this.shortkeys.filter(s => s.key.startsWith(query));
            if (filtered.length > 0) {
                const listHtml = `<ul>${filtered.map((s, i) => `<li data-key="${s.key}" data-index="${i}">
                    <span class="shortkey-name">@${s.key}</span>
                    <span class="shortkey-description">${s.mode === 'simple' ? s.description.substring(0, 30) : 'Dinámico'}</span>
                </li>`).join('')}</ul>`;
                this.popupManager.showSearch(textarea, listHtml);
                this.popupManager.searchPopup.querySelectorAll('li').forEach(li => {
                    li.addEventListener('click', () => this.triggerShortkey(textarea, li.dataset.key));
                });
            } else {
                this.popupManager.hide();
            }
        } else {
            this.popupManager.hide();
        }
    }

    handleTextareaKeydown(e) {
        if (this.popupManager.activePopup) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.popupManager.navigate(e.key === 'ArrowDown' ? 1 : -1);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (!this.popupManager.selectItem()) {
                    this.popupManager.hide();
                }
            } else if (e.key === 'Escape') {
                this.popupManager.hide();
            }
        }
    }

    triggerShortkey(textarea, key) {
        const shortkey = this.shortkeys.find(s => s.key === key);
        this.popupManager.hide();

        if (shortkey.mode === 'simple') {
            this.replaceText(textarea, `@${key}`, shortkey.description);
        } else if (shortkey.mode === 'dynamic') {
            this.startDynamicFlow(textarea, shortkey);
        }
    }

    replaceText(textarea, find, replace) {
        const text = textarea.value;
        const cursorPos = textarea.selectionStart;
        const textBefore = text.substring(0, cursorPos);
        const lastAtIndex = textBefore.lastIndexOf(find);

        if (lastAtIndex !== -1) {
            const newText = text.substring(0, lastAtIndex) + replace + text.substring(cursorPos);
            textarea.value = newText;
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = lastAtIndex + replace.length;
        }
    }

    startDynamicFlow(textarea, shortkey) {
        this.currentDynamicState = {
            textarea,
            shortkey,
            values: {},
            currentStepId: shortkey.steps[0]?.id || 'result',
        };
        this.processDynamicStep();
    }

    processDynamicStep() {
        const { shortkey, currentStepId } = this.currentDynamicState;

        if (currentStepId === 'result') {
            this.finishDynamicFlow();
            return;
        }

        const step = shortkey.steps.find(s => s.id === currentStepId);
        if (step.type === 'select') {
            this.popupManager.showInteraction(this.currentDynamicState.textarea, step.prompt, step.options, (selectedOption) => {
                this.currentDynamicState.values[step.id] = selectedOption.value;
                this.currentDynamicState.currentStepId = selectedOption.nextStep || 'result';
                this.processDynamicStep();
            });
        }
    }

    finishDynamicFlow() {
        let resultText = this.currentDynamicState.shortkey.resultTemplate;
        for (const key in this.currentDynamicState.values) {
            resultText = resultText.replace(new RegExp(`{${key}}`, 'g'), this.currentDynamicState.values[key]);
        }
        
        this.replaceText(this.currentDynamicState.textarea, `@${this.currentDynamicState.shortkey.key}`, resultText);
        this.currentDynamicState = null;
    }

    initEventListeners() {
        this.dom.closeSettingsBtn.addEventListener('click', () => this.closeModal());
        this.dom.modalOverlay.addEventListener('click', () => this.closeModal());
        this.dom.addNewBtn.addEventListener('click', () => this.showEditor());
        this.dom.editorCancelBtn.addEventListener('click', () => this.showList());
        this.dom.editorForm.addEventListener('submit', (e) => this.handleSave(e));

        this.dom.addSelectStepBtn.addEventListener('click', () => this.addStep('select'));
        
        // Auto-resize for flexible textareas
        document.addEventListener('input', e => {
            if (e.target.matches('.step-textarea-flexible')) {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
            }
        });
    }
    
    openModal() {
        this.dom.settingsModal.style.display = 'block';
        this.isModalOpen = true;
        this.renderShortcutsList();
        this.showList();
    }

    closeModal() {
        this.dom.settingsModal.style.display = 'none';
        this.isModalOpen = false;
    }
    
    showList() {
        this.dom.viewList.classList.remove('hidden');
        this.dom.viewEditor.classList.add('hidden');
    }

    showEditor(shortkeyToEdit = null) {
        this.dom.viewList.classList.add('hidden');
        this.dom.viewEditor.classList.remove('hidden');
        this.buildEditor(shortkeyToEdit);
    }
    
    renderShortcutsList() {
        const list = this.dom.shortcutsList;
        list.innerHTML = '';
        if (this.shortkeys.length === 0) {
            list.innerHTML = '<div class="shortcut-item"><p>No hay shortkeys guardados.</p></div>';
            return;
        }

        this.shortkeys.forEach((shortkey, index) => {
            const item = document.createElement('div');
            item.className = 'shortcut-item';
            item.dataset.id = shortkey.id;
            item.dataset.index = index;
            item.draggable = true;
            
            let preview = shortkey.mode === 'simple'
                ? shortkey.description
                : `Dinámico: ${shortkey.resultTemplate}`;

            item.innerHTML = `
                <span class="drag-handle">::</span>
                <div class="shortcut-details">
                    <div class="shortcut-key">@${shortkey.key}</div>
                    <div class="shortcut-preview">${preview.substring(0, 60)}${preview.length > 60 ? '...' : ''}</div>
                </div>
                <div class="shortcut-actions">
                    <button class="edit-btn">Editar</button>
                    <button class="delete-btn">Eliminar</button>
                </div>
            `;
            list.appendChild(item);
        });

        // Event listeners for actions
        list.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', e => {
            const id = e.target.closest('.shortcut-item').dataset.id;
            const sk = this.shortkeys.find(s => s.id === id);
            this.showEditor(sk);
        }));
        list.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', e => {
            const id = e.target.closest('.shortcut-item').dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar este shortkey?')) {
                this.shortkeys = this.shortkeys.filter(s => s.id !== id);
                this.saveShortkeys();
            }
        }));
        
        // Drag and drop logic
        let draggedItem = null;
        list.addEventListener('dragstart', e => {
            draggedItem = e.target;
            e.target.classList.add('dragging');
        });
        list.addEventListener('dragend', e => {
            if (draggedItem) {
                draggedItem.classList.remove('dragging');
                draggedItem = null;
                this.updateOrderFromDOM();
            }
        });
        list.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(list, e.clientY);
            const currentElement = document.querySelector('.dragging');
            if (afterElement == null) {
                list.appendChild(currentElement);
            } else {
                list.insertBefore(currentElement, afterElement);
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.shortcut-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    updateOrderFromDOM() {
        const newOrder = [];
        this.dom.shortcutsList.querySelectorAll('.shortcut-item').forEach(item => {
            const id = item.dataset.id;
            const shortkey = this.shortkeys.find(sk => sk.id === id);
            if(shortkey) newOrder.push(shortkey);
        });
        this.shortkeys = newOrder;
        this.saveShortkeys();
    }
    
    buildEditor(shortkey) {
        this.dom.editorForm.reset();
        this.dom.editorForm.dataset.id = shortkey ? shortkey.id : '';
        this.dom.stepsContainer.innerHTML = '';
        this.dom.templateStepContainer.innerHTML = '';

        const isDynamic = shortkey ? shortkey.mode === 'dynamic' : false;
        
        this.dom.simpleModeView.classList.toggle('hidden', isDynamic);
        this.dom.dynamicModeView.classList.toggle('hidden', !isDynamic);
        this.dom.addSelectStepBtn.classList.toggle('hidden', !isDynamic);
        
        if (shortkey) {
            this.dom.editorKey.value = shortkey.key;
            if (isDynamic) {
                shortkey.steps.forEach(step => this.addStep(step.type, step));
                this.addStep('template', { id: 'result', template: shortkey.resultTemplate });
            } else {
                this.dom.editorDescription.value = shortkey.description;
            }
        } else {
            // Default to simple mode for new shortkey
            this.dom.simpleModeView.classList.remove('hidden');
            this.dom.dynamicModeView.classList.add('hidden');
            this.dom.addSelectStepBtn.classList.add('hidden');
            // But let's add a toggle to switch to dynamic
            // For now, let's assume we start simple and can convert later.
            // For this implementation, we will use a "hacky" way to go dynamic: clear description
            // A better way would be a dedicated button.
        }

        // Add a "dummy" mode selector for now
        // This is a simplified approach
        const isDescriptionEmpty = this.dom.editorDescription.value.trim() === '';
        if (shortkey && shortkey.mode === 'simple' && isDescriptionEmpty) {
            // If editing a simple one and user clears description, show dynamic options
            this.dom.dynamicModeView.classList.remove('hidden');
            this.dom.addSelectStepBtn.classList.remove('hidden');
            if (this.dom.templateStepContainer.innerHTML === '') {
                 this.addStep('template', { id: 'result', template: '' });
            }
        }
        
        // MODIFICACIÓN: Listener para la plantilla final para actualizar la vista previa
        const resultTextarea = this.dom.templateStepContainer.querySelector('[data-config="template"]');
        if (resultTextarea) {
            resultTextarea.addEventListener('input', () => this.updateLivePreview());
        }
        
        this.updateLivePreview();
    }

    addStep(type, data = {}) {
        const template = this.dom.templates[type];
        if (!template) return;

        const newStep = template.content.cloneNode(true).firstElementChild;
        const container = type === 'template' ? this.dom.templateStepContainer : this.dom.stepsContainer;
        
        if (type === 'select') {
            newStep.querySelector('.remove-step-btn').addEventListener('click', (e) => {
                const stepElement = e.target.closest('.step-container');
                const idToRemove = stepElement.querySelector('[data-config="id"]').value;
                this.updateTemplateOnDelete(idToRemove); // MODIFICACIÓN
                stepElement.remove();
                this.updateLivePreview();
            });

            newStep.querySelector('.add-option-btn').addEventListener('click', (e) => {
                const optionsContainer = e.target.previousElementSibling;
                this.addOption(optionsContainer);
            });
            
            // MODIFICACIÓN: Listeners para sincronizar ID con la plantilla final
            const idInput = newStep.querySelector('[data-config="id"]');
            idInput.addEventListener('focus', () => { idInput.dataset.oldValue = idInput.value; });
            idInput.addEventListener('input', () => {
                const oldValue = idInput.dataset.oldValue || '';
                this.updateTemplateOnIdChange(oldValue, idInput.value);
                idInput.dataset.oldValue = idInput.value;
            });

            if (data.options) {
                const optionsContainer = newStep.querySelector('.options-container');
                data.options.forEach(opt => this.addOption(optionsContainer, opt));
            }
        }
        
        // Populate data
        Object.keys(data).forEach(key => {
            const input = newStep.querySelector(`[data-config="${key}"]`);
            if (input) input.value = data[key];
        });

        container.appendChild(newStep);
    }
    
    addOption(container, data = {}) {
        const template = this.dom.templates.option;
        const newOption = template.content.cloneNode(true).firstElementChild;
        newOption.querySelector('.remove-option-btn').addEventListener('click', (e) => e.target.closest('.option-item').remove());
        
        Object.keys(data).forEach(key => {
            const input = newOption.querySelector(`[data-config="${key}"]`);
            if (input) input.value = data[key];
        });

        // Trigger input event to resize textarea if it has content
        const textarea = newOption.querySelector('.step-textarea-flexible');
        if (data.value) {
             setTimeout(() => textarea.dispatchEvent(new Event('input')), 0);
        }

        container.appendChild(newOption);
        this.updateLivePreview();
    }
    
    // MODIFICACIÓN: Nuevas funciones para interactividad
    updateTemplateOnIdChange(oldId, newId) {
        const resultTextarea = this.dom.templateStepContainer.querySelector('[data-config="template"]');
        if (!resultTextarea) return;

        const currentTemplate = resultTextarea.value;
        if (oldId && currentTemplate.includes(`{${oldId}}`)) {
            resultTextarea.value = currentTemplate.replace(new RegExp(`{${oldId}}`, 'g'), `{${newId}}`);
        } else if (newId && !currentTemplate.includes(`{${newId}}`)) {
            resultTextarea.value = (resultTextarea.value + ` {${newId}}`).trim();
        }
        this.updateLivePreview();
    }
    
    updateTemplateOnDelete(idToRemove) {
        if (!idToRemove) return;
        const resultTextarea = this.dom.templateStepContainer.querySelector('[data-config="template"]');
        if (!resultTextarea) return;
        
        // Regex para eliminar la variable y un posible espacio delante de ella
        resultTextarea.value = resultTextarea.value.replace(new RegExp(`\\s?{${idToRemove}}`, 'g'), '').trim();
    }

    updateLivePreview() {
        const shortkeyData = this.getShortkeyDataFromForm();
        const previewContainer = this.dom.livePreviewOutput;

        if (!shortkeyData || shortkeyData.mode !== 'dynamic') {
            previewContainer.textContent = '';
            return;
        }

        const sampleValues = {};
        shortkeyData.steps.forEach(step => {
            if (step.type === 'select' && step.options.length > 0) {
                // Usa el valor de la primera opción como ejemplo
                sampleValues[step.id] = step.options[0].value || `[${step.options[0].label}]`;
            }
        });

        let previewText = shortkeyData.resultTemplate;
        for (const id in sampleValues) {
            previewText = previewText.replace(new RegExp(`{${id}}`, 'g'), sampleValues[id]);
        }
        
        // Reemplazar variables que no tienen valor de ejemplo
        previewText = previewText.replace(/{([a-zA-Z0-9_]+)}/g, '[$1]');
        
        previewContainer.textContent = previewText;
    }

    // MODIFICACIÓN: Añadir llamada a updateLivePreview en moveStep
    moveStepUp(button) {
        const step = button.closest('.step-container');
        if (step.previousElementSibling) {
            step.parentElement.insertBefore(step, step.previousElementSibling);
            this.updateLivePreview();
        }
    }
    moveStepDown(button) {
        const step = button.closest('.step-container');
        if (step.nextElementSibling) {
            step.parentElement.insertBefore(step.nextElementSibling, step);
            this.updateLivePreview();
        }
    }

    handleSave(e) {
        e.preventDefault();
        const shortkeyData = this.getShortkeyDataFromForm();
        
        if (!shortkeyData.key) {
            alert('El activador (key) es obligatorio.');
            return;
        }
        
        const existingId = this.dom.editorForm.dataset.id;
        if (existingId) {
            const index = this.shortkeys.findIndex(s => s.id === existingId);
            this.shortkeys[index] = { ...this.shortkeys[index], ...shortkeyData };
        } else {
            // Check for duplicate key
            if (this.shortkeys.some(s => s.key === shortkeyData.key)) {
                alert('Ya existe un shortkey con este activador.');
                return;
            }
            this.shortkeys.push({ id: `sk_${Date.now()}`, ...shortkeyData });
        }
        
        this.saveShortkeys();
        this.showList();
    }

    getShortkeyDataFromForm() {
        const form = this.dom.editorForm;
        const key = form.querySelector('#editor-key').value;
        const description = form.querySelector('#editor-description').value;
        const isDynamic = !this.dom.dynamicModeView.classList.contains('hidden');

        const data = { key };
        
        if (isDynamic) {
            data.mode = 'dynamic';
            data.steps = Array.from(this.dom.stepsContainer.querySelectorAll('.step-container')).map(stepEl => {
                const stepData = {
                    type: stepEl.dataset.stepType,
                    id: stepEl.querySelector('[data-config="id"]')?.value,
                    prompt: stepEl.querySelector('[data-config="prompt"]')?.value,
                    options: Array.from(stepEl.querySelectorAll('.option-item')).map(optEl => ({
                        label: optEl.querySelector('[data-config="label"]').value,
                        value: optEl.querySelector('[data-config="value"]').value,
                        nextStep: optEl.querySelector('[data-config="nextStep"]').value,
                    }))
                };
                return stepData;
            });
            data.resultTemplate = this.dom.templateStepContainer.querySelector('[data-config="template"]')?.value || '';
        } else {
            data.mode = 'simple';
            data.description = description;
        }

        return data;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const shortkeyApp = new Shortkey();
    
    // Quick way to open the modal for demonstration
    // In a real app, this would be tied to a settings button
    window.openShortkeySettings = () => {
        shortkeyApp.openModal();
    };
    // To test, you can open your browser console and type: openShortkeySettings()
});