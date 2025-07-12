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
        { // 0
            element: '.sticky-header-container',
            title: 'Encabezado Principal',
            text: 'Esta es la barra de acciones principal. Aquí encuentras los botones para ver, guardar y reiniciar tu nota.'
        },
        { // 1
            element: '#callNoteForm',
            title: 'Formulario de Notas',
            text: 'Este es el formulario principal donde ingresarás toda la información. Al presionar "Siguiente", la primera sección se expandirá automáticamente.'
        },
        { // 2
            element: '#seccion1-wrapper',
            title: 'Información de la Cuenta',
            text: '¡Excelente! La primera sección se ha expandido. Al presionar "Siguiente", esta se colapsará y continuaremos con la próxima.',
            onNext: () => toggleSection('#seccion2')
        },
        { // 3
            element: '#seccion2-wrapper',
            title: 'Detalles del Problema',
            text: 'Ahora se ha expandido la sección de "Detalles del Problema".',
            onNext: () => toggleSection('#seccion3')
        },
        { // 4
            element: '#seccion3-wrapper',
            title: 'Análisis WiFi y TVS',
            text: 'Esta es la sección de "Análisis WiFi y TVS".',
            onNext: () => toggleSection('#seccion4')
        },
        { // 5
            element: '#seccion4-wrapper',
            title: 'Resolución de la Llamada',
            text: 'Finalmente, documenta aquí el resultado de la llamada. Presiona "Siguiente" para continuar.',
            onNext: () => collapseAllSections()
        },
        { // 6
            element: '#btnSee',
            title: 'Ver Nota Final',
            text: 'Ahora, haz clic en el botón "SEE" para generar la nota completa. Esto abrirá un nuevo modal y continuará el tutorial.',
            isManualAction: true // Indica que el usuario debe hacer clic en el elemento
        }
    ];

    // --- Funciones Principales del Tour ---

    function startTour() {
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
            console.error(`Elemento del tutorial no encontrado: ${step.element}`);
            return endTour();
        }

        // Limpiar resaltado anterior
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }

        // Actualizar contenido del popover
        popoverTitle.textContent = step.title;
        popoverText.textContent = step.text;
        popover.classList.add('active');

        // Resaltar el nuevo elemento
        targetElement.classList.add('tutorial-highlight');
        highlightedElement = targetElement;
        
        // Posicionar el popover
        positionPopover(targetElement);

        // Configurar botones
        prevBtn.classList.toggle('hidden', stepIndex === 0);
        nextBtn.classList.toggle('hidden', step.isManualAction || stepIndex === steps.length - 1);
        doneBtn.classList.toggle('hidden', stepIndex !== steps.length - 1);

        // Si es una acción manual, preparamos el listener
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

        // Ajustar si se sale de la pantalla
        if (left < 10) left = 10;
        if ((left + popoverRect.width) > window.innerWidth) left = window.innerWidth - popoverRect.width - 10;
        if ((top + popoverRect.height) > window.innerHeight) top = targetRect.top - popoverRect.height - 15;

        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;
    }
    
    async function toggleSection(sectionToShowSelector) {
        const allSections = document.querySelectorAll('.form-section');
        const sectionToShow = document.querySelector(sectionToShowSelector);
        
        // Colapsa todas las secciones
        allSections.forEach(sec => sec.classList.add('collapsed'));
        
        // Expande la sección deseada
        if (sectionToShow) {
            await waitForTransition(sectionToShow);
            sectionToShow.classList.remove('collapsed');
            await waitForTransition(sectionToShow);
        }
    }

    function collapseAllSections() {
        document.querySelectorAll('.form-section').forEach(sec => sec.classList.add('collapsed'));
    }

    function waitForTransition(element) {
        return new Promise(resolve => {
            element.addEventListener('transitionend', resolve, { once: true });
        });
    }

    function prepareManualAction(targetElement) {
        targetElement.addEventListener('click', function handleManualClick() {
            currentStep++;
            showStep(currentStep);
            // El tutorial continuará después del clic del usuario
        }, { once: true });
    }

    // --- Event Listeners de los botones del tutorial ---
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
        // Lógica para ir atrás (puede necesitar colapsar/expandir también)
        currentStep--;
        showStep(currentStep);
    });

    doneBtn.addEventListener('click', () => {
        document.getElementById('noteModalOverlay').style.display = 'flex';
        endTour();
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
                // Aquí puedes guardar el nombre del agente si lo necesitas
                // localStorage.setItem('agentName', nameInput.value.trim());
                welcomeModal.style.display = 'none';
                startTour();
            }
        };

        startBtn.addEventListener('click', startHandler);
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                startHandler();
            }
        });
    }

    window.addEventListener('load', checkAndShowWelcomeModal);

})();
