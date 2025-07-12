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
        { // 0: Encabezado
            element: '.sticky-header-container',
            title: 'Encabezado Principal',
            text: 'Esta es la barra de acciones principal. Aquí encuentras los botones para ver, guardar y reiniciar tu nota.'
        },
        { // 1: Formulario
            element: '#callNoteForm',
            title: 'Tu Espacio de Trabajo',
            text: 'Este es el formulario principal. Al presionar "Siguiente", la primera sección se expandirá automáticamente.',
            action: () => expandSection('#seccion1')
        },
        { // 2: Sección 1
            element: '#seccion1-wrapper',
            title: 'Información de la Cuenta',
            text: '¡Excelente! Al presionar "Siguiente", esta sección se colapsará y continuaremos con la próxima.',
            action: () => switchSection('#seccion1', '#seccion2')
        },
        { // 3: Sección 2
            element: '#seccion2-wrapper',
            title: 'Detalles del Problema',
            text: 'Ahora se ha expandido la sección de "Detalles del Problema".',
            action: () => switchSection('#seccion2', '#seccion3')
        },
        { // 4: Sección 3
            element: '#seccion3-wrapper',
            title: 'Análisis WiFi y TVS',
            text: 'Esta es la sección de "Análisis WiFi y TVS".',
            action: () => switchSection('#seccion3', '#seccion4')
        },
        { // 5: Sección 4
            element: '#seccion4-wrapper',
            title: 'Resolución de la Llamada',
            text: '¡Has completado la parte interactiva! Haz clic en "Finalizar" para ver la nota completa y terminar el tour.',
            isLastStep: true
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
        
        // Preparar el popover (oculto)
        popover.classList.remove('active');
        overlay.classList.remove('hidden');

        // Limpiar resaltado anterior
        if (highlightedElement) {
            highlightedElement.classList.remove('tutorial-highlight');
        }

        // Actualizar contenido
        popoverTitle.textContent = step.title;
        popoverText.textContent = step.text;

        // Resaltar el nuevo elemento
        targetElement.classList.add('tutorial-highlight');
        highlightedElement = targetElement;
        
        // Posicionar y luego mostrar (LÓGICA CORREGIDA Y ROBUSTA)
        // Usamos un pequeño timeout para asegurar que el navegador haya renderizado el contenido
        // antes de que intentemos medir y posicionar el popover.
        setTimeout(() => {
            positionPopover(targetElement);
            popover.classList.add('active');
        }, 50); // 50ms es suficiente para que el navegador se ponga al día.

        // Configurar botones
        prevBtn.classList.toggle('hidden', stepIndex === 0);
        nextBtn.classList.toggle('hidden', step.isLastStep || stepIndex === steps.length - 1);
        doneBtn.classList.toggle('hidden', !step.isLastStep);
    }

    function endTour() {
        overlay.classList.add('hidden');
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
        document.getElementById('noteModalOverlay').style.display = 'flex';
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
