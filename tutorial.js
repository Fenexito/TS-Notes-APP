// Se utiliza una IIFE (Immediately Invoked Function Expression) para evitar conflictos.
(function() {
    /**
     * Revisa si el tutorial ya fue completado. Si no, lo inicia.
     */
    function checkAndStartTutorial() {
        if (localStorage.getItem('tutorialCompleted') === 'false') {
            return;
        }
        startApplicationTour();
    }

    /**
 * Función principal que inicia y controla el flujo del tour con Shepherd.js.
 */
function startApplicationTour() {
    const defaultButtons = {
        secondary: { text: 'Salir', action: function() { localStorage.setItem('tutorialCompleted', 'true'); this.cancel(); } }
    };

    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            cancelIcon: { enabled: true },
            classes: 'custom-shepherd-theme',
            buttons: defaultButtons
        }
    });

    // --- PASO 1: MODAL DE BIENVENIDA ---
    // (Sin cambios)
    tour.addStep({
        id: 'step1-welcome',
        title: '¡Bienvenido!',
        text: 'Por favor, ingresa tu nombre de agente...',
        attachTo: { element: '#welcomeModalOverlay .modal-content', on: 'top' },
        canClickTarget: true,
        buttons: [],
        beforeShowPromise: function() { /* ... */ },
        when: { 'before-hide': () => { /* ... */ } }
    });
    const startBtn = document.getElementById('startTakingNotesBtn'), nameInput = document.getElementById('welcomeAgentNameInput');
    const advanceFromModal = () => { if (nameInput.value.trim() !== '') tour.next(); };
    startBtn.addEventListener('click', advanceFromModal);
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); advanceFromModal(); } });

    // --- PASO 2: INTRODUCCIÓN AL FORMULARIO ---
    tour.addStep({
        id: 'step2-form-intro',
        title: 'Tu Espacio de Trabajo',
        text: 'Este es el formulario principal. Para continuar, haz clic en "Account Info & Verification".',
        attachTo: { element: '#callNoteForm', on: 'top' },
        buttons: defaultButtons.buttons,
        when: {
            show: () => {
                // Cuando se muestre este paso, escucha un clic en el siguiente disparador
                document.querySelector('#seccion1 .section-title').addEventListener('click', () => {
                    setTimeout(() => tour.next(), 400);
                }, { once: true }); // { once: true } asegura que el listener se dispare solo una vez
            }
        }
    });

    // --- PASO 3: SECCIÓN 1 ---
    tour.addStep({
        id: 'step3-section1',
        title: 'Información de la Cuenta',
        text: '¡Excelente! Ahora, haz clic en "Status, Issue and Troubleshoot Steps".',
        attachTo: { element: '#seccion1', on: 'bottom' }, // Resalta la sección completa
        buttons: defaultButtons.buttons,
        when: {
            show: () => {
                document.querySelector('#seccion2 .section-title').addEventListener('click', () => {
                    setTimeout(() => tour.next(), 400);
                }, { once: true });
            }
        }
    });

    // --- PASO 4: SECCIÓN 2 ---
    tour.addStep({
        id: 'step4-section2',
        title: 'Detalles del Problema',
        text: 'Perfecto. Ahora haz clic en "Advanced Wifi Analytics & TVS".',
        attachTo: { element: '#seccion2', on: 'bottom' }, // Resalta la sección completa
        buttons: defaultButtons.buttons,
        when: {
            show: () => {
                document.querySelector('#seccion3 .section-title').addEventListener('click', () => {
                    setTimeout(() => tour.next(), 400);
                }, { once: true });
            }
        }
    });

    // --- PASO 5: SECCIÓN 3 ---
    tour.addStep({
        id: 'step5-section3',
        title: 'Análisis WiFi y TVS',
        text: 'Ya casi terminamos. Haz clic en la última sección: "Resolution".',
        attachTo: { element: '#seccion3', on: 'bottom' }, // Resalta la sección completa
        buttons: defaultButtons.buttons,
        when: {
            show: () => {
                document.querySelector('#seccion4 .section-title').addEventListener('click', () => {
                    setTimeout(() => tour.next(), 400);
                }, { once: true });
            }
        }
    });

    // --- PASO 6: SECCIÓN 4 Y FINAL ---
    tour.addStep({
        id: 'step6-section4',
        title: 'Resolución de la Llamada',
        text: '¡Has completado el tour!',
        attachTo: { element: '#seccion4', on: 'top' }, // Resalta la sección completa
        buttons: [{ text: 'Finalizar', action: tour.complete }]
    });
    
    tour.on('complete', () => localStorage.setItem('tutorialCompleted', 'true'));
    tour.start();
}
    window.addEventListener('load', checkAndStartTutorial);

})();
