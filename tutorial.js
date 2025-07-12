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

    // Función reutilizable para el botón "Siguiente" personalizado
    const createNextButtonAction = (triggerSelector) => {
        return function() {
            // 1. Simula un clic en el título para expandir la sección
            const trigger = document.querySelector(triggerSelector);
            if (trigger) {
                trigger.click();
            }
            
            // 2. Espera a que la animación termine
            setTimeout(() => {
                // 3. Avanza al siguiente paso del tour
                this.nextStep();
            }, 450); // Ajusta este tiempo si es necesario
        };
    };

    intro.setOptions({
        showProgress: true,
        disableInteraction: true,
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
                intro: 'Este es el formulario principal. Al presionar "Siguiente", la primera sección se expandirá automáticamente.',
                buttons: [
                    {
                        text: 'Anterior',
                        action: function() { this.previousStep(); }
                    },
                    {
                        text: 'Siguiente',
                        action: createNextButtonAction('#seccion1 .section-title')
                    }
                ]
            },
            {
                element: document.querySelector('#seccion1-wrapper'),
                title: 'Información de la Cuenta',
                intro: '¡Excelente! La primera sección se ha expandido. Al presionar "Siguiente", continuaremos con la próxima.',
                buttons: [
                    {
                        text: 'Anterior',
                        action: function() { this.previousStep(); }
                    },
                    {
                        text: 'Siguiente',
                        action: createNextButtonAction('#seccion2 .section-title')
                    }
                ]
            },
            {
                element: document.querySelector('#seccion2-wrapper'),
                title: 'Detalles del Problema',
                intro: 'Ahora se ha expandido la sección de "Detalles del Problema".',
                buttons: [
                    {
                        text: 'Anterior',
                        action: function() { this.previousStep(); }
                    },
                    {
                        text: 'Siguiente',
                        action: createNextButtonAction('#seccion3 .section-title')
                    }
                ]
            },
            {
                element: document.querySelector('#seccion3-wrapper'),
                title: 'Análisis WiFi y TVS',
                intro: 'Esta es la sección de "Análisis WiFi y TVS".',
                buttons: [
                    {
                        text: 'Anterior',
                        action: function() { this.previousStep(); }
                    },
                    {
                        text: 'Siguiente',
                        action: createNextButtonAction('#seccion4 .section-title')
                    }
                ]
            },
            {
                element: document.querySelector('#seccion4-wrapper'),
                title: 'Resolución de la Llamada',
                intro: '¡Has completado la parte interactiva! Haz clic en "Finalizar" para ver la nota completa y terminar el tour.',
                position: 'top'
                // Este último paso usará el botón "Hecho" por defecto.
            }
        ]
    });

    // Se dispara al hacer clic en el último botón "Done" (o "Finalizar")
    intro.oncomplete(function() {
        document.getElementById('noteModalOverlay').style.display = 'flex';
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
