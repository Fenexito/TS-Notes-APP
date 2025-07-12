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

    // --- Definición de los Pasos del Tutorial ---
    const steps = [
        { // 0
            element: '.sticky-header-container',
            title: 'Encabezado Principal',
            text: 'Esta es la barra de acciones principal. Aquí encuentras los botones para ver, guardar y reiniciar tu nota.'
        },
        { // 1
            element: '#callNoteForm',
            title: 'Tu Espacio de Trabajo',
            text: 'Este es el formulario principal. Al presionar "Siguiente", la primera sección se expandirá automáticamente.',
            action: () => expandSection('#seccion1')
        },
        { // 2
            element: '#seccion1-wrapper',
            title: 'Información de la Cuenta',
            text: '¡Excelente! Al presionar "Siguiente", esta sección se colapsará y continuaremos con la próxima.',
            action: () => switchSection('#seccion1', '#seccion2')
        },
        { // 3
            element: '#seccion2-wrapper',
            title: 'Detalles del Problema',
            text: 'Ahora se ha expandido la sección de "Detalles del Problema".',
            action: () => switchSection('#seccion2', '#seccion3')
        },
        { // 4
            element: '#seccion3-wrapper',
            title: 'Análisis WiFi y TVS',
            text: 'Esta es la sección de "Análisis WiFi y TVS".',
            action: () => switchSection('#seccion3', '#seccion4')
        },
        { // 5
            element: '#seccion4-wrapper',
            title: 'Resolución de la Llamada',
            text: 'Finalmente, documenta aquí el resultado de la llamada. Al presionar "Siguiente", todas las secciones se expandirán.',
            action: () => expandAllSections() // NUEVA ACCIÓN
        },
        { // 6
            element: '#btnSee',
            title: 'Ver Nota Final',
            text: 'Ahora, haz clic en el botón "SEE" para generar la nota completa. Esto abrirá un nuevo modal y continuará el tutorial.',
            isManualAction: true
        },
        { // 7
            element: '#noteModalOverlay .modal-content',
            title: 'Nota Final Generada',
            text: 'Esta es la nota completa. Al presionar "Siguiente", te pediremos que dividas la nota.'
        },
        { // 8
            element: '#modalSeparateBtn',
            title: 'Dividir Nota',
            text: 'Ahora, haz clic en el botón "SPLIT" para ver la nota dividida en secciones.',
            isManualAction: true
        },
        { // 9
            element: '#separateNoteModalOverlay .modal-content',
            title: 'Nota Dividida',
            text: 'Perfecto. Ahora haz clic en el botón "COPY AND SAVE" para simular que guardas la nota y ver el historial.',
            isManualAction: true
        },
        { // 10
            element: '#historySidebar',
            title: 'Panel de Historial',
            text: '¡Bien! La nota se "guardó" y el panel de historial se abrió. Aquí puedes ver todas tus notas anteriores.'
        },
        { // 11
            element: '#historySearchInput',
            title: 'Barra de Búsqueda',
            text: 'Puedes usar esta barra para buscar rápidamente entre tus notas guardadas.'
        },
        { // 12
            element: '.note-history-list .note-item:first-child',
            title: 'Nota Guardada',
            text: 'Así se ve una nota en el historial. ¡Has completado el tour! Haz clic en "Finalizar".'
        }
    ];

    // --- Funciones Principales del Tour ---

    function startTour() {
        document.querySelectorAll('.form-section').forEach(sec => sec.classList.add('collapsed'));
        currentStep = 0;
        showStep(currentStep);
    }

    function showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= steps.length) {
            return endTour();
        }
        
        const step = steps[stepIndex];
        const targetElement = document.querySelector(step.element);

        if (!targetElement) {
            setTimeout(() => {
                const elementAfterWait = document.querySelector(step.element);
                if (elementAfterWait) {
                    showStep(stepIndex);
                } else {
                    console.error(`Elemento del tutorial no encontrado: ${step.element}. Finalizando tour.`);
                    endTour();
                }
            }, 300);
            return;
        }
        
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }
        
        popoverTitle.textContent = step.title;
        popoverText.textContent = step.text;

        overlay.classList.remove('hidden');
        popover.classList.remove('hidden');

        targetElement.classList.add('tutorial-highlight');
        highlightedElement = targetElement;
        
        positionPopover(targetElement);

        const isLastStep = stepIndex === steps.length - 1;
        prevBtn.classList.toggle('hidden', stepIndex === 0);
        nextBtn.classList.toggle('hidden', step.isManualAction || isLastStep);
        doneBtn.classList.toggle('hidden', !isLastStep);

        if (step.isManualAction) {
            prepareManualAction(targetElement, stepIndex);
        }
    }

    function endTour() {
        overlay.classList.add('hidden');
        popover.classList.add('hidden');
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }
        localStorage.setItem('tutorialCompleted', 'true');
    }

    // --- Funciones de Ayuda ---

    function positionPopover(targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();
        let top = targetRect.bottom + 10;
        let left = targetRect.left + (targetRect.width / 2) - (popoverRect.width / 2);

        if (left < 10) left = 10;
        if ((left + popoverRect.width) > window.innerWidth) left = window.innerWidth - popoverRect.width - 20;
        if (top + popoverRect.height > window.innerHeight) {
            top = targetRect.top - popoverRect.height - 10;
        }
        
        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;
    }
    
    function waitForTransition(element, timeout = 500) {
        return new Promise(resolve => {
            const onEnd = () => {
                element.removeEventListener('transitionend', onEnd);
                clearTimeout(timer);
                resolve();
            };
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
        for (const section of sections) {
            section.querySelector('.section-title')?.click();
        }
        if (sections.length > 0) {
            await waitForTransition(sections[sections.length - 1]);
        }
    }
    
    async function collapseAllSections() {
        const sections = document.querySelectorAll('.form-section:not(.collapsed)');
        for (const section of sections) {
            section.querySelector('.section-title')?.click();
        }
        if (sections.length > 0) {
            await waitForTransition(sections[sections.length - 1]);
        }
    }

    function prepareManualAction(targetElement, stepIndex) {
        targetElement.addEventListener('click', async () => {
            if (stepIndex === 9) { // Clic en "COPY AND SAVE"
                // Simular cierre de modales y apertura de historial
                document.getElementById('separateNoteModalOverlay').style.display = 'none';
                document.getElementById('noteModalOverlay').style.display = 'none';
                document.getElementById('btnHistory').click();
            }
            // Esperar un poco a que aparezca el siguiente elemento
            setTimeout(() => {
                currentStep++;
                showStep(currentStep);
            }, 300);
        }, { once: true });
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

    prevBtn.addEventListener('click', () => {
        currentStep--;
        showStep(currentStep);
    });

    doneBtn.addEventListener('click', () => {
        endTour();
    });

    // --- Lógica de Inicio (Estable y Correcta) ---
    function createSampleNoteIfNeeded() {
        const dbName = 'noteAppDB';
        const request = indexedDB.open(dbName);
    
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['notes'], 'readonly');
            const objectStore = transaction.objectStore('notes');
            const countRequest = objectStore.count();
    
            countRequest.onsuccess = function() {
                if (countRequest.result === 0) {
                    const addTransaction = db.transaction(['notes'], 'readwrite');
                    const addObjectStore = addTransaction.objectStore('notes');
                    const sampleNote = {
                        id: `sample-${Date.now()}`,
                        ban: '123456789',
                        cid: '987654321',
                        name: 'John Doe (Sample)',
                        cbr: '1122334455',
                        timestamp: new Date().toISOString(),
                        note: 'Esta es una nota de ejemplo para el tutorial.',
                        formData: {} // Puedes añadir datos del formulario si es necesario
                    };
                    addObjectStore.add(sampleNote);
                }
            };
            db.close();
        };
        request.onerror = function(event) {
            console.error("Error al abrir la base de datos para crear nota de ejemplo:", event.target.errorCode);
        };
    }

    function checkAndShowWelcomeModal() {
        if (localStorage.getItem('tutorialCompleted') === 'true') {
            return;
        }
        createSampleNoteIfNeeded(); // Asegura que la nota de ejemplo exista
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
