// Se utiliza una IIFE para evitar conflictos.
(function() {

    // --- Elementos del DOM ---
    const overlay = document.getElementById('custom-tutorial-overlay');
    const popover = document.getElementById('custom-tutorial-popover');
    const popoverTitle = document.getElementById('tutorial-popover-title');
    const popoverText = document.getElementById('tutorial-popover-text');
    const prevBtn = document.getElementById('tutorial-prev-btn');
    const nextBtn = document.getElementById('tutorial-next-btn');
    
    let currentStep = 0;
    let highlightedElement = null;

    // --- Definición de los Pasos del Tutorial ---
    const steps = [
        { // 0: Modal de Bienvenida
            element: '#welcomeModalOverlay .modal-content',
            title: '¡Bienvenido a APad!',
            text: 'Para comenzar, por favor ingresa tu nombre de agente en el campo de texto y presiona "START".',
            isModalStep: true // Flag especial para este paso
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
            isManualAction: true
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

        // Limpiar el estado anterior
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }
        document.body.classList.remove('tutorial-modal-active');

        // Configurar el estado actual
        overlay.classList.remove('hidden');
        popover.classList.add('active');
        targetElement.classList.add('tutorial-highlight');
        highlightedElement = targetElement;
        
        // Actualizar contenido y posición del popover
        popoverTitle.textContent = step.title;
        popoverText.textContent = step.text;
        positionPopover(targetElement);

        // Configurar botones
        prevBtn.classList.toggle('hidden', stepIndex === 0);
        nextBtn.classList.toggle('hidden', step.isManualAction || stepIndex === steps.length - 1);
        
        // Lógica específica del paso
        if (step.isModalStep) {
            prepareModalStep(targetElement);
        } else if (step.isManualAction) {
            prepareManualAction(targetElement);
        }
    }

    function endTour() {
        overlay.classList.add('hidden');
        popover.classList.remove('active');
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }
        document.body.classList.remove('tutorial-modal-active');
        localStorage.setItem('tutorialCompleted', 'true');
    }

    // --- Funciones de Ayuda ---
    
    function prepareModalStep(targetElement) {
        // Hacemos que el overlay sea no-interactivo para este paso
        document.body.classList.add('tutorial-modal-active');
        
        const startBtn = document.getElementById('startTakingNotesBtn');
        const nameInput = document.getElementById('welcomeAgentNameInput');
        
        const startHandler = () => {
            if (nameInput.value.trim() !== '') {
                document.getElementById('welcomeModalOverlay').style.display = 'none';
                currentStep++;
                showStep(currentStep);
            }
        };
        
        startBtn.addEventListener('click', startHandler, { once: true });
        nameInput.addEventListener('keydown', function onEnter(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                startBtn.click();
                // El listener se auto-elimina porque el del botón tiene { once: true }
            }
        });
    }

    function prepareManualAction(targetElement) {
        // Para el botón "SEE" u otras acciones manuales
        targetElement.addEventListener('click', endTour, { once: true });
    }

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
    
    function waitForTransition(element, timeout = 500) {
        return new Promise(resolve => {
            const onEnd = () => {
                element.removeEventListener('transitionend', onEnd);
                clearTimeout(timer);
                resolve();
            };
            const timer = setTimeout(onEnd, timeout);
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
        document.querySelectorAll('.form-section').forEach(sec => sec.classList.add('collapsed'));
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
    function checkAndStartTutorial() {
        if (localStorage.getItem('tutorialCompleted') === 'true') {
            return;
        }
        // Muestra el modal de bienvenida y comienza el tour al mismo tiempo
        document.getElementById('welcomeModalOverlay').style.display = 'flex';
        startTour();
    }

    window.addEventListener('load', checkAndStartTutorial);

})();
