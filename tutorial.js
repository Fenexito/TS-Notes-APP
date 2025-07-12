// Se utiliza una IIFE para evitar conflictos.
(function() {
    // --- Elementos del DOM ---
    const overlay = document.getElementById('custom-tutorial-overlay');
    const popover = document.getElementById('custom-tutorial-popover');
    const popoverTitle = document.getElementById('tutorial-popover-title');
    const popoverText = document.getElementById('tutorial-popover-text');
    const prevBtn = document.getElementById('tutorial-prev-btn');
    const nextBtn = document.getElementById('tutorial-next-btn');
    const doneBtn = document.getElementById('tutorial-done-btn'); // Aunque no se usa, lo mantenemos por si acaso.
    
    let currentStep = 0;
    let highlightedElement = null;

    // --- Definición de los Pasos del Tutorial (con nueva lógica) ---
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
            onNext: () => expandSection('#seccion1')
        },
        { // 2
            element: '#seccion1-wrapper',
            title: 'Información de la Cuenta',
            text: '¡Excelente! La primera sección se ha expandido. Al presionar "Siguiente", esta se colapsará y continuaremos con la próxima.',
            onNext: () => switchSection('#seccion1', '#seccion2')
        },
        { // 3
            element: '#seccion2-wrapper',
            title: 'Detalles del Problema',
            text: 'Ahora se ha expandido la sección de "Detalles del Problema".',
            onNext: () => switchSection('#seccion2', '#seccion3')
        },
        { // 4
            element: '#seccion3-wrapper',
            title: 'Análisis WiFi y TVS',
            text: 'Esta es la sección de "Análisis WiFi y TVS".',
            onNext: () => switchSection('#seccion3', '#seccion4')
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

        overlay.classList.remove('hidden');
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }

        popoverTitle.textContent = step.title;
        popoverText.textContent = step.text;
        
        requestAnimationFrame(() => {
            positionPopover(targetElement);
            popover.classList.add('active');
        });

        targetElement.classList.add('tutorial-highlight');
        highlightedElement = targetElement;
        
        prevBtn.classList.toggle('hidden', stepIndex === 0);
        nextBtn.classList.toggle('hidden', step.isManualAction || stepIndex === steps.length - 1);
        doneBtn.classList.toggle('hidden', true); // El botón 'Done' no se usa en este flujo

        if (step.isManualAction) {
            prepareManualAction(targetElement);
        }
    }

    function endTour() {
        overlay.classList.add('hidden');
        popover.classList.remove('active');
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }
        localStorage.setItem('tutorialCompleted', 'true');
    }

    // --- Funciones de Ayuda para Animaciones ---

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
        if (sectionToCollapse) {
            sectionToCollapse.classList.add('collapsed');
        }
        if (sectionToExpand) {
            sectionToExpand.classList.remove('collapsed');
        }
        // Esperamos a que la animación de colapsar termine, que suele ser suficiente.
        if (sectionToCollapse) {
            await waitForTransition(sectionToCollapse);
        }
    }
    
    async function collapseAllSections() {
        const sections = document.querySelectorAll('.form-section:not(.collapsed)');
        if (sections.length > 0) {
            sections.forEach(sec => sec.classList.add('collapsed'));
            // Esperamos a que la última sección termine su animación
            await waitForTransition(sections[sections.length - 1]);
        }
    }

    function prepareManualAction(targetElement) {
        // Esta función hace que el elemento resaltado sea interactivo y espere un clic.
        targetElement.addEventListener('click', () => {
            // La lógica de la app se encarga de abrir el modal.
            // El tour simplemente termina.
            endTour();
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
        // La lógica para ir hacia atrás podría ser más compleja si se quiere revertir la animación.
        // Por ahora, simplemente muestra el paso anterior.
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
            if (e.key === 'Enter' && nameInput.value.trim() !== '') {
                e.preventDefault();
                startHandler();
            }
        });
    }

    window.addEventListener('load', checkAndShowWelcomeModal);

})();
