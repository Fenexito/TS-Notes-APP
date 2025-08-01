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
    const genericNoBtn = document.getElementById('generic-confirm-no-btn');
    const genericYesBtn = document.getElementById('generic-confirm-yes-btn');
    let genericConfirmCallback = null;
    
    let currentEditingKey = null;
    let currentTags = [];
    let isDirty = false;
    let flowState = {};
    let panningState = { active: false, startX: 0, startY: 0, initialNodePositions: {} };
    let zoomState = { scale: 1, min: 0.5, max: 2, step: 0.1 };

    // ---------- Utilidades ----------
    const isEmpty = (v) => !v || String(v).trim() === '';
    const toggleRequired = (el, on) => { if (el) (on ? el.classList.add('required-field-error') : el.classList.remove('required-field-error')); };

    function showInfoModal(title, message) {
        document.getElementById('generic-confirm-title').textContent = title;
        document.getElementById('generic-confirm-message').textContent = message;
        if (genericYesBtn) genericYesBtn.style.display = 'none';
        if (genericNoBtn) {
            genericNoBtn.textContent = 'Entendido';
            genericNoBtn.onclick = () => {
                genericConfirmModal.classList.add('hidden');
                if (genericYesBtn) genericYesBtn.style.display = '';
                genericNoBtn.textContent = 'No';
            };
        }
        genericConfirmModal.classList.remove('hidden');
    }

    function showGenericConfirm(title, message, onConfirm) {
        document.getElementById('generic-confirm-title').textContent = title;
        document.getElementById('generic-confirm-message').textContent = message;
        if (genericYesBtn) {
            genericYesBtn.style.display = '';
            genericYesBtn.onclick = () => {
                genericConfirmModal.classList.add('hidden');
                onConfirm?.();
            };
        }
        if (genericNoBtn) {
            genericNoBtn.textContent = 'No';
            genericNoBtn.onclick = () => genericConfirmModal.classList.add('hidden');
        }
        genericConfirmModal.classList.remove('hidden');
    }

    const isBackgroundClick = (e) => {
        const canvas = document.getElementById('flow-canvas-container');
        const svg = document.getElementById('flow-connector-svg');
        const nodesContainer = document.getElementById('flow-node-container');
        const inner = document.getElementById('flow-inner');
        return (
            e.target === canvas ||
            e.target === svg ||
            e.target === nodesContainer ||
            e.target === inner
        );
    };

    // ---------- Header (reescrito) + Editor ----------
    function setupFlowEditor() {
        viewEditor.innerHTML = `
            <div class="flow-editor-content">
                <div class="flow-header clean">
                    <div class="field">
                        <label for="shortkey-key-input">Activador</label>
                        <div class="chip-input">
                            <span class="chip-prefix">@</span>
                            <input id="shortkey-key-input" type="text" placeholder="mi_shortkey" />
                        </div>
                        <small class="hint">Sin espacios. Se guardará en minúsculas.</small>
                    </div>
                    <div class="field">
                        <label for="shortkey-desc-input">Descripción</label>
                        <input id="shortkey-desc-input" type="text" class="chip" placeholder="Descripción breve para la lista" />
                    </div>
                    <div class="field">
                        <label>Etiquetas</label>
                        <div id="tags-editor" class="tags-editor-wrapper"></div>
                    </div>
                </div>

                <div id="flow-canvas-container" class="canvas-container">
                    <div id="flow-inner" class="flow-inner">
                        <svg id="flow-connector-svg">
                            <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--gray-500)"></path>
                                </marker>
                            </defs>
                        </svg>
                        <div id="flow-node-container"></div>
                        <button id="add-select-node-btn-floating">+ Añadir Pregunta</button>

                        <div id="minimap" class="minimap">
                            <canvas id="minimap-canvas" width="160" height="110"></canvas>
                        </div>
                    </div>
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

    function applyValidationStyles() {
        const keyInput = document.getElementById('shortkey-key-input');
        const descInput = document.getElementById('shortkey-desc-input');
        toggleRequired(keyInput, isEmpty(keyInput?.value));
        toggleRequired(descInput, isEmpty(descInput?.value));
        document.querySelectorAll('#flow-properties-content #prop-name, #flow-properties-content .option-prop-input').forEach(el => {
            if (!el.readOnly) toggleRequired(el, isEmpty(el.value));
        });
        const hiddenTpl = document.getElementById('final-template');
        toggleRequired(hiddenTpl, isEmpty(hiddenTpl?.value));
    }

    function setupHeaderValidationListeners() {
        const keyInput = document.getElementById('shortkey-key-input');
        const descInput = document.getElementById('shortkey-desc-input');
        [keyInput, descInput].forEach(el => {
            el?.addEventListener('input', (e) => toggleRequired(e.target, isEmpty(e.target.value)));
        });
    }

    // ---------- Eventos de lienzo, panning y ZOOM ----------
    function addFlowEventListeners() {
        const canvas = document.getElementById('flow-canvas-container');
        const svg = document.getElementById('flow-connector-svg');
        const nodesContainer = document.getElementById('flow-node-container');

        canvas.addEventListener('mousemove', onFlowMouseMove);
        canvas.addEventListener('mouseup', onFlowMouseUp);

        // Panning
        const startPan = (e) => {
            if (!isBackgroundClick(e)) return;
            if (!(e.button === 0 || e.button === 1) && !e.altKey) return;
            e.preventDefault();
            panningState.active = true;
            panningState.startX = e.clientX;
            panningState.startY = e.clientY;
            panningState.initialNodePositions = {};
            Object.values(flowState.nodes).forEach(node => {
                panningState.initialNodePositions[node.id] = { x: node.x, y: node.y };
            });
            canvas.style.cursor = 'grabbing';
            if (e.button === 0 && !e.altKey) selectNode(null);
        };
        canvas.addEventListener('mousedown', startPan);
        svg.addEventListener('mousedown', startPan);
        nodesContainer.addEventListener('mousedown', (e) => { if (e.target === nodesContainer) startPan(e); });

        // ZOOM con CTRL + rueda (zoom hacia el cursor)
        canvas.addEventListener('wheel', (e) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const oldScale = zoomState.scale;
            const dir = e.deltaY < 0 ? 1 : -1;
            let newScale = +(oldScale + dir * zoomState.step).toFixed(2);
            newScale = Math.max(zoomState.min, Math.min(zoomState.max, newScale));
            if (newScale === oldScale) return;

            // world coords debajo del cursor antes del zoom
            const wx = mouseX / oldScale;
            const wy = mouseY / oldScale;

            zoomState.scale = newScale;
            applyZoomTransform();

            // Mantener el punto bajo el cursor fijo (traslación "cámara" moviendo nodos)
            const dx = (mouseX / newScale) - wx;
            const dy = (mouseY / newScale) - wy;
            Object.values(flowState.nodes).forEach(node => {
                node.x += dx;
                node.y += dy;
            });
            renderFlow();
        }, { passive: false });

        document.getElementById('add-select-node-btn-floating').addEventListener('click', addSelectNode);

        viewEditor.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-node-btn');
            if (deleteBtn) {
                const nodeId = deleteBtn.dataset.nodeId;
                showGenericConfirm(
                    'Eliminar variable',
                    `¿Eliminar la variable "${nodeId}" y sus conexiones?`,
                    () => deleteNode(nodeId)
                );
            }
        });

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                svg.setAttribute('width', width);
                svg.setAttribute('height', height);
                renderFlowConnections();
                drawMinimap();
            }
        });
        if (canvas) resizeObserver.observe(canvas);
    }

    function applyZoomTransform() {
        const scale = zoomState.scale;
        const svg = document.getElementById('flow-connector-svg');
        const nodes = document.getElementById('flow-node-container');
        svg.style.transform = `scale(${scale})`;
        nodes.style.transform = `scale(${scale})`;
        svg.style.transformOrigin = nodes.style.transformOrigin = '0 0';
    }
    
    function resetFlowState() {
        flowState = {
            nodes: {},
            selectedNodeId: null,
            dragging: { active: false, id: null, offsetX: 0, offsetY: 0 },
            connecting: { active: false, fromNodeId: null, fromOptionIndex: null, tempLine: null }
        };
        currentTags = [];
        zoomState.scale = 1;
        applyZoomTransform();
    }

    function renderFlow() {
        window.requestAnimationFrame(() => {
            renderFlowNodes();
            renderFlowConnections();
            renderFlowProperties();
            applyValidationStyles();
            drawMinimap();
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

    // ----- Template (tokens no editables) -----
    function renderTemplateEditorHTML(variablePillsHTML) {
        return `
            <div class="properties-section">
                 <h3 class="font-semibold text-sm">Plantilla de Texto Final</h3>
                 <p class="text-xs text-gray-500 mb-2">Haz <strong>click</strong> en una variable o arrástrala; se insertará al final como token no editable.</p>
                 <div id="final-template-editor" class="template-editor" contenteditable="true"></div>
                 <textarea id="final-template" class="hidden-textarea"></textarea>
                 <div class="variable-pills-container">
                    <small>Variables disponibles:</small>
                    ${variablePillsHTML}
                 </div>
            </div>
        `;
    }
    const tokenHTML = (varId) => `<span class="template-token" data-variable-id="${varId}" contenteditable="false">{${varId}}</span>`;

    function htmlFromTemplateString(tpl) {
        return (tpl || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_, v) => tokenHTML(v));
    }

    function textFromTemplateEditor(editorEl) {
        let out = '';
        editorEl.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) out += node.nodeValue;
            else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node;
                if (el.classList.contains('template-token')) {
                    const v = el.getAttribute('data-variable-id');
                    out += `{${v}}`;
                } else {
                    out += el.innerText;
                }
            }
        });
        return out.replace(/\u00A0/g, ' ');
    }

    function appendTokenAtEnd(editorEl, varId) {
        const hidden = document.getElementById('final-template');
        const space = document.createTextNode(' ');
        const tokenSpan = document.createElement('span');
        tokenSpan.className = 'template-token';
        tokenSpan.setAttribute('data-variable-id', varId);
        tokenSpan.setAttribute('contenteditable', 'false');
        tokenSpan.textContent = `{${varId}}`;

        // Insertar con espacio antes y después al FINAL
        if (editorEl.lastChild && editorEl.lastChild.nodeType === Node.TEXT_NODE && /\S$/.test(editorEl.lastChild.nodeValue)) {
            editorEl.appendChild(space.cloneNode());
        }
        editorEl.appendChild(tokenSpan);
        editorEl.appendChild(space.cloneNode());

        hidden.value = textFromTemplateEditor(editorEl);
        if (flowState.nodes.result) flowState.nodes.result.template = hidden.value;
        toggleRequired(hidden, isEmpty(hidden.value));
    }

    function renderFlowProperties() {
        const container = document.getElementById('flow-properties-content');
        if (!container) return;

        const resultNode = flowState.nodes.result;
        const variablePills = Object.values(flowState.nodes)
            .filter(node => node.type === 'select' && node.id)
            .map(node => `<span class="variable-pill" draggable="true" data-variable-id="${node.id}">{${node.id}}</span>`)
            .join(' ');

        const templateHTML = renderTemplateEditorHTML(variablePills);

        if (!flowState.selectedNodeId || !flowState.nodes[flowState.selectedNodeId]) {
            container.innerHTML = `<p class="text-gray-500">Selecciona un nodo para ver sus propiedades o añade una nueva pregunta.</p>${templateHTML}`;
            initTemplateEditor(resultNode?.template || '');
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
            ${templateHTML}
        `;
        initTemplateEditor(resultNode?.template || '');
        addPropertiesEventListeners();
    }

    function initTemplateEditor(templateString) {
        const editor = document.getElementById('final-template-editor');
        const hidden = document.getElementById('final-template');
        if (!editor || !hidden) return;

        editor.innerHTML = htmlFromTemplateString(templateString || '');
        hidden.value = templateString || '';

        // Drop SIEMPRE inserta al final
        editor.addEventListener('dragover', e => e.preventDefault());
        editor.addEventListener('drop', e => {
            e.preventDefault();
            const variableId = e.dataTransfer.getData('text/plain');
            appendTokenAtEnd(editor, variableId);
        });

        // Sync en cambios de texto (por si añaden texto libre)
        const syncHidden = () => {
            hidden.value = textFromTemplateEditor(editor);
            if (flowState.nodes.result) flowState.nodes.result.template = hidden.value;
            toggleRequired(hidden, isEmpty(hidden.value));
        };
        editor.addEventListener('input', syncHidden);
        editor.addEventListener('blur', syncHidden);

        // Click en pastillas (insertar al final)
        document.querySelectorAll('.variable-pill').forEach(pill => {
            pill.addEventListener('click', () => appendTokenAtEnd(editor, pill.dataset.variableId));
            pill.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', pill.dataset.variableId));
        });
    }

    function autoExpandTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }

    function addPropertiesEventListeners() {
        const propNameInput = document.getElementById('prop-name');
        const editor = document.getElementById('final-template-editor');
        const hiddenTpl = document.getElementById('final-template');

        if (propNameInput) {
            propNameInput.addEventListener('input', (e) => {
                const node = flowState.nodes[flowState.selectedNodeId];
                if (node) {
                    const val = e.target.value.replace(/\s/g, '_');
                    e.target.value = val;
                    const nodeTitleEl = document.querySelector(`#${CSS.escape(node.id)} .node-title`);
                    if (nodeTitleEl) nodeTitleEl.textContent = val;
                    node.name = val;
                    toggleRequired(e.target, isEmpty(val));
                    isDirty = true;
                }
            });

            propNameInput.addEventListener('blur', (e) => {
                const node = flowState.nodes[flowState.selectedNodeId];
                if (!node) return;
                const oldId = node.id;
                const newId = e.target.value.replace(/\s/g, '_');
                if (!newId || oldId === newId || (flowState.nodes[newId] && newId !== oldId)) {
                    e.target.value = oldId;
                    if (node.name !== oldId) { node.name = oldId; renderFlowNodes(); }
                    toggleRequired(e.target, isEmpty(e.target.value));
                    return;
                }
                node.id = newId; node.name = newId;
                delete flowState.nodes[oldId];
                flowState.nodes[newId] = node;
                flowState.selectedNodeId = newId;
                Object.values(flowState.nodes).forEach(n => {
                    if (n.type === 'select') n.options.forEach(opt => { if (opt.nextStep === oldId) opt.nextStep = newId; });
                });
                // Actualizar tokens en plantilla
                if (editor) {
                    editor.querySelectorAll(`.template-token[data-variable-id="${CSS.escape(oldId)}"]`).forEach(tok => {
                        tok.setAttribute('data-variable-id', newId);
                        tok.textContent = `{${newId}}`;
                    });
                    hiddenTpl.value = textFromTemplateEditor(editor);
                    if (flowState.nodes.result) flowState.nodes.result.template = hiddenTpl.value;
                }
                isDirty = true;
                renderFlow();
            });
        }

        document.getElementById('add-option-btn')?.addEventListener('click', () => {
            const node = flowState.nodes[flowState.selectedNodeId];
            if (node) {
                node.options.push({ label: '', value: '', nextStep: 'result' });
                isDirty = true;
                renderFlow();
                applyValidationStyles();
            }
        });

        document.querySelectorAll('.delete-option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.dataset.index;
                showGenericConfirm(
                    'Eliminar opción',
                    `¿Eliminar la opción ${parseInt(idx,10)+1}?`,
                    () => {
                        const node = flowState.nodes[flowState.selectedNodeId];
                        if (node) {
                            node.options.splice(idx, 1);
                            isDirty = true;
                            renderFlow();
                        }
                    }
                );
            });
        });

        document.querySelectorAll('.option-prop-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const node = flowState.nodes[flowState.selectedNodeId];
                if (node) {
                    const { index, prop } = e.target.dataset;
                    node.options[index][prop] = e.target.value;
                    isDirty = true;

                    if (e.target.tagName.toLowerCase() === 'textarea') autoExpandTextarea(e.target);
                    toggleRequired(e.target, isEmpty(e.target.value));

                    if (prop === 'label') {
                        const nodeEl = document.getElementById(node.id);
                        if (nodeEl) {
                            const spans = nodeEl.querySelectorAll('.node-options .option span');
                            const idx = parseInt(index, 10);
                            if (spans && spans[idx]) spans[idx].textContent = e.target.value || `Opción ${idx + 1}`;
                        }
                    }
                }
            });
        });
    }

    // ----- Minimap -----
    function getNodesBounds() {
        const nodes = Object.values(flowState.nodes);
        if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(n => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + 220); // ancho aprox del nodo
            maxY = Math.max(maxY, n.y + 100); // alto aprox
        });
        // evitar degenerate
        if (maxX - minX < 1) maxX = minX + 1;
        if (maxY - minY < 1) maxY = minY + 1;
        return { minX, minY, maxX, maxY };
    }

    function drawMinimap() {
        const canvas = document.getElementById('minimap-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffffcc';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#e5e7eb';
        ctx.strokeRect(0, 0, width, height);

        const bounds = getNodesBounds();
        const worldW = bounds.maxX - bounds.minX;
        const worldH = bounds.maxY - bounds.minY;
        const scale = Math.min(width / worldW, height / worldH);

        // Dibujar nodos
        Object.values(flowState.nodes).forEach(n => {
            const nx = (n.x - bounds.minX) * scale;
            const ny = (n.y - bounds.minY) * scale;
            const nw = 220 * scale;
            const nh = 80 * scale;
            ctx.fillStyle = (n.type === 'result') ? '#dcfce7' : '#e0e7ff';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.fillRect(nx, ny, nw, nh);
            ctx.strokeRect(nx, ny, nw, nh);
        });

        // Interacción: click para centrar
        canvas.onclick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;
            const worldX = cx / scale + bounds.minX;
            const worldY = cy / scale + bounds.minY;

            centerOnWorldPoint(worldX, worldY);
        };
    }

    function centerOnWorldPoint(wx, wy) {
        const canvas = document.getElementById('flow-canvas-container');
        const rect = canvas.getBoundingClientRect();
        const scale = zoomState.scale;
        const dx = (rect.width / (2 * scale)) - wx;
        const dy = (rect.height / (2 * scale)) - wy;
        Object.values(flowState.nodes).forEach(n => { n.x += dx; n.y += dy; });
        renderFlow();
    }

    // ----- Interacción de nodos y conexiones -----
    function onNodeMouseDown(e) {
        if (e.target.classList.contains('connector-dot') || e.target.closest('button')) return;
        e.stopPropagation();
        const id = e.currentTarget.id;
        selectNode(id);
        flowState.dragging.active = true;
        flowState.dragging.id = id;
        const node = flowState.nodes[id];
        const canvasRect = document.getElementById('flow-canvas-container').getBoundingClientRect();
        const scale = zoomState.scale;
        const mouseXInCanvas = (e.clientX - canvasRect.left) / scale;
        const mouseYInCanvas = (e.clientY - canvasRect.top) / scale;
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
        const canvasRect = document.getElementById('flow-canvas-container').getBoundingClientRect();
        const scale = zoomState.scale;

        if (panningState.active) {
            const dx = (e.clientX - panningState.startX) / scale;
            const dy = (e.clientY - panningState.startY) / scale;
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
            const mouseX = (e.clientX - canvasRect.left) / scale;
            const mouseY = (e.clientY - canvasRect.top) / scale;
            node.x = mouseX - flowState.dragging.offsetX;
            node.y = mouseY - flowState.dragging.offsetY;
            isDirty = true;
            renderFlow();
        }

        if (flowState.connecting.active) {
            const fromDot = document.querySelector(`.connector-dot[data-node-id="${CSS.escape(flowState.connecting.fromNodeId)}"][data-option-index="${CSS.escape(flowState.connecting.fromOptionIndex)}"]`);
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
            if (draggedNode) draggedNode.style.cursor = 'grab';
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

        // Insertar token automáticamente al FINAL (sin limpiar)
        const editor = document.getElementById('final-template-editor');
        if (editor) appendTokenAtEnd(editor, nodeId);
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
    
    // ----- Modal open/close & navegación -----
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
        applyZoomTransform();
        drawMinimap();
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
        const hidden = document.getElementById('final-template');
        const tplValue = hidden ? hidden.value : '';
        const finalSteps = selectSteps.concat([{
            id: 'result',
            type: 'template',
            template: tplValue,
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

        document.querySelectorAll('#flow-properties-content #prop-name, #flow-properties-content .option-prop-input').forEach(el => {
            if (!el.readOnly) requiredFields.push(el);
        });
        const hiddenTpl = document.getElementById('final-template');
        if (hiddenTpl) requiredFields.push(hiddenTpl);

        requiredFields.forEach(field => {
            field.classList.remove('required-field-error');
            if (!field.value || !field.value.trim()) {
                field.classList.add('required-field-error');
                isValid = false;
            }
        });

        if (!isValid) {
            showInfoModal('Campos obligatorios', 'Por favor, rellena todos los campos marcados en rojo antes de guardar.');
            return;
        }

        const keyToSave = keyInput.value.trim().toLowerCase().replace(/\s/g, '');
        const existing = shortkeyManager.getShortcuts().find(s => s.key === keyToSave);
        if (existing && keyToSave !== currentEditingKey) {
            showInfoModal('Activador duplicado', `El shortkey "@${keyToSave}" ya existe. Por favor, elige otro activador.`);
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

        if (currentEditingKey) shortkeyManager.updateShortcut(currentEditingKey, data);
        else shortkeyManager.addShortcut(data);

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
        for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
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
    
    document.getElementById('generic-confirm-no-btn').addEventListener('click', () => {
        if (!genericConfirmModal.classList.contains('hidden')) {
            genericConfirmModal.classList.add('hidden');
            if (genericYesBtn) genericYesBtn.style.display = '';
            document.getElementById('generic-confirm-no-btn').textContent = 'No';
        }
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
                    () => { shortkeyManager.removeShortcut(key); renderShortcuts(); }
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
                if (genericYesBtn) genericYesBtn.style.display = '';
                document.getElementById('generic-confirm-no-btn').textContent = 'No';
            } else {
                attemptClose();
            }
        }
        if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
            e.preventDefault();
            if (modal) modal.classList.contains('visible') ? attemptClose() : openModal();
        }
    });

    // Initial load
    showListView();
});
