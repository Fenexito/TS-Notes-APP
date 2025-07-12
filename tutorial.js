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
        { // PASO 1
            element: '.sticky-header-container',
            title: 'Encabezado Principal',
            text: 'Esta es la barra de acciones principal. Aquí encuentras los botones para ver, guardar y reiniciar tu nota.'
        },
        { // PASO 2
            element: '#callNoteForm',
            title: 'Tu Espacio de Trabajo',
            text: 'Este es el formulario principal. Al presionar "Siguiente", la primera sección se expandirá automáticamente.',
            action: () => expandSection('#seccion1')
        },
        { // PASO 3
            element: '#seccion1-wrapper',
            title: 'Información de la Cuenta',
            text: '¡Excelente! Al presionar "Siguiente", esta sección se colapsará y continuaremos con la próxima.',
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
            position: 'left-center' // Posición especial
        },
        { // PASO 8
            element: '#btnSee',
            title: 'Ver Nota Final',
            text: 'Ahora, haz clic en el botón "SEE" para generar la nota completa. Esto abrirá un nuevo modal.',
            isManualAction: true
        },
        { // PASO 9
            element: '#noteModalOverlay .modal-content',
            title: 'Nota Final Generada',
            text: 'Esta es la nota completa. Presiona "Siguiente" para continuar.'
        },
        { // PASO 10
            element: '#modalSeparateBtn',
            title: 'Dividir Nota',
            text: 'Ahora, haz clic en el botón "SPLIT" para ver la nota dividida en secciones.',
            isManualAction: true
        },
        { // PASO 11
            element: '#separateNoteModalOverlay .modal-content',
            title: 'Nota Dividida',
            text: 'Perfecto. Ahora haz clic en el botón "COPY AND SAVE" para simular que guardas la nota y ver el historial.',
            isManualAction: true
        },
        { // PASO 12
            element: '#historySidebar',
            title: 'Panel de Historial',
            text: '¡Bien! La nota se "guardó" y el panel de historial se abrió. Aquí puedes ver todas tus notas anteriores.'
        },
        { // PASO 13
            element: '#historySearchInput',
            title: 'Barra de Búsqueda',
            text: 'Puedes usar esta barra para buscar rápidamente entre tus notas guardadas.'
        },
        { // PASO 14
            element: '.note-history-list .note-item:first-child',
            title: 'Nota Guardada',
            text: 'Así se ve una nota en el historial. Cada nota guardada aparecerá aquí.'
        },
        { // PASO 15
            element: '#historyactionsfooter',
            title: 'Importar y Exportar',
            text: 'Desde aquí puedes exportar todas tus notas a un archivo o importar notas desde otro dispositivo.'
        },
        { // PASO 16
            element: '#closeHistoryBtn',
            title: 'Cerrar Historial',
            text: 'Haz clic en el botón de cerrar para continuar.',
            isManualAction: true
        },
        { // PASO 17
            element: '#btnChecklistMenu',
            title: 'Menú de Checklist',
            text: 'Este botón abre un menú con checklists útiles para tus llamadas. Haz clic en él para abrirlo.',
            isManualAction: true
        },
        { // PASO 18
            element: '#checklistSidebar',
            title: 'Checklist',
            text: 'Este es el menú de checklist. Haz clic en el botón de cerrar para continuar.',
            isManualAction: true,
            manualActionTarget: '#closeChecklistBtn'
        },
        { // PASO 19
            element: '#feedback-btn',
            title: 'Enviar Comentarios',
            text: 'Si tienes alguna idea o encuentras un problema, puedes enviarnos tus comentarios desde aquí.'
        },
        { // PASO 20
            element: 'body',
            title: '¡Todo Listo!',
            text: 'Has completado el tour y estás listo para empezar a tomar notas. ¡Éxito!',
            position: 'center'
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
                if (elementAfterWait) showStep(stepIndex);
                else { console.error(`Elemento no encontrado: ${step.element}`); endTour(); }
            }, 300);
            return;
        }
        
        // 1. Limpiar el estado anterior
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }
        popover.classList.remove('active');
        
        // 2. Actualizar el contenido del popover
        popoverTitle.textContent = step.title;
        popoverText.textContent = step.text;
        overlay.classList.remove('hidden');
        
        // 3. Resaltar el nuevo elemento
        targetElement.classList.add('tutorial-highlight');
        highlightedElement = targetElement;
        
        // 4. LÓGICA DE POSICIONAMIENTO CORREGIDA
        // Hacemos el popover visible pero transparente para medirlo
        popover.style.visibility = 'visible';
        popover.style.opacity = '0';

        // Forzamos el recálculo del layout leyendo una propiedad.
        // Esto garantiza que getBoundingClientRect() devuelva valores correctos.
        void popover.offsetHeight; 

        requestAnimationFrame(() => {
            positionPopover(targetElement, step.position);
            // Hacemos el popover visible con la transición de CSS
            popover.style.opacity = '1';
            popover.classList.add('active');
        });

        // 5. Configurar botones
        const isLastStep = stepIndex === steps.length - 1;
        prevBtn.classList.toggle('hidden', stepIndex === 0);
        nextBtn.classList.toggle('hidden', step.isManualAction || isLastStep);
        doneBtn.classList.toggle('hidden', !isLastStep);

        if (step.isManualAction) {
            prepareManualAction(targetElement, step.manualActionTarget, stepIndex);
        }
    }

    function endTour() {
        overlay.classList.add('hidden');
        popover.classList.remove('active');
        popover.style.visibility = 'hidden';
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }
        localStorage.setItem('tutorialCompleted', 'true');
    }

    // --- Funciones de Ayuda ---

    function positionPopover(targetElement, position = 'bottom-center') {
        const targetRect = targetElement.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();
        let top, left;

        switch (position) {
            case 'left-center':
                top = targetRect.top + (targetRect.height / 2) - (popoverRect.height / 2);
                left = targetRect.left - popoverRect.width - 15;
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
    
    async function collapseAllSections() {
        const sections = document.querySelectorAll('.form-section:not(.collapsed)');
        for (const section of sections) { section.querySelector('.section-title')?.click(); }
        if (sections.length > 0) await waitForTransition(sections[sections.length - 1]);
    }

    function prepareManualAction(targetElement, manualActionTargetSelector, stepIndex) {
        const actionElement = manualActionTargetSelector ? document.querySelector(manualActionTargetSelector) : targetElement;
        
        actionElement.addEventListener('click', async () => {
            // Lógica especial para el botón "COPY AND SAVE"
            if (stepIndex === 11) { // PASO 11
                document.getElementById('separateNoteModalOverlay').style.display = 'none';
                document.getElementById('noteModalOverlay').style.display = 'none';
                document.getElementById('btnHistory').click();
            }
            
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
                        const sampleNote = {
                            id: `sample-${Date.now()}`,
                            ban: '123456789', cid: '987654321', name: 'John Doe (Sample)', cbr: '1122334455',
                            timestamp: new Date().toISOString(),
                            note: 'Esta es una nota de ejemplo para el tutorial.', formData: {}
                        };
                        addObjectStore.add(sampleNote);
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
