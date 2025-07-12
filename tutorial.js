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
            text: 'Finalmente, documenta aquí el resultado de la llamada. Presiona "Siguiente" para continuar.',
            action: () => collapseAllSections()
        },
        { // 6: CAMBIADO - Ahora tiene un botón "Siguiente"
            element: '#btnSee',
            title: 'Ver Nota Final',
            text: 'Al presionar "Siguiente", se generará la nota completa y se mostrará en un nuevo modal.',
            action: () => document.querySelector('#btnSee').click()
        },
        { // 7
            element: '#noteModalOverlay .modal-content',
            title: 'Nota Final Generada',
            text: 'Esta es la nota completa. Al presionar "Siguiente", te pediremos que dividas la nota.'
        },
        { // 8: CAMBIADO - Ahora tiene un botón "Siguiente"
            element: '#modalSeparateBtn',
            title: 'Dividir Nota',
            text: 'Al presionar "Siguiente", se dividirá la nota y se mostrará en un nuevo modal.',
            action: () => document.querySelector('#modalSeparateBtn').click()
        },
        { // 9
            element: '#separateNoteModalOverlay .modal-content',
            title: 'Nota Dividida',
            text: '¡Excelente! Has completado el tour. Haz clic en "Finalizar".'
        }
    ];

    // --- Funciones Principales del Tour ---

    function startTour() {
        // Asegurarse de que todas las secciones estén colapsadas al inicio del tour
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
            // Esperar un poco por si el elemento (como un modal) está apareciendo
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
        
        // Limpiar resaltado anterior
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }
        
        // Actualizar contenido del popover
        popoverTitle.textContent = step.title;
        popoverText.textContent = step.text;

        // Mostrar overlay y popover
        overlay.classList.remove('hidden');
        popover.classList.remove('hidden');

        // Resaltar el nuevo elemento
        targetElement.classList.add('tutorial-highlight');
        highlightedElement = targetElement;
        
        // Posicionar el popover
        positionPopover(targetElement);

        // --- LÓGICA DE BOTONES RESTAURADA Y CORRECTA ---
        const isLastStep = stepIndex === steps.length - 1;
        prevBtn.classList.toggle('hidden', stepIndex === 0);
        // El botón Siguiente se oculta si es una acción manual o el último paso
        nextBtn.classList.toggle('hidden', step.isManualAction || isLastStep);
        // El botón Finalizar solo se muestra en el último paso
        doneBtn.classList.toggle('hidden', !isLastStep);

        if (step.isManualAction) {
            prepareManualAction(targetElement);
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
            const title = section.querySelector('.section-title');
            if (title) {
                title.click();
                await waitForTransition(section);
            }
        }
    }

    async function switchSection(sectionToCollapseSelector, sectionToExpandSelector) {
        const collapseSection = document.querySelector(sectionToCollapseSelector);
        const expandSection = document.querySelector(sectionToExpandSelector);
        
        if (collapseSection && !collapseSection.classList.contains('collapsed')) {
            const title = collapseSection.querySelector('.section-title');
            if (title) {
                title.click();
                await waitForTransition(collapseSection); // Espera a que termine de colapsar
            }
        }
        if (expandSection && expandSection.classList.contains('collapsed')) {
            const title = expandSection.querySelector('.section-title');
            if (title) {
                title.click();
                await waitForTransition(expandSection); // Espera a que termine de expandir
            }
        }
    }

    async function collapseAllSections() {
        const openSections = document.querySelectorAll('.form-section:not(.collapsed)');
        for (const section of openSections) {
            const title = section.querySelector('.section-title');
            if (title) {
                title.click();
                await waitForTransition(section);
            }
        }
    }

    function prepareManualAction(targetElement) {
        targetElement.addEventListener('click', () => {
            // La lógica de la app abre el modal. El tutorial espera un poco y avanza.
            setTimeout(() => {
                currentStep++;
                showStep(currentStep);
            }, 200); // Pequeño retraso para que el modal aparezca
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
        // La lógica para ir atrás podría necesitar revertir las animaciones.
        // Por ahora, solo retrocede el paso.
        currentStep--;
        showStep(currentStep);
    });

    doneBtn.addEventListener('click', () => {
        // El botón Done ahora simplemente finaliza el tour.
        endTour();
    });

    // --- Lógica de Inicio (Estable y Correcta) ---
    function checkAndShowWelcomeModal() {
        if (localStorage.getItem('tutorialCompleted') === 'true') {
            return;
        }
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
