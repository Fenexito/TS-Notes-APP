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
            {
                element: document.querySelector('.sticky-header-container'),
                title: 'Encabezado Principal',
                intro: 'Esta es la barra de acciones principal. Aquí encuentras los botones para ver, guardar y reiniciar tu nota.',
                position: 'bottom'
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
            // --- PASO FINAL (MODIFICADO) ---
            {
                element: document.querySelector('#seccion4-wrapper'),
                title: 'Resolución de la Llamada',
                intro: '¡Has completado la parte interactiva! Haz clic en "Finalizar" para ver la nota completa y terminar el tour.',
                position: 'top'
            }
        ]
    });

    // --- MANEJO DE LA INTERACCIÓN (SIMPLIFICADO) ---
    const setupManualAdvance = (triggerSelector, nextStepIndex) => {
        const trigger = document.querySelector(triggerSelector);
        if (trigger) {
            trigger.classList.add('introjs-showElement');
            trigger.addEventListener('click', () => {
                setTimeout(() => {
                    intro.goToStep(nextStepIndex);
                }, 450);
            }, { once: true });
        }
    };

    intro.onbeforechange(function(targetElement) {
        const currentStepIndex = this._currentStep;

        switch (currentStepIndex) {
            case 1: // En el paso del formulario principal
                setupManualAdvance('#seccion1 .section-title', 3);
                break;
            case 2: // En el paso de la sección 1
                setupManualAdvance('#seccion2 .section-title', 4);
                break;
            case 3: // En el paso de la sección 2
                setupManualAdvance('#seccion3 .section-title', 5);
                break;
            case 4: // En el paso de la sección 3
                setupManualAdvance('#seccion4 .section-title', 6);
                break;
        }
    });

    // Se dispara al hacer clic en el último botón "Done" (o "Finalizar")
    intro.oncomplete(function() {
        // Abre el modal de la nota final
        document.getElementById('noteModalOverlay').style.display = 'flex';
        // Marca el tutorial como completado
        localStorage.setItem('tutorialCompleted', 'true');
    });

    // Se dispara si el usuario cierra el tour antes de tiempo
    intro.onexit(function() {
        localStorage.setItem('tutorialCompleted', 'true');
    });

    intro.start();
}
    // Al cargar la ventana, llamamos a la nueva función inicial.
    window.addEventListener('load', checkAndShowWelcomeModal);

})();
