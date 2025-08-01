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
                { key: 'cxtv', description: 'Flujo de TV.', steps: [ { id: 'issue', type: 'select', name: 'Problema TV', options: [ { label: 'stb_no_boot', value: 'tv is not powering on', nextStep: 'result' }, { label: 'recording', value: 'cx cannot record', nextStep: 'recordings' } ] }, { id: 'recordings', type: 'select', name: 'Grabaciones', options: [ { label: 'rec_list', value: 'cannot see the recording list', nextStep: 'result' }, { label: 'play_rec', value: 'cx cannot play recordings', nextStep: 'result' } ] }, { id: 'result', type: 'template', template: '{issue} {recordings}.' } ], tags: ['cx_issue', 'troubleshooting'] }
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

    function setupFlowEditor() {
        viewEditor.innerHTML = `
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
            <div class="flow-editor-main">
                <div id="flow-canvas-container" class="canvas-container">
                    <svg id="flow-connector-svg">
                        <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--gray-500)"></path>
                            </marker>
                        </defs>
                    </svg>
                    <div id="flow-node-container"></div>
                </div>
                <div id="flow-properties-panel" class="properties-panel">
                    <div class="flex-grow">
                        <div id="flow-properties-content" class="space-y-4"></div>
                    </div>
                    <div id="flow-actions" class="flex-shrink-0 mt-6 space-y-2">
                        <button id="add-select-node-btn" class="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-all shadow">
                            + Añadir Pregunta
                        </button>
                    </div>
                </div>
            </div>
        `;
        addFlowEventListeners();
        setupTagEditor();
    }

    function addFlowEventListeners() {
        const canvas = document.getElementById('flow-canvas-container');
        canvas.addEventListener('mousemove', onFlowMouseMove);
        canvas.addEventListener('mouseup', onFlowMouseUp);
        canvas.addEventListener('mousedown', () => selectNode(null));
        document.getElementById('add-select-node-btn').addEventListener('click', addSelectNode);
        
        viewEditor.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-node-btn');
            if (deleteBtn) {
                deleteNode(deleteBtn.dataset.nodeId);
            }
        });
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
                        const fromEl = document.querySelector(`.connector-dot[data-node-id="${node.id}"][data-option-index="${index}"]`);
                        const toEl = document.getElementById(opt.nextStep);
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
        const templateEditorHTML = `
            <div class="properties-section">
                 <h3 class="font-semibold text-sm">Plantilla de Texto Final</h3>
                 <p class="text-xs text-gray-500 mb-2">Usa {id_variable} para insertar valores.</p>
                 <textarea id="final-template" class="w-full p-2 mt-1 border rounded-lg h-32 font-mono text-sm">${resultNode ? resultNode.template : ''}</textarea>
            </div>
        `;

        if (!flowState.selectedNodeId || !flowState.nodes[flowState.selectedNodeId]) {
            container.innerHTML = `<p class="text-gray-500">Selecciona un nodo para ver sus propiedades.</p>${templateEditorHTML}`;
            addPropertiesEventListeners();
            return;
        }

        const node = flowState.nodes[flowState.selectedNodeId];
        let optionsEditor = '';
        if (node.type === 'select') {
            const optionsHTML = node.options.map((opt, index) => `
                <div class="bg-white p-2 border rounded-md space-y-2">
                    <div class="flex justify-between items-center">
                        <p class="text-sm font-semibold">Opción ${index + 1}</p>
                        <button class="delete-option-btn" data-index="${index}">&times;</button>
                    </div>
                    <input type="text" class="option-prop-input w-full p-1 border rounded" data-index="${index}" data-prop="label" value="${opt.label || ''}" placeholder="Texto a mostrar">
                    <input type="text" class="option-prop-input w-full p-1 border rounded" data-index="${index}" data-prop="value" value="${opt.value || ''}" placeholder="Valor a guardar">
                </div>
            `).join('');
            optionsEditor = `
                <div class="properties-section">
                    <h3 class="font-semibold text-sm">Opciones</h3>
                    <div class="space-y-2 mt-2">${optionsHTML}</div>
                    <button id="add-option-btn" class="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold">+ Añadir opción</button>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="properties-section">
                <div>
                    <label for="prop-name">Nombre de la Variable</label>
                    <input type="text" id="prop-name" value="${node.name}" ${node.type === 'result' ? 'readonly class="bg-gray-200"' : ''}>
                </div>
            </div>
            ${optionsEditor}
            ${templateEditorHTML}
        `;
        addPropertiesEventListeners();
    }
    
    function addPropertiesEventListeners() {
        document.getElementById('prop-name')?.addEventListener('input', (e) => {
            if (flowState.nodes[flowState.selectedNodeId]) {
                flowState.nodes[flowState.selectedNodeId].name = e.target.value;
                isDirty = true;
                renderFlowNodes();
            }
        });
        document.getElementById('add-option-btn')?.addEventListener('click', () => {
            if (flowState.nodes[flowState.selectedNodeId]) {
                flowState.nodes[flowState.selectedNodeId].options.push({ label: '', value: '', nextStep: 'result' });
                isDirty = true;
                renderFlow();
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
        document.querySelectorAll('.option-prop-input').forEach(input => {
            input.addEventListener('input', (e) => {
                if (flowState.nodes[flowState.selectedNodeId]) {
                    const { index, prop } = e.target.dataset;
                    flowState.nodes[flowState.selectedNodeId].options[index][prop] = e.target.value;
                    isDirty = true;
                    renderFlowNodes();
                }
            });
        });
        document.getElementById('final-template')?.addEventListener('input', (e) => {
            if (flowState.nodes.result) {
                flowState.nodes.result.template = e.target.value;
                isDirty = true;
            }
        });
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
        if (flowState.dragging.active && flowState.dragging.id) {
            const node = flowState.nodes[flowState.dragging.id];
            const canvasRect = document.getElementById('flow-canvas-container').getBoundingClientRect();
            node.x = e.clientX - canvasRect.left - flowState.dragging.offsetX;
            node.y = e.clientY - canvasRect.top - flowState.dragging.offsetY;
            isDirty = true;
            renderFlow();
        }
        if (flowState.connecting.active) {
            const fromDot = document.querySelector(`.connector-dot[data-node-id="${flowState.connecting.fromNodeId}"][data-option-index="${flowState.connecting.fromOptionIndex}"]`);
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
        if (flowState.dragging.active) {
            const aNodeIsBeingDragged = flowState.dragging.id && document.getElementById(flowState.dragging.id);
            if (aNodeIsBeingDragged) {
                document.getElementById(flowState.dragging.id).style.cursor = 'grab';
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
        const nodeId = `variable_${Date.now()}`;
        flowState.nodes[nodeId] = {
            id: nodeId, name: `Nueva Pregunta ${count}`, type: 'select', x: 50, y: 50,
            options: [{ label: 'Opción 1', value: 'valor1', nextStep: 'result' }]
        };
        isDirty = true;
        selectNode(nodeId);
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
                'result': { id: 'result', name: 'Texto Final', type: 'result', x: 400, y: 150, template: shortcut ? shortcut.description : '' }
            };
        } else {
            shortcut.steps.forEach((step, index) => {
                if (step.type !== 'template') {
                    flowState.nodes[step.id] = {
                        ...step,
                        name: step.name || step.id,
                        x: 100 + (index * 280),
                        y: 150
                    };
                }
            });
            const resultNode = shortcut.steps.find(s => s.type === 'template') || { id: 'result', type: 'template', template: '' };
            flowState.nodes.result = { ...resultNode, name: 'Texto Final', type: 'result', x: 400, y: 350 };
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
                options: node.options.map(opt => ({
                    label: opt.label,
                    value: opt.value,
                    nextStep: opt.nextStep || 'result'
                }))
            }));
        
        const finalSteps = selectSteps.concat([{
            id: 'result',
            type: 'template',
            template: document.getElementById('final-template').value
        }]);
        return finalSteps.filter(step => step.id); 
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
            <div id="tags-container" class="tags-container">
                <input type="text" id="add-tag-input" placeholder="Añadir etiqueta...">
            </div>
            <div class="existing-tags">
                <small>Sugerencias:</small>
                ${PREDEFINED_TAGS.map(tag => {
                    const {bg, text} = getColorForTag(tag);
                    return `<span class="tag-pill suggestion-tag" style="background-color: ${bg}; color: ${text};">${tag}</span>`
                }).join('')}
            </div>
        `;

        const input = document.getElementById('add-tag-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const tagName = input.value.trim();
                if (tagName && !currentTags.includes(tagName)) {
                    currentTags.push(tagName);
                    renderTags();
                }
                input.value = '';
            }
        });
        
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
        const container = document.getElementById('tags-container');
        const input = document.getElementById('add-tag-input');
        
        container.querySelectorAll('.tag-pill:not(.suggestion-tag)').forEach(pill => pill.remove());

        currentTags.forEach(tag => {
            const {bg, text} = getColorForTag(tag);
            const pill = document.createElement('span');
            pill.className = 'tag-pill';
            pill.style.backgroundColor = bg;
            pill.style.color = text;
            pill.innerHTML = `${tag} <button class="remove-tag-btn" data-tag="${tag}">&times;</button>`;
            container.insertBefore(pill, input);
        });
        isDirty = true;
    }

    if (closeBtn) closeBtn.addEventListener('click', attemptClose);
    if (overlay) overlay.addEventListener('click', attemptClose);
    if (addNewBtn) addNewBtn.addEventListener('click', () => showEditorView());
    if (editorCancelBtn) editorCancelBtn.addEventListener('click', attemptClose);
    if (editorSaveBtn) {
        editorSaveBtn.addEventListener('click', () => {
            const keyInput = document.getElementById('shortkey-key-input');
            const descInput = document.getElementById('shortkey-desc-input');
            
            const keyToSave = keyInput.value.trim().toLowerCase().replace(/\s/g, '');
            if (!keyToSave) {
                alert("El activador no puede estar vacío.");
                keyInput.focus();
                return;
            }
            
            const existing = shortkeyManager.getShortcuts().find(s => s.key === keyToSave);
            if (existing && keyToSave !== currentEditingKey) {
                alert(`El shortkey "@${keyToSave}" ya existe. Por favor, elige otro activador.`);
                keyInput.focus();
                return;
            }

            const steps = parseFlowchartEditor();
            const description = descInput.value.trim() || (steps.length > 1 ? "Shortkey dinámico con variables." : (flowState.nodes.result?.template || "Shortkey simple."));
            
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
        });
    }

    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', () => confirmModal.classList.add('hidden'));
    if (confirmDiscardBtn) confirmDiscardBtn.addEventListener('click', showListView);
    if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', () => { editorSaveBtn.click(); });
    
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
