// Se utiliza una IIFE para evitar conflictos.
(function() {
    // --- Configuración del Tutorial ---
    const steps = [
        {
            element: '.sticky-header-container',
            title: 'Encabezado Principal',
            text: 'Esta es la barra de acciones principal. Aquí encuentras los botones para ver, guardar y reiniciar tu nota.'
        },
        {
            element: '#callNoteForm',
            title: 'Tu Espacio de Trabajo',
            text: 'Este es el formulario principal. Al presionar "Siguiente", la primera sección se expandirá automáticamente.',
            action: () => expandSection('#seccion1 .section-title', '#seccion1')
        },
        {
            element: '#seccion1-wrapper',
            title: 'Información de la Cuenta',
            text: '¡Excelente! La primera sección se ha expandido. Al presionar "Siguiente", continuaremos con la próxima.',
            action: () => colapseSection('#seccion1 .section-title', '#seccion1')
            action: () => expandSection('#seccion2 .section-title', '#seccion2')
        },
        {
            element: '#seccion2-wrapper',
            title: 'Detalles del Problema',
            text: 'Ahora se ha expandido la sección de "Detalles del Problema".',
            action: () => expandSection('#seccion3 .section-title', '#seccion3')
        },
        {
            element: '#seccion3-wrapper',
            title: 'Análisis WiFi y TVS',
            text: 'Esta es la sección de "Análisis WiFi y TVS".',
            action: () => expandSection('#seccion4 .section-title', '#seccion4')
        },
        {
            element: '#seccion4-wrapper',
            title: 'Resolución de la Llamada',
            text: '¡Has completado la parte interactiva! Haz clic en "Finalizar" para ver la nota completa y terminar el tour.'
        }
    ];

    let currentStep = -1;
    const overlay = document.getElementById('custom-tutorial-overlay');
    const popover = document.getElementById('custom-tutorial-popover');
    const popoverTitle = document.getElementById('tutorial-popover-title');
    const popoverText = document.getElementById('tutorial-popover-text');
    const prevBtn = document.getElementById('tutorial-prev-btn');
    const nextBtn = document.getElementById('tutorial-next-btn');
    const doneBtn = document.getElementById('tutorial-done-btn');

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
        document.querySelector('.tutorial-highlight')?.classList.remove('tutorial-highlight');
        
        // Actualizar contenido del popover
        popoverTitle.textContent = step.title;
        popoverText.textContent = step.text;

        // Mostrar overlay y popover
        overlay.classList.remove('hidden');
        popover.classList.remove('hidden');

        // Resaltar el nuevo elemento
        targetElement.classList.add('tutorial-highlight');
        
        // Posicionar el popover
        const targetRect = targetElement.getBoundingClientRect();
        popover.style.top = `${targetRect.bottom + 10}px`;
        popover.style.left = `${targetRect.left}px`;
        
        // Ajustar si se sale de la pantalla
        if (targetRect.left + popover.offsetWidth > window.innerWidth) {
            popover.style.left = `${window.innerWidth - popover.offsetWidth - 20}px`;
        }
        if (targetRect.bottom + popover.offsetHeight > window.innerHeight) {
            popover.style.top = `${targetRect.top - popover.offsetHeight - 10}px`;
        }

        // Configurar botones
        prevBtn.classList.toggle('hidden', stepIndex === 0);
        nextBtn.classList.toggle('hidden', stepIndex === steps.length - 1);
        doneBtn.classList.toggle('hidden', stepIndex !== steps.length - 1);
    }

    function endTour() {
        overlay.classList.add('hidden');
        popover.classList.add('hidden');
        document.querySelector('.tutorial-highlight')?.classList.remove('tutorial-highlight');
        localStorage.setItem('tutorialCompleted', 'true');
    }

    function expandSection(triggerSelector, animatedElementSelector) {
        return new Promise(resolve => {
            const trigger = document.querySelector(triggerSelector);
            const animated = document.querySelector(animatedElementSelector);
            if (trigger && animated) {
                animated.addEventListener('transitionend', resolve, { once: true });
                trigger.click();
            } else {
                resolve(); // Resuelve la promesa inmediatamente si no se encuentra el elemento
            }
        });
    }
    
    // --- Event Listeners de los botones del tutorial ---
    nextBtn.addEventListener('click', async () => {
        const step = steps[currentStep];
        if (step.action) {
            // Si el paso tiene una acción (expandir), la ejecuta y espera
            nextBtn.disabled = true; // Deshabilita el botón mientras se anima
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
        startBtn.addEventListener('click', () => {
            if (nameInput.value.trim() !== '') {
                welcomeModal.style.display = 'none';
                startTour();
            }
        });
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && nameInput.value.trim() !== '') {
                e.preventDefault();
                startBtn.click();
            }
        });
    }

    window.addEventListener('load', checkAndShowWelcomeModal);
})();
