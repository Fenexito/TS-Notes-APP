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
        secondary: {
            text: 'Salir',
            action: function() {
                localStorage.setItem('tutorialCompleted', 'true');
                this.cancel();
            }
        }
    };

    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            cancelIcon: { enabled: true },
            classes: 'custom-shepherd-theme',
            buttons: defaultButtons
        }
    });

    // --- PASO 1: MODAL DE BIENVENIDA (Sin cambios) ---
    tour.addStep({
        id: 'step1-welcome',
        title: '¡Bienvenido!',
        text: 'Por favor, ingresa tu nombre de agente en el campo de texto y presiona "START" o la tecla "Enter" para comenzar.',
        attachTo: { element: '#welcomeModalOverlay .modal-content', on: 'top' },
        canClickTarget: true,
        beforeShowPromise: function() {
            return new Promise(function(resolve) {
                document.getElementById('welcomeModalOverlay').style.display = 'flex';
                resolve();
            });
        },
        when: {
            'before-hide': () => {
                const nameInput = document.getElementById('welcomeAgentNameInput');
                if (!nameInput || nameInput.value.trim() === '') return false;
                document.getElementById('welcomeModalOverlay').style.display = 'none';
            }
        },
        buttons: []
    });
    
    // Listeners para avanzar desde el modal (Sin cambios)
    const startBtn = document.getElementById('startTakingNotesBtn');
    const nameInput = document.getElementById('welcomeAgentNameInput');
    const advanceFromModal = () => { if (nameInput.value.trim() !== '') tour.next(); };
    startBtn.addEventListener('click', advanceFromModal);
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); advanceFromModal(); }});

    // --- PASO 2: INTRODUCCIÓN AL FORMULARIO ---
    tour.addStep({
        id: 'step2-form-intro',
        title: 'Tu Espacio de Trabajo',
        text: 'Este es el formulario principal. Para continuar, haz clic en el título "Account Info & Verification" para expandir la primera sección.',
        attachTo: { element: '#callNoteForm', on: 'top' },
        // SE ELIMINÓ 'advanceOn'
    });
    
    // --- PASO 3: SECCIÓN 1 ---
    tour.addStep({
        id: 'step3-section1',
        title: 'Información de la Cuenta',
        text: '¡Excelente! Aquí ingresas los datos del cliente. Ahora, haz clic en el título de la siguiente sección: "Status, Issue and Troubleshoot Steps".',
        attachTo: { element: '#seccion1', on: 'bottom' },
        // SE ELIMINÓ 'advanceOn'
    });

    // --- PASO 4: SECCIÓN 2 ---
    tour.addStep({
        id: 'step4-section2',
        title: 'Detalles del Problema',
        text: 'Esta es la sección más importante. Documenta el problema y los pasos realizados. Para continuar, haz clic en "Advanced Wifi Analytics & TVS".',
        attachTo: { element: '#seccion2', on: 'bottom' },
        // SE ELIMINÓ 'advanceOn'
    });

    // --- PASO 5: SECCIÓN 3 ---
    tour.addStep({
        id: 'step5-section3',
        title: 'Análisis WiFi y TVS',
        text: 'Aquí registras datos de AWA y TVS. Ya casi terminamos. Haz clic en la última sección: "Resolution".',
        attachTo: { element: '#seccion3', on: 'bottom' },
        // SE ELIMINÓ 'advanceOn'
    });

    // --- PASO 6: SECCIÓN 4 Y FINAL (Sin cambios) ---
    tour.addStep({
        id: 'step6-section4',
        title: 'Resolución de la Llamada',
        text: 'Finalmente, documenta el resultado de la interacción. ¡Has completado el tour!',
        attachTo: { element: '#seccion4', on: 'top' },
        buttons: [{ text: 'Finalizar', action: tour.complete }]
    });
    
    // Cuando el tour se complete satisfactoriamente (Sin cambios)
    tour.on('complete', () => localStorage.setItem('tutorialCompleted', 'true'));

    // ===================================================================
    // MANEJO MANUAL DEL AVANCE CON RETRASO
    // ===================================================================

    const setupManualAdvance = (triggerSelector, currentStepId) => {
        const triggerElement = document.querySelector(triggerSelector);
        if (triggerElement) {
            triggerElement.addEventListener('click', () => {
                // Solo avanza si estamos en el paso correcto del tour
                if (tour.isActive() && tour.currentStep.id === currentStepId) {
                    // Espera 350ms para que la animación termine
                    setTimeout(() => {
                        tour.next();
                    }, 350);
                }
            });
        }
    };

    // Configura el avance para cada paso
    setupManualAdvance('#seccion1 .section-title', 'step2-form-intro');
    setupManualAdvance('#seccion2 .section-title', 'step3-section1');
    setupManualAdvance('#seccion3 .section-title', 'step4-section2');
    setupManualAdvance('#seccion4 .section-title', 'step5-section3');


    tour.start();
}

    window.addEventListener('load', checkAndStartTutorial);

})();
