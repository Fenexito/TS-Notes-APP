/**
 * Clase para manejar la interacción del usuario con los shortkeys dinámicos.
 * Crea y gestiona el pop-up de opciones.
 */
class InteractionManager {
    constructor(element, onComplete) {
        this.element = element; // El <textarea> donde se escribe
        this.onComplete = onComplete; // Función a llamar cuando el flujo termina
        this.popup = document.getElementById('shortkey-interaction-popup');
        this.variables = {}; // Almacena las selecciones del usuario
        this.currentStep = null;
        this.shortkeyData = null;
        this.triggerPosition = -1;
        this.selectedOptionIndex = -1;

        this._boundHandleKeydown = this._handleKeydown.bind(this);
        this._boundHandleClick = this._handleClick.bind(this);
    }

    start(shortkeyData, triggerPosition) {
        this.shortkeyData = shortkeyData;
        this.triggerPosition = triggerPosition;
        this.variables = {};
        this.currentStep = shortkeyData.steps[0];
        this.showPopup();
        document.addEventListener('keydown', this._boundHandleKeydown, true);
        document.addEventListener('click', this._boundHandleClick, true);
    }

    showPopup() {
        if (!this.currentStep || this.currentStep.type !== 'select') {
            this.destroy();
            return;
        }

        let content = `<div class="popup-prompt">${this.currentStep.prompt}</div>`;
        this.currentStep.options.forEach((opt, index) => {
            content += `<button class="popup-option" data-index="${index}" data-value="${opt.value}" data-next="${opt.nextStep}">${opt.label}</button>`;
        });
        this.popup.innerHTML = content;
        
        this.positionPopup();
        this.popup.classList.add('visible');
        this.selectedOptionIndex = 0;
        this.updateSelectedOption();
    }
    
    positionPopup() {
        // Esta es una función simplificada. Una implementación real podría usar librerías
        // como Popper.js para un posicionamiento más robusto.
        const rect = this.element.getBoundingClientRect();
        const cursorPosition = this.element.selectionStart;
        
        // Estimación muy básica de la posición del cursor
        const textBeforeCursor = this.element.value.substring(0, cursorPosition);
        const lines = textBeforeCursor.split('\n');
        const lastLine = lines[lines.length - 1];
        const lineHeight = parseFloat(getComputedStyle(this.element).lineHeight);
        
        const top = rect.top + (lines.length * lineHeight) + window.scrollY;
        const left = rect.left + (lastLine.length * 8) + window.scrollX; // Asumiendo 8px por caracter
        
        this.popup.style.top = `${top + 5}px`;
        this.popup.style.left = `${left}px`;
    }

    destroy() {
        this.popup.classList.remove('visible');
        this.popup.innerHTML = '';
        document.removeEventListener('keydown', this._boundHandleKeydown, true);
        document.removeEventListener('click', this._boundHandleClick, true);
    }

    _handleKeydown(event) {
        event.stopPropagation();
        event.preventDefault();

        const options = this.popup.querySelectorAll('.popup-option');
        switch (event.key) {
            case 'ArrowDown':
                this.selectedOptionIndex = (this.selectedOptionIndex + 1) % options.length;
                this.updateSelectedOption();
                break;
            case 'ArrowUp':
                this.selectedOptionIndex = (this.selectedOptionIndex - 1 + options.length) % options.length;
                this.updateSelectedOption();
                break;
            case 'Enter':
            case 'Tab':
                this.selectOption(options[this.selectedOptionIndex]);
                break;
            case 'Escape':
                this.destroy();
                break;
        }
    }
    
    _handleClick(event) {
        const option = event.target.closest('.popup-option');
        if (option && this.popup.contains(option)) {
            this.selectOption(option);
        } else {
            this.destroy();
        }
    }

    updateSelectedOption() {
        const options = this.popup.querySelectorAll('.popup-option');
        options.forEach((opt, index) => {
            opt.classList.toggle('selected', index === this.selectedOptionIndex);
        });
    }

    selectOption(optionElement) {
        if (!optionElement) return;
        const value = optionElement.dataset.value;
        const nextStepId = optionElement.dataset.next;
        this.variables[this.currentStep.id] = value;

        const nextStep = this.shortkeyData.steps.find(s => s.id === nextStepId);
        if (nextStep && nextStep.type === 'select') {
            this.currentStep = nextStep;
            this.showPopup();
        } else if (nextStep && nextStep.type === 'template') {
            this.onComplete(this.triggerPosition, this.shortkeyData.key, nextStep.template, this.variables);
            this.destroy();
        } else {
            this.destroy();
        }
    }
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
            // Datos de ejemplo con el nuevo formato
            this._shortcuts = [
                {
                    key: 'sds',
                    description: 'Un saludo simple.',
                    steps: [{ id: 'result', type: 'template', template: 'Saludos cordiales,' }]
                },
                {
                    key: 'cxinternet',
                    description: 'Reporte de problema de internet.',
                    steps: [
                        {
                            id: 'type',
                            type: 'select',
                            prompt: 'Tipo de conexión:',
                            options: [
                                { label: 'Fibra Óptica', value: 'Fibra', nextStep: 'result' },
                                { label: 'Cobre', value: 'Cobre', nextStep: 'result' }
                            ]
                        },
                        {
                            id: 'result',
                            type: 'template',
                            template: 'Cliente reporta inconvenientes con su servicio de internet tipo {type}. Se ha iniciado el proceso de diagnóstico.'
                        }
                    ]
                }
            ];
            this._saveShortcuts();
        }
    }

    _saveShortcuts() {
        localStorage.setItem('userShortkeys', JSON.stringify(this._shortcuts));
    }
    
    getShortcuts() { return this._shortcuts; }

    attach(selectorOrElement) {
        const elements = typeof selectorOrElement === 'string' ? document.querySelectorAll(selectorOrElement) : [selectorOrElement];
        elements.forEach(element => {
            if (element) element.addEventListener('keydown', this._handleKeydown.bind(this));
        });
    }

    _handleKeydown(event) {
        if (this._interactionManager && this._interactionManager.popup.classList.contains('visible')) {
            return; // Si el pop-up está activo, no hacemos nada aquí.
        }
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
            const firstStep = shortcutData.steps[0];
            if (firstStep.type === 'template') {
                this._performReplacement(lastAtIndex, shortcutData.key, firstStep.template, {});
            } else {
                this._interactionManager = new InteractionManager(element, this._performReplacement.bind(this));
                this._interactionManager.start(shortcutData, lastAtIndex);
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
    
    const openModal = () => {
        renderShortcuts();
        modal.classList.add('visible');
    };
    const closeModal = () => modal.classList.remove('visible');

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
                </div>
                <div class="shortcut-description">${shortcut.description}</div>
            `;
            listContainer.appendChild(item);
        });
    };

    if (openBtn) openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('visible')) closeModal();
        if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
            e.preventDefault();
            modal.classList.contains('visible') ? closeModal() : openModal();
        }
    });
});
