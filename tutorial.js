// Se utiliza una IIFE para evitar conflictos.
(function() {

    // --- Elementos del DOM ---
    const popover = document.getElementById('custom-tutorial-popover');
    const popoverTitle = document.getElementById('tutorial-popover-title');
    const popoverText = document.getElementById('tutorial-popover-text');
    const prevBtn = document.getElementById('tutorial-prev-btn');
    const nextBtn = document.getElementById('tutorial-next-btn');
    const doneBtn = document.getElementById('tutorial-done-btn');
    let currentStep = -1;
    let highlightedElement = null;

    // --- Definición de los Pasos del Tutorial ---
    const steps = [
        { // 0: Modal de Bienvenida (manejado por separado)
            // Este paso es conceptual, la lógica está en checkAndShowWelcomeModal
        },
        { // 1: Encabezado
            element: '.sticky-header-container',
            title: 'Encabezado Principal',
            text: 'Esta es la barra de acciones principal. Aquí encuentras los botones para ver, guardar y reiniciar tu nota.'
        },
        { // 2: Formulario
            element: '#callNoteForm',
            title: 'Formulario de Notas',
            text: 'Este es el formulario principal. Al presionar "Siguiente", la primera sección se expandirá automáticamente.',
            onNext: () => expandSection('#seccion1')
        },
        { // 3: Sección 1
            element: '#seccion1-wrapper',
            title: 'Información de la Cuenta',
            text: '¡Excelente! Al presionar "Siguiente", esta sección se colapsará y continuaremos con la próxima.',
            onNext: () => switchSection('#seccion1', '#seccion2')
        },
        { // 4: Sección 2
            element: '#seccion2-wrapper',
            title: 'Detalles del Problema',
            text: 'Ahora se ha expandido la sección de "Detalles del Problema".',
            onNext: () => switchSection('#seccion2', '#seccion3')
        },
        { // 5: Sección 3
            element: '#seccion3-wrapper',
            title: 'Análisis WiFi y TVS',
            text: 'Esta es la sección de "Análisis WiFi y TVS".',
            onNext: () => switchSection('#seccion3', '#seccion4')
        },
        { // 6: Sección 4
            element: '#seccion4-wrapper',
            title: 'Resolución de la Llamada',
            text: 'Finalmente, documenta aquí el resultado de la llamada. Presiona "Siguiente" para continuar.',
            onNext: () => collapseAllSections()
        },
        { // 7: Botón SEE
            element: '#btnSee',
            title: 'Ver Nota Final',
            text: 'Ahora, haz clic en el botón "SEE" para generar la nota completa. Esto abrirá un nuevo modal y finalizará el tour.',
            isManualAction: true // El usuario debe hacer clic
        }
    ];

    // --- Funciones Principales del Tour ---

    function startTour() {
        currentStep = 1; // Empezamos en el paso del encabezado
        showStep(currentStep);
    }

    function showStep(stepIndex) {
        if (stepIndex < 1 || stepIndex >= steps.length) {
            return endTour();
        }

        const step = steps[stepIndex];
        const targetElement = document.querySelector(step.element);

        if (!targetElement) {
            console.error(`Elemento del tutorial no encontrado: ${step.element}`);
            return endTour();
        }

        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }

        popoverTitle.textContent = step.title;
        popoverText.textContent = step.text;
        popover.classList.add('active');

        targetElement.classList.add('tutorial-highlight');
        highlightedElement = targetElement;
        
        positionPopover(targetElement);

        prevBtn.classList.toggle('hidden', stepIndex <= 1);
        nextBtn.classList.toggle('hidden', step.isManualAction || stepIndex === steps.length - 1);
        doneBtn.classList.toggle('hidden', true); // El botón Done no se usa

        if (step.isManualAction) {
            prepareManualAction(targetElement);
        }
    }

    function endTour() {
        popover.classList.remove('active');
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }
        localStorage.setItem('tutorialCompleted', 'true');
    }

    // --- Funciones de Ayuda ---

    function positionPopover(targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();
        let top = targetRect.bottom + 15;
        let left = targetRect.left + (targetRect.width / 2) - (popoverRect.width / 2);
        if (left < 10) left = 10;
        if ((left + popoverRect.width) > window.innerWidth) left = window.innerWidth - popoverRect.width - 10;
        if ((top + popoverRect.height) > window.innerHeight) top = targetRect.top - popoverRect.height - 15;
        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;
    }
    
    // Función robusta que no se cuelga si no hay animación
    function waitForTransition(element, timeout = 500) {
        return new Promise(resolve => {
            const onEnd = () => {
                element.removeEventListener('transitionend', onEnd);
                clearTimeout(timer);
                resolve();
            };
            const timer = setTimeout(onEnd, timeout); // Fallback por si no hay transición
            element.addEventListener('transitionend', onEnd);
        });
    }

    async function expandSection(sectionSelector) {
        const section = document.querySelector(sectionSelector);
        if (section) {
            section.classList.remove('collapsed');
            await waitForTransition(section);
        }
    }

    async function switchSection(sectionToCollapseSelector, sectionToExpandSelector) {
        const sectionToCollapse = document.querySelector(sectionToCollapseSelector);
        const sectionToExpand = document.querySelector(sectionToExpandSelector);
        if (sectionToCollapse) sectionToCollapse.classList.add('collapsed');
        if (sectionToExpand) sectionToExpand.classList.remove('collapsed');
        if(sectionToCollapse) await waitForTransition(sectionToCollapse);
    }
    
    function collapseAllSections() {
        document.querySelectorAll('.form-section.collapsed').forEach(sec => sec.classList.add('collapsed'));
    }

    function prepareManualAction(targetElement) {
        targetElement.addEventListener('click', function handleManualClick() {
            // El clic del usuario abre el modal de la nota final (lógica en script.js)
            // Y aquí finalizamos el tour.
            endTour();
        }, { once: true });
    }

    // --- Event Listeners ---
    nextBtn.addEventListener('click', async () => {
        const step = steps[currentStep];
        if (step.onNext) {
            nextBtn.disabled = true;
            await step.onNext();
            nextBtn.disabled = false;
        }
        currentStep++;
        showStep(currentStep);
    });

    prevBtn.addEventListener('click', () => {
        currentStep--;
        showStep(currentStep);
    });

    // --- Lógica de Inicio ---
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
            if (e.key === 'Enter') e.preventDefault(); startHandler();
        });
    }

    window.addEventListener('load', checkAndShowWelcomeModal);

})();

