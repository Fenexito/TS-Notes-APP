/**
 * Clase para manejar los pop-ups de interacción y búsqueda.
 * (Sin cambios en esta clase)
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
 * (Lógica de ejecución sin cambios)
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
        if (saved) {
            const parsed = JSON.parse(saved);
            this._shortcuts = parsed.map(s => ({ ...s, tags: s.tags || [] }));
        } else {
            this._shortcuts = [
                { key: 'sds', description: 'Saludos cordiales,', steps: [], tags: ['general'] },
                { key: 'cxtv', description: 'Flujo de TV.', steps: [ { id: 'issue', type: 'select', name: 'Problema TV', x: 100, y: 150, options: [ { label: 'stb_no_boot', value: 'tv is not powering on', nextStep: 'result' }, { label: 'recording', value: 'cx cannot record', nextStep: 'recordings' } ] }, { id: 'recordings', type: 'select', name: 'Grabaciones', x: 380, y: 250, options: [ { label: 'rec_list', value: 'cannot see the recording list', nextStep: 'result' }, { label: 'play_rec', value: 'cx cannot play recordings', nextStep: 'result' } ] }, { id: 'result', type: 'template', template: '{issue} {recordings}.', x: 600, y: 150 } ], tags: ['cx_issue', 'troubleshooting'] }
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
        const elementTag = this._currentElement.dataset.shortkeyTag || null;

        const filteredShortcuts = this._shortcuts.filter(s => {
            const queryMatch = s.key.toLowerCase().startsWith(query);
            if (!queryMatch) return false;
            
            if (!s.tags || s.tags.length === 0) return true;
            if (!elementTag) return true;
            
            return s.tags.includes(elementTag);
        });

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
            const firstStep = shortcutData.steps.find(s => s.type === 'select');
            this._runDynamicFlow(shortcutData, {}, firstStep);
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
            this._activePopupManager.show(currentStep.options, 'interaction', currentStep.name || currentStep.id);
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
 * Lógica de la Aplicación y del Editor de Flujo
 */
