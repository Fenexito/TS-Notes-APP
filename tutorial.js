// Se utiliza una IIFE para evitar conflictos.
(function() {

    // --- Elementos del DOM ---
    const overlay = document.getElementById('custom-tutorial-overlay');
    const popover = document.getElementById('custom-tutorial-popover');
    const popoverTitle = document.getElementById('tutorial-popover-title');
    const popoverText = document.getElementById('tutorial-popover-text');
    const prevBtn = document.getElementById('tutorial-prev-btn');
    const nextBtn = document.getElementById('tutorial-next-btn');
    const doneBtn = document.getElementById('tutorial-done-btn');
    
    let currentStep = 0;
    let highlightedElement = null;
    let spotlightedElement = null;

    // --- DATOS DE EJEMPLO PARA EL TUTORIAL ---
    const sampleNoteData = {
        ban: '9999999', cid: '8888888', name: 'Alexander', cbr: '77777777',
        caller: 'Owner', verifiedBy: 'Security Questions', address: '1234 Maple RD, BC V1B0X9',
        serviceOnCsr: 'Active', outage: 'no', errorsInNC: 'no', accountSuspended: 'no',
        serviceSelect: 'Optik TV (Legacy)', issueSelect: 'Video Quality Issues',
        cxIssueText: 'This is the place were you are gonna save the information from the cx issue. You can add as much info as you need to fill all the information that your cx is sharing with you about the problem',
        physicalCheckList1Select: 'VIP5662w, Power connected properly / Powered ON, Connected WIRELES, HDMI connected / Input selected properly',
        xVuStatusSelect: 'Critical Errors Found', packetLossSelect: 'Some Packet Loss',
        additionalinfoText: 'This is an aditional Text to add info that is relevant to the issue or the solution',
        troubleshootingProcessText: 'His is the place were you are gonna put ALL YOUR TROUBLESHOOT PROCESS. Including all the relevant information you need to follow to solve the problem, including Reboot, FR, CORE consultation, ETC.',
        awaAlertsSelect: 'Broadband DOWNSTREAM congestion (cx using more than 80% of the speed plan)',
        awaAlerts2Select: 'Occasional Slowspeed in ONE device',
        awaStepsSelect: "Advice cx about issues but cx don't want to troubheshoot this now",
        activeDevicesInput: '10', totalDevicesInput: '20',
        downloadBeforeInput: '110Mbps', uploadBeforeInput: '90Mbps',
        downloadAfterInput: '580Mbps', uploadAfterInput: '490Mbps',
        tvsSelect: 'YES', tvsKeyInput: 'JSH182HF',
        extraStepsSelect: 'Use go/send to share PIN reset instructions',
        resolvedSelect: 'Yes | EOC', transferCheckbox: false, transferSelect: 'TRANSFER TO FFH CARE',
        csrOrderInput: '99999999', ticketInput: '000000001111111',
        skillToggle: false
    };

    // --- Definición de los Pasos del Tutorial ---
    const steps = [
        { // PASO 1
            element: '.sticky-header-container',
            title: 'Encabezado Principal',
            text: 'Esta es la barra de acciones principal. Aquí encuentras los botones para ver, guardar y reiniciar tu nota.'
        },
        { // PASO 2
            element: '#callNoteForm',
            title: 'Tu Espacio de Trabajo',
            text: 'Este es el formulario principal, que hemos llenado con datos de ejemplo. Al presionar "Siguiente", la primera sección se expandirá.',
            action: () => expandSection('#seccion1')
        },
        { // PASO 3
            element: '#seccion1-wrapper',
            title: 'Información de la Cuenta',
            text: 'Como puedes ver, los campos ya contienen información. Al presionar "Siguiente", esta sección se colapsará y continuaremos con la próxima.',
            action: () => switchSection('#seccion1', '#seccion2')
        },
        { // PASO 4
            element: '#seccion2-wrapper',
            title: 'Detalles del Problema',
            text: 'Ahora se ha expandido la sección de "Detalles del Problema".',
            action: () => switchSection('#seccion2', '#seccion3')
        },
        { // PASO 5
            element: '#seccion3-wrapper',
            title: 'Análisis WiFi y TVS',
            text: 'Esta es la sección de "Análisis WiFi y TVS".',
            action: () => switchSection('#seccion3', '#seccion4')
        },
        { // PASO 6
            element: '#seccion4-wrapper',
            title: 'Resolución de la Llamada',
            text: 'Finalmente, documenta aquí el resultado de la llamada. Al presionar "Siguiente", todas las secciones se expandirán.',
            action: () => expandAllSections()
        },
        { // PASO 7
            element: '#callNoteForm',
            title: 'Vista Expandida',
            text: 'Todas las secciones están ahora visibles. Presiona "Siguiente" para continuar y generar la nota final.',
            position: 'left-center'
        },
        { // PASO 8
            element: '.sticky-header-container',
            title: 'Botones de la App',
            text: 'Estos botones te permiten guardar, reiniciar o ver la nota final. Presiona "Siguiente" para continuar.',
            spotlightElement: '#topactions'
        },
        { // PASO 9
            element: '.sticky-header-container',
            title: 'Ver Nota Final',
            text: 'Al presionar "Siguiente", se generará la nota completa basada en los datos de ejemplo.',
            action: () => document.querySelector('#btnSee').click(),
            spotlightElement: '#btnSee'
        },
        { // PASO 10
            element: '#modalNoteTextarea', // CORREGIDO: Resalta directamente el textarea
            title: 'Nota Final Generada',
            text: 'Esta es la nota completa. Exploraremos sus opciones. Presiona "Siguiente".'
        },
        { // PASO 11
            element: '.modal-actions', // CORREGIDO: Resalta directamente el contenedor de acciones
            title: 'Botones de la Nota Final',
            text: 'Estos botones te permiten realizar acciones con la nota generada.'
        },
        { // PASO 12
            element: '#noteModalOverlay .modal-content',
            title: 'Dividir Nota',
            text: 'Al presionar "Siguiente", se dividirá la nota y se mostrará en un nuevo modal.',
            action: () => document.querySelector('#modalSeparateBtn').click(),
            spotlightElement: '#modalSeparateBtn'
        },
        { // PASO 13
            element: '#separateNoteModalOverlay .modal-content',
            title: 'Notas Divididas',
            text: 'Aquí puedes ver la nota dividida en dos partes, cada una con su propio botón para copiar.',
            spotlightElement: '.separate-notes-container'
        },
        { // PASO 14
            element: '#separateNoteModalOverlay .modal-content',
            title: 'Guardar Nota',
            text: 'Al presionar "Siguiente", se simulará que guardas la nota y se abrirá el historial.',
            action: () => document.querySelector('#separateModalCopySaveBtn').click(),
            spotlightElement: '#separateModalCopySaveBtn'
        },
        { // PASO 15
            element: '.sticky-header-container',
            title: 'Nota Guardada',
            text: '¡Perfecto! La nota se ha "guardado". Ahora, presiona "Siguiente" para abrir el historial.',
            action: () => document.querySelector('#btnHistory').click(),
            spotlightElement: '#btnHistory'
        },
        { // PASO 16
            element: '#historySidebar',
            title: 'Panel de Historial',
            text: 'Este es el panel de historial. Presiona "Siguiente" para continuar.',
            position: 'left' // CORREGIDO: Posición para el menú lateral
        },
        { // PASO 17
            element: '#historySidebar',
            title: 'Barra de Búsqueda',
            text: 'Puedes usar esta barra para buscar rápidamente entre tus notas guardadas.',
            position: 'left',
            spotlightElement: '#historySearchInput'
        },
        { // PASO 18
            element: '#historySidebar',
            title: 'Importar y Exportar',
            text: 'Desde aquí puedes exportar todas tus notas a un archivo o importar notas desde otro dispositivo.',
            position: 'left',
            spotlightElement: '#historyactionsfooter'
        },
        { // PASO 19
            element: '.sticky-header-container',
            title: 'Menú Izquierdo',
            text: 'El historial se ha cerrado. Ahora, presiona "Siguiente" para abrir el menú de la izquierda.',
            action: async () => { // CORREGIDO: La acción ahora cierra el menú
                document.querySelector('#closeHistoryBtn').click();
                await waitForTransition(document.getElementById('historySidebar'));
                document.querySelector('#btnChecklistMenu').click();
            },
            spotlightElement: '#btnChecklistMenu'
        },
        { // PASO 20
            element: '#checklistSidebar',
            title: 'Menú de Checklist',
            text: 'Este menú contiene checklists útiles para tus llamadas. Presiona "Siguiente" para continuar.',
            position: 'right' // CORREGIDO: Posición para el menú izquierdo
        },
        { // PASO 21
            element: '#feedback-btn', // CORREGIDO: El elemento principal ahora es el botón de feedback
            title: 'Enviar Comentarios',
            text: 'Si tienes alguna idea, puedes enviarla desde este botón. Al presionar "Siguiente", cerraremos el menú de la izquierda.',
            action: () => document.querySelector('#closeChecklistBtn').click()
        },
        { // PASO 22
            element: '#feedback-btn',
            title: 'Abrir Feedback',
            text: 'Al presionar "Siguiente", abriremos el modal de feedback.',
            action: () => document.querySelector('#feedback-btn').click()
        },
        { // PASO 23
            element: '#feedbackModalOverlay .modal-content',
            title: 'Modal de Feedback',
            text: 'Desde aquí puedes enviar tus comentarios. Al presionar "Siguiente", lo cerraremos.',
            action: () => document.querySelector('#closeFeedbackModalBtn').click()
        },
        { // PASO 24
            element: 'body',
            title: '¡Todo Listo!',
            text: 'Has completado el tour y estás listo para empezar a tomar notas. ¡Éxito!',
            position: 'center'
        }
    ];

    // --- Funciones Principales del Tour ---

    function startTour() {
        loadSampleDataIntoForm(sampleNoteData);
        document.querySelectorAll('.form-section').forEach(sec => sec.classList.add('collapsed'));
        currentStep = 0;
        showStep(currentStep);
    }

    function showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= steps.length) {
            return endTour();
        }
        
        const step = steps[stepIndex];
        
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }
        if (spotlightedElement) {
            spotlightedElement.classList.remove('tutorial-spotlight');
        }

        const targetElement = document.querySelector(step.element);

        if (!targetElement) {
            setTimeout(() => {
                const elementAfterWait = document.querySelector(step.element);
                if (elementAfterWait) showStep(stepIndex);
                else { console.error(`Elemento no encontrado: ${step.element}`); endTour(); }
            }, 300);
            return;
        }
        
        overlay.classList.remove('hidden');
        popover.classList.remove('hidden');
        popoverTitle.textContent = step.title;
        popoverText.textContent = step.text;
        
        targetElement.classList.add('tutorial-highlight');
        highlightedElement = targetElement;
        
        if (step.spotlightElement) {
            const spotElement = document.querySelector(step.spotlightElement);
            if (spotElement) {
                spotElement.classList.add('tutorial-spotlight');
                spotlightedElement = spotElement;
            }
        }
        
        // Usar requestAnimationFrame para asegurar que el popover es medible antes de posicionarlo
        requestAnimationFrame(() => {
            positionPopover(targetElement, step.position);
        });

        const isLastStep = stepIndex === steps.length - 1;
        prevBtn.classList.toggle('hidden', stepIndex === 0);
        nextBtn.classList.toggle('hidden', isLastStep);
        doneBtn.classList.toggle('hidden', !isLastStep);
    }

    function endTour() {
        overlay.classList.add('hidden');
        popover.classList.add('hidden');
        if (highlightedElement) highlightedElement.classList.remove('tutorial-highlight');
        if (spotlightedElement) spotlightedElement.classList.remove('tutorial-spotlight');
        localStorage.setItem('tutorialCompleted', 'true');
        document.querySelector('#btnReset').click();
    }

    // --- Funciones de Ayuda ---

    function positionPopover(targetElement, position = 'bottom-center') {
        const targetRect = targetElement.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();
        let top, left;

        const historySidebar = document.getElementById('historySidebar');
        const checklistSidebar = document.getElementById('checklistSidebar');
        const isHistoryOpen = historySidebar && historySidebar.classList.contains('active');
        const isChecklistOpen = checklistSidebar && checklistSidebar.classList.contains('active');

        switch (position) {
            case 'left-center':
                top = targetRect.top + (targetRect.height / 2) - (popoverRect.height / 2);
                left = targetRect.left - popoverRect.width - 15;
                break;
            case 'left':
                top = targetRect.top + 20;
                left = targetRect.left - popover.offsetWidth - 20;
                break;
            case 'right':
                top = targetRect.top + 20;
                left = targetRect.right + 20;
                break;
            case 'center':
                top = window.innerHeight / 2 - popoverRect.height / 2;
                left = window.innerWidth / 2 - popoverRect.width / 2;
                break;
            default: // bottom-center
                top = targetRect.bottom + 15;
                left = targetRect.left + (targetRect.width / 2) - (popoverRect.width / 2);
                break;
        }

        if (isHistoryOpen) {
            left -= (historySidebar.offsetWidth / 2);
        } else if (isChecklistOpen) {
            // Asumiendo que el menú izquierdo tiene un ancho similar
            left += (checklistSidebar.offsetWidth / 2);
        }

        if (left < 10) left = 10;
        if ((left + popoverRect.width) > window.innerWidth) left = window.innerWidth - popoverRect.width - 10;
        if (top < 10) top = 10;
        if ((top + popoverRect.height) > window.innerHeight) top = window.innerHeight - popoverRect.height - 10;
        
        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;
    }
    
    function waitForTransition(element, timeout = 500) {
        return new Promise(resolve => {
            const onEnd = () => { element.removeEventListener('transitionend', onEnd); clearTimeout(timer); resolve(); };
            const timer = setTimeout(onEnd, timeout);
            element.addEventListener('transitionend', onEnd, { once: true });
        });
    }

    async function expandSection(sectionSelector) {
        const section = document.querySelector(sectionSelector);
        if (section && section.classList.contains('collapsed')) {
            section.querySelector('.section-title')?.click();
            await waitForTransition(section);
        }
    }

    async function switchSection(sectionToCollapseSelector, sectionToExpandSelector) {
        const collapseSection = document.querySelector(sectionToCollapseSelector);
        const expandSection = document.querySelector(sectionToExpandSelector);
        if (collapseSection && !collapseSection.classList.contains('collapsed')) {
            collapseSection.querySelector('.section-title')?.click();
            await waitForTransition(collapseSection);
        }
        if (expandSection && expandSection.classList.contains('collapsed')) {
            expandSection.querySelector('.section-title')?.click();
            await waitForTransition(expandSection);
        }
    }

    async function expandAllSections() {
        const sections = document.querySelectorAll('.form-section.collapsed');
        for (const section of sections) { section.querySelector('.section-title')?.click(); }
        if (sections.length > 0) await waitForTransition(sections[sections.length - 1]);
    }
    
    // --- Carga de Datos de Ejemplo (FUNCIÓN MEJORADA) ---
    async function loadSampleDataIntoForm(data) {
        const dispatchEvents = (element) => {
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
        };

        for (const key in data) {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = data[key];
                } else if (element.type === 'radio') {
                    const radioToSelect = document.querySelector(`input[name="${element.name}"][value="${data[key]}"]`);
                    if (radioToSelect) radioToSelect.checked = true;
                } else {
                    element.value = data[key];
                }
                dispatchEvents(element);
                if (element.tagName === 'SELECT') {
                    await new Promise(res => setTimeout(res, 150));
                }
            }
        }
    }

    // --- Event Listeners de los botones del tutorial ---
    nextBtn.addEventListener('click', async () => {
        const step = steps[currentStep];
        if (step.action) {
            nextBtn.disabled = true;
            await step.action();
            nextBtn.disabled = false;
        }
        currentStep++;
        showStep(currentStep);
    });

    prevBtn.addEventListener('click', () => { currentStep--; showStep(currentStep); });
    doneBtn.addEventListener('click', endTour);

    // --- Lógica de Inicio (Estable y Correcta) ---
    function createSampleNoteIfNeeded() {
        try {
            const dbName = 'noteAppDB';
            const request = indexedDB.open(dbName);
            request.onsuccess = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('notes')) {
                    db.close(); return;
                }
                const transaction = db.transaction(['notes'], 'readonly');
                const objectStore = transaction.objectStore('notes');
                const countRequest = objectStore.count();
                countRequest.onsuccess = function() {
                    if (countRequest.result === 0) {
                        const addTransaction = db.transaction(['notes'], 'readwrite');
                        const addObjectStore = addTransaction.objectStore('notes');
                        const noteToSave = {
                            id: `sample-${Date.now()}`,
                            ban: sampleNoteData.ban, cid: sampleNoteData.cid, name: sampleNoteData.name, cbr: sampleNoteData.cbr,
                            timestamp: new Date().toISOString(),
                            note: 'Esta es una nota de ejemplo para el tutorial.',
                            formData: sampleNoteData
                        };
                        addObjectStore.add(noteToSave);
                    }
                };
                db.close();
            };
        } catch (e) { console.error("No se pudo verificar/crear la nota de ejemplo:", e); }
    }

    function checkAndShowWelcomeModal() {
        if (localStorage.getItem('tutorialCompleted') === 'true') return;
        
        createSampleNoteIfNeeded();
        const welcomeModal = document.getElementById('welcomeModalOverlay');
        const startBtn = document.getElementById('startTakingNotesBtn');
        const nameInput = document.getElementById('welcomeAgentNameInput');
        
        welcomeModal.style.display = 'flex';
        
        const startHandler = () => {
            if (nameInput.value.trim() !== '') {
                welcomeModal.style.display = 'none';
                startTour(); 
            }
        };
        startBtn.addEventListener('click', startHandler);
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && nameInput.value.trim() !== '') {
                e.preventDefault();
                startHandler();
            }
        });
    }

    window.addEventListener('load', checkAndShowWelcomeModal);

})();
