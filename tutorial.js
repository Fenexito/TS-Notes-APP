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
            element: '.sticky-header-container', // CAMBIO APLICADO
            title: 'Ver Nota Final',
            text: 'Al presionar "Siguiente", se generará la nota completa y se mostrará en un nuevo modal.',
            action: () => document.querySelector('#btnSee').click()
        },
        { // PASO 9
            element: '#noteModalOverlay .modal-content',
            title: 'Nota Final Generada',
            text: 'Esta es la nota completa. Presiona "Siguiente" para continuar.'
        },
        { // PASO 10
            element: '#modalSeparateBtn',
            title: 'Dividir Nota',
            text: 'Al presionar "Siguiente", se dividirá la nota y se mostrará en un nuevo modal.',
            action: () => document.querySelector('#modalSeparateBtn').click()
        },
        { // PASO 11
            element: '#separateNoteModalOverlay .modal-content',
            title: 'Nota Dividida',
            text: 'Perfecto. Ahora presiona "Siguiente" para resaltar el botón de guardado.'
        },
        { // PASO 12
            element: '#separateModalCopySaveBtn',
            title: 'Guardar Nota',
            text: 'Al presionar "Siguiente", se simulará que guardas la nota y se abrirá el historial.',
            action: () => {
                document.getElementById('separateNoteModalOverlay').style.display = 'none';
                document.getElementById('noteModalOverlay').style.display = 'none';
                document.getElementById('btnHistory').click();
            }
        },
        { // PASO 13
            element: '#historySidebar',
            title: 'Panel de Historial',
            text: '¡Excelente! Has llegado al final del tour. Haz clic en "Finalizar".'
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
        
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
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
        
        // Lógica de visibilidad que funciona:
        // 1. Mostrar el overlay y el popover
        overlay.classList.remove('hidden');
        popover.classList.remove('hidden');

        // 2. Actualizar contenido
        popoverTitle.textContent = step.title;
        popoverText.textContent = step.text;
        
        // 3. Resaltar el nuevo elemento
        targetElement.classList.add('tutorial-highlight');
        highlightedElement = targetElement;
        
        // 4. Posicionar el popover
        positionPopover(targetElement, step.position);

        // 5. Configurar botones
        const isLastStep = stepIndex === steps.length - 1;
        prevBtn.classList.toggle('hidden', stepIndex === 0);
        nextBtn.classList.toggle('hidden', isLastStep);
        doneBtn.classList.toggle('hidden', !isLastStep);
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
            default:
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
