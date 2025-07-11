// Se utiliza una IIFE para evitar conflictos.
(function() {

    function checkAndStartTutorial() {
        if (localStorage.getItem('tutorialCompleted') === 'true') {
            return;
        }
        // Esperamos un poco para asegurarnos de que toda la app esté lista
        setTimeout(startApplicationTour, 500);
    }

    function startApplicationTour() {
        const intro = introJs();

        intro.setOptions({
            showProgress: true,
            disableInteraction: true, // Bloquea la interacción excepto en el elemento resaltado
            highlightClass: 'custom-intro-highlight', // Clase CSS personalizada si la necesitas
            tooltipClass: 'custom-intro-tooltip', // Clase CSS personalizada
            steps: [
                {
                    element: document.querySelector('#welcomeModalOverlay .modal-content'),
                    title: '¡Bienvenido!',
                    intro: 'Por favor, ingresa tu nombre de agente en el campo de texto y presiona "START" para comenzar.',
                    position: 'top'
                },
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

        // Función para avanzar cuando se hace clic en un título de sección
        const setupManualAdvance = (triggerSelector, nextStepIndex) => {
            const trigger = document.querySelector(triggerSelector);
            if (trigger) {
                // Habilitamos la interacción solo con este botón
                trigger.classList.add('introjs-showElement');
                trigger.addEventListener('click', () => {
                    // Esperamos que la animación termine antes de ir al siguiente paso
                    setTimeout(() => {
                        intro.goToStep(nextStepIndex);
                    }, 450);
                }, { once: true });
            }
        };

        // Escuchamos los cambios de paso para configurar el siguiente clic
        intro.onbeforechange(function(targetElement) {
            const currentStep = this._currentStep;

            switch (currentStep) {
                case 0: // Antes de mostrar el paso del modal de bienvenida
                    document.getElementById('welcomeModalOverlay').style.display = 'flex';
                    const startBtn = document.getElementById('startTakingNotesBtn');
                    startBtn.addEventListener('click', () => {
                        if (document.getElementById('welcomeAgentNameInput').value.trim() !== '') {
                            document.getElementById('welcomeModalOverlay').style.display = 'none';
                            intro.nextStep();
                        }
                    }, { once: true });
                    break;
                case 1: // En el paso 2 (formulario principal)
                    setupManualAdvance('#seccion1 .section-title', 3); // Ve al paso 3 (índice 2)
                    break;
                case 2: // En el paso 3 (sección 1)
                    setupManualAdvance('#seccion2 .section-title', 4); // Ve al paso 4 (índice 3)
                    break;
                case 3: // En el paso 4 (sección 2)
                    setupManualAdvance('#seccion3 .section-title', 5); // Ve al paso 5 (índice 4)
                    break;
                case 4: // En el paso 5 (sección 3)
                    setupManualAdvance('#seccion4 .section-title', 6); // Ve al paso 6 (índice 5)
                    break;
            }
        });

        // Al finalizar o salir del tour
        intro.onexit(function() {
            localStorage.setItem('tutorialCompleted', 'true');
        });

        intro.start();
    }

    window.addEventListener('load', checkAndStartTutorial);

})();