document.addEventListener('DOMContentLoaded', () => {
    console.info('[Shortkey] Módulo de flujo visual cargado y listo.');
    
    const PREDEFINED_TAGS = ['cx_issue', 'ts_steps', 'general', 'billing', 'sales'];
    const shortkeyManager = new Shortkey();
    shortkeyManager.attach('.shortkey-enabled');

    const modal = document.getElementById('settingsModal');
    const modalContainer = modal.querySelector('.modal-container');
    const modalTitle = document.getElementById('modal-title');
    const closeBtn = document.getElementById('closeSettingsBtn');
    const overlay = document.getElementById('modalOverlay');
    const viewList = document.getElementById('view-list');
    const viewEditor = document.getElementById('view-editor');
    const addNewBtn = document.getElementById('add-new-shortkey-btn');
    const editorActions = document.getElementById('editor-actions-sticky');
    const editorCancelBtn = document.getElementById('editor-cancel-btn');
    const editorSaveBtn = document.getElementById('editor-save-btn');
    
    const confirmModal = document.getElementById('confirm-modal');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const confirmDiscardBtn = document.getElementById('confirm-discard-btn');
    const confirmSaveBtn = document.getElementById('confirm-save-btn');
    
    const genericConfirmModal = document.getElementById('generic-confirm-modal');
    let genericConfirmCallback = null;
    
    let currentEditingKey = null;
    let currentTags = [];
    let isDirty = false;
    let flowState = {};
    let panningState = { active: false, startX: 0, startY: 0, initialNodePositions: {} };

    // ---------- Utilidades de validación visual ----------
    const isEmpty = (v) => !v || String(v).trim() === '';
    const toggleRequired = (el, on) => {
        if (!el) return;
        if (on) el.classList.add('required-field-error');
        else el.classList.remove('required-field-error');
    };
    function applyValidationStyles() {
        // Header
        const keyInput = document.getElementById('shortkey-key-input');
        const descInput = document.getElementById('shortkey-desc-input');
        toggleRequired(keyInput, isEmpty(keyInput?.value));
        toggleRequired(descInput, isEmpty(descInput?.value));

        // Panel de propiedades visible
        document.querySelectorAll('#flow-properties-content #prop-name, #flow-properties-content .option-prop-input, #flow-properties-content #final-template').forEach(el => {
            // etiquetas NO son requeridas; el resto sí
            const isReadonly = el.hasAttribute('readonly');
            // el prop-name de result es readonly; no se marca
            if (!isReadonly) toggleRequired(el, isEmpty(el.value));
        });
    }

    function setupHeaderValidationListeners() {
        const keyInput = document.getElementById('shortkey-key-input');
        const descInput = document.getElementById('shortkey-desc-input');
        [keyInput, descInput].forEach(el => {
            if (!el) return;
            el.addEventListener('input', (e) => {
                toggleRequired(e.target, isEmpty(e.target.value));
            });
        });
    }

    // ---------- Render/editor ----------
    function setupFlowEditor() {
        viewEditor.innerHTML = `
            <div class="flow-editor-content">
                <div class="flow-editor-header">
                    <div class="input-group">
                        <label for="shortkey-key-input">Activador (Key)</label>
                        <div class="key-input-wrapper">
                            <span class="key-input-prefix">@</span>
                            <input type="text" id="shortkey-key-input" placeholder="mi_shortkey">
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="shortkey-desc-input">Descripción</label>
                        <input type="text" id="shortkey-desc-input" placeholder="Descripción breve para la lista">
                    </div>
                    <div class="input-group">
                        <label>Etiquetas</label>
                        <div id="tags-editor" class="tags-editor-wrapper"></div>
                    </div>
                </div>
                <div id="flow-canvas-container" class="canvas-container">
                    <svg id="flow-connector-svg">
                        <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--gray-500)"></path>
                            </marker>
                        </defs>
                    </svg>
                    <div id="flow-node-container"></div>
                    <button id="add-select-node-btn-floating">+ Añadir Pregunta</button>
                </div>
            </div>
            <div id="flow-properties-panel" class="properties-panel">
                <div id="flow-properties-content" class="space-y-4"></div>
            </div>
        `;
        addFlowEventListeners();
        setupTagEditor();
        setupHeaderValidationListeners();
    }

    function addFlowEventListeners() {
        const canvas = document.getElementById('flow-canvas-container');
        const svg = document.getElementById('flow-connector-svg');

        canvas.addEventListener('mousemove', onFlowMouseMove);
        canvas.addEventListener('mouseup', onFlowMouseUp);

        // Panning “infinito”: ahora también con click izquierdo sobre el fondo
        canvas.addEventListener('mousedown', (e) => {
            const isCanvasBackground = e.target === canvas;
            const wantPan = isCanvasBackground && (e.button === 1 || e.altKey || e.button === 0);
            if (wantPan) {
                panningState.active = true;
                panningState.startX = e.clientX;
                panningState.startY = e.clientY;
                panningState.initialNodePositions = {};
                Object.values(flowState.nodes).forEach(node => {
                    panningState.initialNodePositions[node.id] = { x: node.x, y: node.y };
                });
                canvas.style.cursor = 'grabbing';
                // Si solo se hace click breve, también permite deseleccionar
                if (e.button === 0 && !e.altKey) {
                    selectNode(null);
                }
            } else if (isCanvasBackground) {
                selectNode(null);
            }
        });

        document.getElementById('add-select-node-btn-floating').addEventListener('click', addSelectNode);
        
        viewEditor.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-node-btn');
            if (deleteBtn) {
                deleteNode(deleteBtn.dataset.nodeId);
            }
        });

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                svg.setAttribute('width', width);
                svg.setAttribute('height', height);
                renderFlowConnections();
            }
        });

        if (canvas) {
            resizeObserver.observe(canvas);
        }
    }
    
    function resetFlowState() {
        flowState = {
            nodes: {},
            selectedNodeId: null,
            dragging: { active: false, id: null, offsetX: 0, offsetY: 0 },
            connecting: { active: false, fromNodeId: null, fromOptionIndex: null, tempLine: null }
        };
        currentTags = [];
    }

    function renderFlow() {
        window.requestAnimationFrame(() => {
            renderFlowNodes();
            renderFlowConnections();
            renderFlowProperties();
            applyValidationStyles();
        });
    }

    function renderFlowNodes() {
        const container = document.getElementById('flow-node-container');
        if (!container) return;
        container.innerHTML = '';
        Object.values(flowState.nodes).forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.id = node.id;
            nodeEl.className = 'node';
            if (node.id === flowState.selectedNodeId) nodeEl.classList.add('selected');
            if (node.type === 'result') nodeEl.style.borderColor = 'var(--brand-green)';
            nodeEl.style.left = `${node.x}px`;
            nodeEl.style.top = `${node.y}px`;

            let optionsHTML = '';
            if (node.type === 'select') {
                optionsHTML = node.options.map((opt, index) => `
                    <div class="option">
                        <span>${opt.label || `Opción ${index + 1}`}</span>
                        <div class="connector-dot" data-node-id="${node.id}" data-option-index="${index}"></div>
                    </div>
                `).join('');
            }

            nodeEl.innerHTML = `
                <div class="connector-dot-in"></div>
                <div class="node-header" style="${node.type === 'result' ? 'background-color: #dcfce7;' : ''}">
                    <span class="node-title">${node.name}</span>
                    ${node.type !== 'result' ? `<button class="delete-node-btn" data-node-id="${node.id}">&times;</button>` : ''}
                </div>
                <div class="node-options">${optionsHTML}</div>
            `;
            container.appendChild(nodeEl);
        });
        
        document.querySelectorAll('.node').forEach(el => el.addEventListener('mousedown', onNodeMouseDown));
        document.querySelectorAll('.connector-dot').forEach(el => el.addEventListener('mousedown', onConnectorMouseDown));
    }

    function renderFlowConnections() {
        const svg = document.getElementById('flow-connector-svg');
        const canvas = document.getElementById('flow-canvas-container');
        if (!svg || !canvas) return;
        
        const defs = svg.querySelector('defs');
        svg.innerHTML = '';
        if(defs) svg.appendChild(defs);

        const canvasRect = canvas.getBoundingClientRect();

        Object.values(flowState.nodes).forEach(node => {
            if (node.type === 'select') {
                node.options.forEach((opt, index) => {
                    if (opt.nextStep && flowState.nodes[opt.nextStep]) {
                        const fromEl = document.querySelector(`.connector-dot[data-node-id="${CSS.escape(node.id)}"][data-option-index="${index}"]`);
                        const toEl = document.getElementById(CSS.escape(opt.nextStep));
                        if (fromEl && toEl) {
                            const toDot = toEl.querySelector('.connector-dot-in');
                            const fromRect = fromEl.getBoundingClientRect();
                            const toRect = toDot.getBoundingClientRect();

                            const startX = fromRect.left - canvasRect.left + fromRect.width / 2;
                            const startY = fromRect.top - canvasRect.top + fromRect.height / 2;
                            const endX = toRect.left - canvasRect.left + toRect.width / 2;
                            const endY = toRect.top - canvasRect.top + toRect.height / 2;
                            
                            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            path.setAttribute('d', `M ${startX} ${startY} C ${startX + 60} ${startY}, ${endX - 60} ${endY}, ${endX} ${endY}`);
                            path.setAttribute('class', 'connector-line');
                            svg.appendChild(path);
                        }
                    }
                });
            }
        });
    }

    function renderFlowProperties() {
        const container = document.getElementById('flow-properties-content');
        if (!container) return;

        const resultNode = flowState.nodes.result;
        const variablePills = Object.values(flowState.nodes)
            .filter(node => node.type === 'select' && node.id)
            .map(node => `<span class="variable-pill" draggable="true" data-variable-id="${node.id}">{${node.id}}</span>`)
            .join(' ');

        const templateEditorHTML = `
            <div class="properties-section">
                 <h3 class="font-semibold text-sm">Plantilla de Texto Final</h3>
                 <p class="text-xs text-gray-500 mb-2">Escribe o arrastra las variables de abajo.</p>
                 <textarea id="final-template" class="w-full p-2 mt-1 border rounded-lg font-mono text-sm" rows="5"></textarea>
                 <div class="variable-pills-container">
                    <small>Variables disponibles:</small>
                    ${variablePills}
                 </div>
            </div>
        `;

        if (!flowState.selectedNodeId || !flowState.nodes[flowState.selectedNodeId]) {
            container.innerHTML = `<p class="text-gray-500">Selecciona un nodo para ver sus propiedades o añade una nueva pregunta.</p>${templateEditorHTML}`;
            if(resultNode) document.getElementById('final-template').value = resultNode.template || '';
            addPropertiesEventListeners();
            return;
        }

        const node = flowState.nodes[flowState.selectedNodeId];
        let optionsEditor = '';
        if (node.type === 'select') {
            const optionsHTML = node.options.map((opt, index) => `
                <div class="bg-white p-2 border rounded-md space-y-2">
                    <div class="option-header">
                        <p class="text-sm font-semibold">Opción ${index + 1}</p>
                        <button class="delete-option-btn" data-index="${index}">&times;</button>
                    </div>
                    <div>
                        <label class="text-xs font-medium text-gray-600">Texto a mostrar</label>
                        <input type="text" class="option-prop-input w-full p-1 border rounded" data-index="${index}" data-prop="label" value="${opt.label || ''}">
                    </div>
                    <div>
                        <label class="text-xs font-medium text-gray-600">Valor a guardar</label>
                        <textarea class="option-prop-input option-prop-textarea w-full p-1 border rounded" data-index="${index}" data-prop="value">${opt.value || ''}</textarea>
                    </div>
                </div>
            `).join('');
            optionsEditor = `
                <div class="properties-section">
                    <h3 class="font-semibold text-sm">Opciones de la Pregunta</h3>
                    <div class="space-y-2 mt-2">${optionsHTML}</div>
                    <button id="add-option-btn" class="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold">+ Añadir opción</button>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="properties-section">
                <div>
                    <label for="prop-name">ID de la Variable (sin espacios)</label>
                    <input type="text" id="prop-name" value="${node.id}" ${node.type === 'result' ? 'readonly class="bg-gray-200"' : `placeholder="ej: motivo_de_llamada"`}>
                </div>
                 <p class="text-xs text-gray-500 mt-1">Este ID se usará en la plantilla final, ej: {${node.id}}</p>
            </div>
            ${optionsEditor}
            ${templateEditorHTML}
        `;
        if(resultNode) document.getElementById('final-template').value = resultNode.template || '';
        addPropertiesEventListeners();
    }
    
    function autoExpandTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }

    function addPropertiesEventListeners() {
        const propNameInput = document.getElementById('prop-name');
        if (propNameInput) {
            propNameInput.addEventListener('input', (e) => {
                const node = flowState.nodes[flowState.selectedNodeId];
                if (node) {
                    const originalValue = e.target.value;
                    const sanitizedValue = originalValue.replace(/\s/g, '_');
                    e.target.value = sanitizedValue;
                    node.name = sanitizedValue;
                    isDirty = true;
                    const nodeTitleEl = document.querySelector(`#${CSS.escape(node.id)} .node-title`);
                    if (nodeTitleEl) nodeTitleEl.textContent = sanitizedValue;

                    toggleRequired(e.target, isEmpty(e.target.value));
                }
            });

            propNameInput.addEventListener('blur', (e) => {
                const node = flowState.nodes[flowState.selectedNodeId];
                if (node) {
                    const oldId = node.id;
                    const newId = e.target.value.replace(/\s/g, '_');
                    if (!newId || oldId === newId || (flowState.nodes[newId] && newId !== oldId)) {
                        e.target.value = oldId;
                        if (node.name !== oldId) {
                            node.name = oldId;
                            renderFlowNodes();
                        }
                        toggleRequired(e.target, isEmpty(e.target.value));
                        return;
                    }
                    node.id = newId;
                    node.name = newId;
                    delete flowState.nodes[oldId];
                    flowState.nodes[newId] = node;
                    flowState.selectedNodeId = newId;
                    Object.values(flowState.nodes).forEach(n => {
                        if (n.type === 'select') {
                            n.options.forEach(opt => {
                                if (opt.nextStep === oldId) opt.nextStep = newId;
                            });
                        }
                    });
                    isDirty = true;
                    renderFlow();
                }
            });
        }

        document.getElementById('add-option-btn')?.addEventListener('click', () => {
            if (flowState.nodes[flowState.selectedNodeId]) {
                flowState.nodes[flowState.selectedNodeId].options.push({ label: '', value: '', nextStep: 'result' });
                isDirty = true;
                renderFlow();
                // Tras render, marcar nuevos inputs como requeridos
                applyValidationStyles();
            }
        });

        document.querySelectorAll('.delete-option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (flowState.nodes[flowState.selectedNodeId]) {
                    const index = e.target.dataset.index;
                    flowState.nodes[flowState.selectedNodeId].options.splice(index, 1);
                    isDirty = true;
                    renderFlow();
                }
            });
        });

        // Inputs de opciones y sus validaciones + actualización UI en vivo
        document.querySelectorAll('.option-prop-input').forEach(input => {
            input.addEventListener('input', (e) => {
                if (flowState.nodes[flowState.selectedNodeId]) {
                    const { index, prop } = e.target.dataset;
                    const node = flowState.nodes[flowState.selectedNodeId];
                    node.options[index][prop] = e.target.value;
                    isDirty = true;

                    // auto-resize y validación
                    if (e.target.tagName.toLowerCase() === 'textarea') autoExpandTextarea(e.target);
                    toggleRequired(e.target, isEmpty(e.target.value));

                    // *** NUEVO: actualizar el título de la opción en el nodo en tiempo real ***
                    if (prop === 'label') {
                        const nodeEl = document.getElementById(node.id);
                        if (nodeEl) {
                            const spans = nodeEl.querySelectorAll('.node-options .option span');
                            const idx = parseInt(index, 10);
                            if (spans && spans[idx]) {
                                spans[idx].textContent = e.target.value || `Opción ${idx + 1}`;
                            }
                        }
                    }
                }
            });
        });
        
        const finalTemplate = document.getElementById('final-template');
        if(finalTemplate) {
            finalTemplate.addEventListener('input', (e) => {
                if (flowState.nodes.result) {
                    flowState.nodes.result.template = e.target.value;
                    isDirty = true;
                }
                autoExpandTextarea(e.target);
                toggleRequired(e.target, isEmpty(e.target.value));
            });
            finalTemplate.addEventListener('dragover', e => e.preventDefault());
            finalTemplate.addEventListener('drop', e => {
                e.preventDefault();
                const variableId = e.dataTransfer.getData('text/plain');
                const template = e.target;
                const start = template.selectionStart;
                const end = template.selectionEnd;
                const text = template.value;
                const newText = `${text.substring(0, start)}{${variableId}}${text.substring(end)}`;
                template.value = newText;
                template.selectionStart = template.selectionEnd = start + variableId.length + 2;
                if (flowState.nodes.result) flowState.nodes.result.template = newText;
                isDirty = true;
                autoExpandTextarea(template);
                toggleRequired(template, isEmpty(template.value));
            });
        }
        
        document.querySelectorAll('.variable-pill').forEach(pill => {
            pill.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', e.target.dataset.variableId);
            });
        });
        
        document.querySelectorAll('.option-prop-textarea, #final-template').forEach(autoExpandTextarea);

        // aplicar estado de requerido al cargar el panel
        applyValidationStyles();
    }

    function onNodeMouseDown(e) {
        e.stopPropagation();
        if (e.target.classList.contains('connector-dot') || e.target.closest('button')) return;
        const id = e.currentTarget.id;
        selectNode(id);
        flowState.dragging.active = true;
        flowState.dragging.id = id;
        const node = flowState.nodes[id];
        const canvasRect = document.getElementById('flow-canvas-container').getBoundingClientRect();
        const mouseXInCanvas = e.clientX - canvasRect.left;
        const mouseYInCanvas = e.clientY - canvasRect.top;
        flowState.dragging.offsetX = mouseXInCanvas - node.x;
        flowState.dragging.offsetY = mouseYInCanvas - node.y;
        e.currentTarget.style.cursor = 'grabbing';
    }

    function onConnectorMouseDown(e) {
        e.stopPropagation();
        const { nodeId, optionIndex } = e.target.dataset;
        flowState.connecting.active = true;
        flowState.connecting.fromNodeId = nodeId;
        flowState.connecting.fromOptionIndex = optionIndex;
        
        const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tempLine.setAttribute('class', 'connector-line highlight');
        document.getElementById('flow-connector-svg').appendChild(tempLine);
        flowState.connecting.tempLine = tempLine;
    }

    function onFlowMouseMove(e) {
        if (panningState.active) {
            const dx = e.clientX - panningState.startX;
            const dy = e.clientY - panningState.startY;
            Object.values(flowState.nodes).forEach(node => {
                const initial = panningState.initialNodePositions[node.id];
                node.x = initial.x + dx;
                node.y = initial.y + dy;
            });
            isDirty = true;
            renderFlow();
            return;
        }

        if (flowState.dragging.active && flowState.dragging.id) {
            const node = flowState.nodes[flowState.dragging.id];
            const canvasRect = document.getElementById('flow-canvas-container').getBoundingClientRect();
            node.x = e.clientX - canvasRect.left - flowState.dragging.offsetX;
            node.y = e.clientY - canvasRect.top - flowState.dragging.offsetY;
            isDirty = true;
            renderFlow();
        }
        if (flowState.connecting.active) {
            const fromDot = document.querySelector(`.connector-dot[data-node-id="${CSS.escape(flowState.connecting.fromNodeId)}"][data-option-index="${CSS.escape(flowState.connecting.fromOptionIndex)}"]`);
            const canvasRect = document.getElementById('flow-canvas-container').getBoundingClientRect();
            const fromRect = fromDot.getBoundingClientRect();
            const startX = fromRect.left - canvasRect.left + fromRect.width / 2;
            const startY = fromRect.top - canvasRect.top + fromRect.height / 2;
            const endX = e.clientX - canvasRect.left;
            const endY = e.clientY - canvasRect.top;
            flowState.connecting.tempLine.setAttribute('d', `M ${startX} ${startY} C ${startX + 60} ${startY}, ${endX - 60} ${endY}, ${endX} ${endY}`);
        }
    }

    function onFlowMouseUp(e) {
        if (panningState.active) {
            panningState.active = false;
            document.getElementById('flow-canvas-container').style.cursor = 'grab';
        }

        if (flowState.dragging.active) {
            const draggedNode = document.getElementById(flowState.dragging.id);
            if (draggedNode) {
                draggedNode.style.cursor = 'grab';
            }
            flowState.dragging.active = false;
            flowState.dragging.id = null;
        }
        if (flowState.connecting.active) {
            flowState.connecting.tempLine.remove();
            const toNodeEl = e.target.closest('.node');
            if (toNodeEl && toNodeEl.id !== flowState.connecting.fromNodeId) {
                const fromNode = flowState.nodes[flowState.connecting.fromNodeId];
                fromNode.options[flowState.connecting.fromOptionIndex].nextStep = toNodeEl.id;
                isDirty = true;
            }
            flowState.connecting.active = false;
            renderFlow();
        }
    }

    function selectNode(id) {
        flowState.selectedNodeId = id;
        renderFlow();
    }

    function addSelectNode() {
        const count = Object.keys(flowState.nodes).length;
        const nodeId = `pregunta_${count}`;
        flowState.nodes[nodeId] = {
            id: nodeId, name: nodeId, type: 'select', x: 50, y: 50,
            options: [{ label: '', value: '', nextStep: 'result' }]
        };
        isDirty = true;
        selectNode(nodeId);
        applyValidationStyles();
    }

    function deleteNode(id) {
        if (id === 'result') return;
        Object.values(flowState.nodes).forEach(node => {
            if (node.type === 'select') {
                node.options.forEach(opt => { if (opt.nextStep === id) opt.nextStep = 'result'; });
            }
        });
        delete flowState.nodes[id];
        if (flowState.selectedNodeId === id) flowState.selectedNodeId = null;
        isDirty = true;
        renderFlow();
    }
    
    const openModal = () => {
        showListView();
        modal.classList.add('visible');
    };

    const attemptClose = () => {
        const isEditorVisible = !viewEditor.classList.contains('hidden');
        if (!isEditorVisible) {
            closeModalCleanup();
            return;
        }
        if (isDirty) {
            confirmModal.classList.remove('hidden');
        } else {
            showListView();
        }
    };

    const closeModalCleanup = () => {
        modal.classList.remove('visible');
        confirmModal.classList.add('hidden');
    };

    const showListView = () => {
        modalContainer.classList.remove('flow-editor-mode');
        modalTitle.textContent = "Configuración de Shortkeys";
        viewEditor.classList.add('hidden');
        editorActions.classList.add('hidden');
        viewList.classList.remove('hidden');
        if (confirmModal) confirmModal.classList.add('hidden');
        isDirty = false;
        renderShortcuts();
    };

    const showEditorView = (shortcutKey = null) => {
        modalContainer.classList.add('flow-editor-mode');
        viewList.classList.add('hidden');
        viewEditor.classList.remove('hidden');
        editorActions.classList.remove('hidden');
        isDirty = false;
        currentEditingKey = shortcutKey;
        const shortcut = shortcutKey ? shortkeyManager.getShortcuts().find(s => s.key === shortcutKey) : null;
        modalTitle.textContent = shortcut ? `Editando Shortkey` : "Creando Nuevo Shortkey";
        buildFlowchartEditor(shortcut);
        // Validación por defecto: todos los requeridos en rojo suave si están vacíos
        applyValidationStyles();

        if (!shortcutKey) {
            setTimeout(() => {
                const keyInput = document.getElementById('shortkey-key-input');
                const descInput = document.getElementById('shortkey-desc-input');
                toggleRequired(keyInput, isEmpty(keyInput?.value));
                toggleRequired(descInput, isEmpty(descInput?.value));
                keyInput?.focus();
            }, 100);
        }
    };

    function buildFlowchartEditor(shortcut) {
        setupFlowEditor();
        resetFlowState();
        
        document.getElementById('shortkey-key-input').value = shortcut ? shortcut.key : '';
        document.getElementById('shortkey-desc-input').value = shortcut ? shortcut.description : '';
        currentTags = shortcut ? [...(shortcut.tags || [])] : [];
        renderTags();

        if (!shortcut || !shortcut.steps || shortcut.steps.length === 0) {
            flowState.nodes = {
                'result': { id: 'result', name: 'result', type: 'result', x: 400, y: 150, template: shortcut ? shortcut.description : '' }
            };
        } else {
            shortcut.steps.forEach((step) => {
                if (step.type !== 'template') {
                    flowState.nodes[step.id] = {
                        ...step,
                        name: step.id,
                        x: step.x || Math.floor(Math.random() * 400) + 50,
                        y: step.y || Math.floor(Math.random() * 200) + 50
                    };
                }
            });
            const resultNode = shortcut.steps.find(s => s.type === 'template') || { id: 'result', template: '' };
            flowState.nodes.result = { ...resultNode, id: 'result', name: 'result', type: 'result', x: resultNode.x || 600, y: resultNode.y || 150 };
        }
        const firstNodeId = Object.keys(flowState.nodes).find(id => id !== 'result');
        selectNode(firstNodeId || 'result');
    }
    
    function parseFlowchartEditor() {
        const nodes = flowState.nodes;
        
        const selectSteps = Object.values(nodes)
            .filter(node => node.type === 'select')
            .map(node => ({
                id: node.id,
                name: node.name,
                type: 'select',
                x: node.x,
                y: node.y,
                options: node.options.map(opt => ({
                    label: opt.label,
                    value: opt.value,
                    nextStep: opt.nextStep || 'result'
                }))
            }));
        
        const resultNode = nodes.result;
        const finalSteps = selectSteps.concat([{
            id: 'result',
            type: 'template',
            template: document.getElementById('final-template').value,
            x: resultNode.x,
            y: resultNode.y
        }]);
        return finalSteps.filter(step => step.id); 
    }
    
    function validateAndSave() {
        let isValid = true;
        const requiredFields = [];
        
        const keyInput = document.getElementById('shortkey-key-input');
        const descInput = document.getElementById('shortkey-desc-input');
        requiredFields.push(keyInput, descInput);

        document.querySelectorAll('#prop-name, .option-prop-input').forEach(el => {
            if (!el.readOnly) requiredFields.push(el);
        });
        const finalTemplate = document.getElementById('final-template');
        if (finalTemplate) requiredFields.push(finalTemplate);

        requiredFields.forEach(field => {
            field.classList.remove('required-field-error');
            if (!field.value.trim()) {
                field.classList.add('required-field-error');
                isValid = false;
            }
        });

        if (!isValid) {
            alert('Por favor, rellena todos los campos obligatorios marcados en rojo.');
            return;
        }

        const keyToSave = keyInput.value.trim().toLowerCase().replace(/\s/g, '');
        const existing = shortkeyManager.getShortcuts().find(s => s.key === keyToSave);
        if (existing && keyToSave !== currentEditingKey) {
            alert(`El shortkey "@${keyToSave}" ya existe. Por favor, elige otro activador.`);
            keyInput.classList.add('required-field-error');
            return;
        }

        const steps = parseFlowchartEditor();
        const description = descInput.value.trim();
        
        const data = {
            key: keyToSave,
            description: description,
            steps: steps,
            tags: currentTags
        };

        if (currentEditingKey) {
            shortkeyManager.updateShortcut(currentEditingKey, data);
        } else {
            shortkeyManager.addShortcut(data);
        }
        isDirty = false;
        showListView();
    }


    function renderShortcuts() {
        const listContainer = document.getElementById('shortcutsList');
        if (!listContainer) return;
        listContainer.innerHTML = '';
        const shortcuts = shortkeyManager.getShortcuts();
        if (shortcuts.length === 0) {
            listContainer.innerHTML = `<p style="text-align: center; color: #6b7280; padding: 1rem;">No tienes shortkeys. ¡Añade uno nuevo!</p>`;
            return;
        }
        shortcuts.forEach((shortcut, index) => {
            const isDynamic = shortcut.steps && shortcut.steps.length > 1;
            const item = document.createElement('div');
            item.className = 'shortcut-item';

            let tagsHTML = '';
            if (shortcut.tags && shortcut.tags.length > 0) {
                tagsHTML = `<div class="shortcut-tags-list">
                    ${shortcut.tags.map(tag => {
                        const colors = getColorForTag(tag);
                        return `<span class="tag-pill" style="background-color: ${colors.bg}; color: ${colors.text};">${tag}</span>`;
                    }).join('')}
                </div>`;
            }

            item.innerHTML = `
                <div class="shortcut-reorder">
                    <button class="action-btn move-up-btn" data-key="${shortcut.key}" title="Mover arriba" ${index === 0 ? 'disabled' : ''}>
                        <svg style="pointer-events: none;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                    </button>
                    <button class="action-btn move-down-btn" data-key="${shortcut.key}" title="Mover abajo" ${index === shortcuts.length - 1 ? 'disabled' : ''}>
                        <svg style="pointer-events: none;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </button>
                </div>
                <div class="shortcut-details">
                    <div>
                        <span class="shortcut-key">@${shortcut.key}</span>
                        <p class="shortcut-description">${shortcut.description}</p>
                    </div>
                    ${tagsHTML}
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
    }
    
    const tagColors = ['#e0f2fe', '#dcfce7', '#fefce8', '#fee2e2', '#f3e8ff', '#dbeafe', '#e0e7ff'];
    const tagTextColors = ['#0c4a6e', '#166534', '#854d0e', '#991b1b', '#581c87', '#1e40af', '#312e81'];
    const getColorForTag = (tag) => {
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
            hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash % tagColors.length);
        return { bg: tagColors[index], text: tagTextColors[index] };
    };

    function setupTagEditor() {
        const container = document.getElementById('tags-editor');
        container.innerHTML = `
            <div id="tags-container" class="tags-container"></div>
            <div id="existing-tags-container" class="existing-tags">
                <small>Etiquetas disponibles:</small>
            </div>
        `;
        
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-tag-btn')) {
                const tag = e.target.dataset.tag;
                currentTags = currentTags.filter(t => t !== tag);
                renderTags();
            } else if (e.target.classList.contains('suggestion-tag')) {
                const tagName = e.target.textContent;
                if (tagName && !currentTags.includes(tagName)) {
                    currentTags.push(tagName);
                    renderTags();
                }
            }
        });
    }

    function renderTags() {
        const selectedContainer = document.getElementById('tags-container');
        const availableContainer = document.getElementById('existing-tags-container');
        
        selectedContainer.innerHTML = '';
        currentTags.forEach(tag => {
            const {bg, text} = getColorForTag(tag);
            const pill = document.createElement('span');
            pill.className = 'tag-pill';
            pill.style.backgroundColor = bg;
            pill.style.color = text;
            pill.innerHTML = `${tag} <button class="remove-tag-btn" data-tag="${tag}">&times;</button>`;
            selectedContainer.appendChild(pill);
        });
        if (currentTags.length === 0) {
            selectedContainer.innerHTML = `<span class="text-xs text-gray-500">Ninguna etiqueta seleccionada</span>`;
        }

        availableContainer.innerHTML = '<small>Etiquetas disponibles:</small>';
        const availableTags = PREDEFINED_TAGS.filter(t => !currentTags.includes(t));
        availableTags.forEach(tag => {
            const {bg, text} = getColorForTag(tag);
            const pill = document.createElement('span');
            pill.className = 'tag-pill suggestion-tag';
            pill.style.backgroundColor = bg;
            pill.style.color = text;
            pill.textContent = tag;
            availableContainer.appendChild(pill);
        });

        isDirty = true;
    }

    if (closeBtn) closeBtn.addEventListener('click', attemptClose);
    if (overlay) overlay.addEventListener('click', attemptClose);
    if (addNewBtn) addNewBtn.addEventListener('click', () => showEditorView());
    if (editorCancelBtn) editorCancelBtn.addEventListener('click', attemptClose);
    if (editorSaveBtn) editorSaveBtn.addEventListener('click', validateAndSave);

    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', () => confirmModal.classList.add('hidden'));
    if (confirmDiscardBtn) confirmDiscardBtn.addEventListener('click', showListView);
    if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', () => { validateAndSave(); });
    
    function showGenericConfirm(title, message, onConfirm) {
        document.getElementById('generic-confirm-title').textContent = title;
        document.getElementById('generic-confirm-message').textContent = message;
        genericConfirmModal.classList.remove('hidden');
        genericConfirmCallback = onConfirm;
    }

    document.getElementById('generic-confirm-no-btn').addEventListener('click', () => {
        genericConfirmModal.classList.add('hidden');
        genericConfirmCallback = null;
    });

    document.getElementById('generic-confirm-yes-btn').addEventListener('click', () => {
        if (genericConfirmCallback) {
            genericConfirmCallback();
        }
        genericConfirmModal.classList.add('hidden');
        genericConfirmCallback = null;
    });

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
                showGenericConfirm(
                    'Eliminar Shortkey', 
                    `¿Estás seguro de que quieres eliminar el shortkey "@${key}"? Esta acción no se puede deshacer.`,
                    () => {
                        shortkeyManager.removeShortcut(key);
                        renderShortcuts();
                    }
                );
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('visible')) {
            if (confirmModal && !confirmModal.classList.contains('hidden')) {
                confirmModal.classList.add('hidden');
            } else if (genericConfirmModal && !genericConfirmModal.classList.contains('hidden')) {
                genericConfirmModal.classList.add('hidden');
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

    // Initial load
    showListView();
});
