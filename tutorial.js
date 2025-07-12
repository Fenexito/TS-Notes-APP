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

    /**
     * Esta es la nueva función de acción. Es la forma más robusta de sincronizar el tour
     * con animaciones de CSS.
     * @param {string} clickTriggerSelector - El selector del título de la sección en el que hay que hacer clic.
     * @param {string} animatedElementSelector - El selector de la sección que se expande y se anima.
     */
    const createExpansionAction = (clickTriggerSelector, animatedElementSelector) => {
        return function() {
            // 'this' se refiere a la instancia del tour (intro)
            const tourInstance = this;

            const triggerElement = document.querySelector(clickTriggerSelector);
            const animatedElement = document.querySelector(animatedElementSelector);

            if (triggerElement && animatedElement) {
                // 1. Añadimos un listener que se disparará UNA SOLA VEZ cuando la animación termine.
                animatedElement.addEventListener('transitionend', function onAnimationEnd() {
                    // 3. Cuando la animación termina, avanzamos al siguiente paso.
                    tourInstance.nextStep();
                }, { once: true }); // {once: true} es crucial, asegura que el listener se elimine solo.

                // 2. Simulamos el clic para iniciar la animación de expansión.
                triggerElement.click();
            } else {
                // Fallback por si algo falla: avanzar después de un tiempo prudencial.
                console.error("No se encontró el trigger o el elemento animado.");
                setTimeout(() => tourInstance.nextStep(), 500);
            }
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
                intro: 'Esta es la barra de acciones principal...',
                position: 'bottom'
            },
            {
                element: document.querySelector('#callNoteForm'),
                title: 'Tu Espacio de Trabajo',
                intro: 'Este es el formulario principal. Al presionar "Siguiente", la primera sección se expandirá automáticamente.',
                buttons: [
                    { text: 'Anterior', action: function() { this.previousStep(); } },
                    { text: 'Siguiente', action: createExpansionAction('#seccion1 .section-title', '#seccion1') }
                ]
            },
            {
                element: document.querySelector('#seccion1-wrapper'),
                title: 'Información de la Cuenta',
                intro: '¡Excelente! La primera sección se ha expandido. Al presionar "Siguiente", continuaremos con la próxima.',
                buttons: [
                    { text: 'Anterior', action: function() { this.previousStep(); } },
                    { text: 'Siguiente', action: createExpansionAction('#seccion2 .section-title', '#seccion2') }
                ]
            },
            {
                element: document.querySelector('#seccion2-wrapper'),
                title: 'Detalles del Problema',
                intro: 'Ahora se ha expandido la sección de "Detalles del Problema".',
                buttons: [
                    { text: 'Anterior', action: function() { this.previousStep(); } },
                    { text: 'Siguiente', action: createExpansionAction('#seccion3 .section-title', '#seccion3') }
                ]
            },
            {
                element: document.querySelector('#seccion3-wrapper'),
                title: 'Análisis WiFi y TVS',
                intro: 'Esta es la sección de "Análisis WiFi y TVS".',
                buttons: [
                    { text: 'Anterior', action: function() { this.previousStep(); } },
                    { text: 'Siguiente', action: createExpansionAction('#seccion4 .section-title', '#seccion4') }
                ]
            },
            {
                element: document.querySelector('#seccion4-wrapper'),
                title: 'Resolución de la Llamada',
                intro: '¡Has completado la parte interactiva! Haz clic en "Finalizar" para ver la nota completa y terminar el tour.',
                position: 'top'
            }
        ]
    });

    intro.oncomplete(function() {
        document.getElementById('noteModalOverlay').style.display = 'flex';
        localStorage.setItem('tutorialCompleted', 'true');
    });

    intro.onexit(function() {
        localStorage.setItem('tutorialCompleted', 'true');
    });

    intro.start();
}
    // Al cargar la ventana, llamamos a la nueva función inicial.
    window.addEventListener('load', checkAndShowWelcomeModal);

})();
