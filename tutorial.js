// Se utiliza una IIFE para evitar conflictos.
(function() {

    // 1. Al cargar la página, solo revisamos si debemos mostrar el modal.
    function checkAndShowWelcomeModal() {
        if (localStorage.getItem('tutorialCompleted') === 'true') {
            return;
        }
        
        const welcomeModal = document.getElementById('welcomeModalOverlay');
        const startBtn = document.getElementById('startTakingNotesBtn');
        const nameInput = document.getElementById('welcomeAgentNameInput');

        // Mostramos el modal
        welcomeModal.style.display = 'flex';

        // Escuchamos el clic en el botón START
        startBtn.addEventListener('click', () => {
            if (nameInput.value.trim() !== '') {
                // Si el nombre es válido, ocultamos el modal e iniciamos el tour
                welcomeModal.style.display = 'none';
                startTheTour(); // <-- ¡Aquí comienza el tour!
            }
        });
        
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && nameInput.value.trim() !== '') {
                e.preventDefault();
                startBtn.click();
            }
        });
    }

    // 2. Esta función AHORA contiene y ejecuta el tour.
    function startTheTour() {
        const intro = introJs();

        intro.setOptions({
            showProgress: true,
            disableInteraction: true,
            highlightClass: 'custom-intro-highlight',
            tooltipClass: 'custom-intro-tooltip',
            steps: [
                // OJO: El paso 0 (modal) ya no existe aquí.
                {
                    element: document.querySelector('#callNoteForm'),
                    title: 'Tu Espacio de Trabajo',
                    intro: 'Este es el formulario principal. Para continuar, haz clic en "Account Info & Verification".'
                },
                {
                    element: document.querySelector('#seccion1-wrapper'),
                    title: 'Información de la Cuenta',
                    intro: '¡Excelente! Aquí ingresas los datos del cliente. Ahora, haz clic en "Status, Issue and Troubleshoot Steps".'
                },
                {
                    element: document.querySelector('#seccion2-wrapper'),
                    title: 'Detalles del Problema',
                    intro: 'Perfecto. Ahora haz clic en "Advanced Wifi Analytics & TVS".'
                },
                {
                    element: document.querySelector('#seccion3-wrapper'),
                    title: 'Análisis WiFi y TVS',
                    intro: 'Ya casi terminamos. Haz clic en la última sección: "Resolution".'
                },
                {
                    element: document.querySelector('#seccion4-wrapper'),
                    title: 'Resolución de la Llamada',
                    intro: '¡Has completado el tour!',
                    position: 'top'
                }
            ]
        });

        // --- MANEJO DE LA INTERACCIÓN ---
        const setupManualAdvance = (triggerSelector, nextStepIndex) => {
            const trigger = document.querySelector(triggerSelector);
            if (trigger) {
                // Hacemos el botón interactivo
                trigger.classList.add('introjs-showElement');
                trigger.addEventListener('click', () => {
                    setTimeout(() => {
                        intro.goToStep(nextStepIndex);
                    }, 450);
                }, { once: true });
            }
        };

        intro.onbeforechange(function(targetElement) {
            // Los índices de los pasos ahora empiezan desde 0 de nuevo para esta lista
            const currentStepIndex = this._currentStep;

            switch (currentStepIndex) {
                case 0: // En el paso del formulario principal
                    setupManualAdvance('#seccion1 .section-title', 2); // Ve al paso 2 (índice 1)
                    break;
                case 1: // En el paso de la sección 1
                    setupManualAdvance('#seccion2 .section-title', 3); // Ve al paso 3 (índice 2)
                    break;
                case 2: // En el paso de la sección 2
                    setupManualAdvance('#seccion3 .section-title', 4); // Ve al paso 4 (índice 3)
                    break;
                case 3: // En el paso de la sección 3
                    setupManualAdvance('#seccion4 .section-title', 5); // Ve al paso 5 (índice 4)
                    break;
            }
        });

        intro.onexit(function() {
            localStorage.setItem('tutorialCompleted', 'true');
        });

        intro.start();
    }

    // Al cargar la ventana, llamamos a la nueva función inicial.
    window.addEventListener('load', checkAndShowWelcomeModal);

})();
