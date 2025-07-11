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
            buttons: defaultButtons.buttons
        }
    });

    // --- PASO 1: MODAL DE BIENVENIDA ---
    tour.addStep({
        id: 'step1-welcome',
        /* ... tu configuración no cambia ... */
        title: '¡Bienvenido!',
        text: 'Por favor, ingresa tu nombre de agente...',
        attachTo: { element: '#welcomeModalOverlay .modal-content', on: 'top' },
        canClickTarget: true,
        buttons: [],
        beforeShowPromise: function() { return new Promise(function(resolve) { document.getElementById('welcomeModalOverlay').style.display = 'flex'; resolve(); }); },
        when: { 'before-hide': () => { const nameInput = document.getElementById('welcomeAgentNameInput'); if (!nameInput || nameInput.value.trim() === '') return false; document.getElementById('welcomeModalOverlay').style.display = 'none'; }}
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
        when: {
            show: () => {
                document.querySelector('#seccion1 .section-title').addEventListener('click', () => {
                    tour.currentStep.hide(); // 1. Oculta el popover actual
                    setTimeout(() => {
                        tour.show('step3-section1'); // 3. Muestra el siguiente paso por ID
                    }, 450); // 2. Espera la animación
                }, { once: true });
            }
        }
    });

    // En el Paso 3 del tour
    tour.addStep({
        id: 'step3-section1',
        title: 'Información de la Cuenta',
        text: '¡Excelente! Aquí ingresas los datos del cliente...',
        // 👇 CAMBIO CLAVE: Apunta al contenedor estático
        attachTo: { element: '#seccion1-wrapper', on: 'bottom' },
        when: {
            show: () => {
                document.querySelector('#seccion2 .section-title').addEventListener('click', () => {
                    tour.currentStep.hide();
                    setTimeout(() => {
                        tour.show('step4-section2');
                    }, 450);
                }, { once: true });
            }
        }
    });

    // --- PASO 4: SECCIÓN 2 ---
    tour.addStep({
        id: 'step4-section2',
        title: 'Detalles del Problema',
        text: 'Perfecto. Ahora haz clic en "Advanced Wifi Analytics & TVS".',
        attachTo: { element: '#seccion2', on: 'bottom' },
        when: {
            show: () => {
                document.querySelector('#seccion3 .section-title').addEventListener('click', () => {
                    tour.currentStep.hide();
                    setTimeout(() => {
                        tour.show('step5-section3');
                    }, 450);
                }, { once: true });
            }
        }
    });

    // --- PASO 5: SECCIÓN 3 ---
    tour.addStep({
        id: 'step5-section3',
        title: 'Análisis WiFi y TVS',
        text: 'Ya casi terminamos. Haz clic en la última sección: "Resolution".',
        attachTo: { element: '#seccion3', on: 'bottom' },
        when: {
            show: () => {
                document.querySelector('#seccion4 .section-title').addEventListener('click', () => {
                    tour.currentStep.hide();
                    setTimeout(() => {
                        tour.show('step6-section4');
                    }, 450);
                }, { once: true });
            }
        }
    });

    // --- PASO 6: SECCIÓN 4 Y FINAL ---
    tour.addStep({
        id: 'step6-section4',
        title: 'Resolución de la Llamada',
        text: '¡Has completado el tour!',
        attachTo: { element: '#seccion4', on: 'top' },
        buttons: [{ text: 'Finalizar', action: tour.complete }]
    });
    
    tour.on('complete', () => localStorage.setItem('tutorialCompleted', 'true'));
    tour.start();
}
    window.addEventListener('load', checkAndStartTutorial);

})();
