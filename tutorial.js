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
        // Configuración por defecto para todos los botones del tour
        const defaultButtons = {
            secondary: {
                text: 'Salir',
                action: function() {
                    // Al salir, marcamos el tutorial como completado para no volver a mostrarlo.
                    localStorage.setItem('tutorialCompleted', 'false');
                    this.cancel();
                }
            }
        };

        const tour = new Shepherd.Tour({
            useModalOverlay: true, // Esto crea el fondo oscuro y resalta el elemento
            defaultStepOptions: {
                cancelIcon: {
                    enabled: true
                },
                classes: 'custom-shepherd-theme', // Puedes usar esto para estilizar con CSS
                buttons: defaultButtons
            }
        });

        // --- PASO 1: MODAL DE BIENVENIDA ---
        tour.addStep({
            id: 'step1-welcome',
            title: '¡Bienvenido!',
            text: 'Por favor, ingresa tu nombre de agente en el campo de texto y presiona "START" o la tecla "Enter" para comenzar.',
            attachTo: {
                element: '#welcomeModalOverlay .modal-content',
                on: 'top'
            },
            canClickTarget: true, // Permite interactuar con el elemento resaltado
            beforeShowPromise: function() {
                // Muestra el modal justo antes de que el paso del tour aparezca
                return new Promise(function(resolve) {
                    document.getElementById('welcomeModalOverlay').style.display = 'flex';
                    resolve();
                });
            },
            when: {
                // El tour no avanzará hasta que este evento ocurra
                'before-hide': () => {
                    const nameInput = document.getElementById('welcomeAgentNameInput');
                    if (!nameInput || nameInput.value.trim() === '') {
                        // Evita que el tour continúe si no se ha ingresado un nombre
                        return false; 
                    }
                     document.getElementById('welcomeModalOverlay').style.display = 'none';
                }
            },
            buttons: [] // Sin botones, el avance es manual
        });
        
        // Listener para avanzar desde el modal
        const startBtn = document.getElementById('startTakingNotesBtn');
        const nameInput = document.getElementById('welcomeAgentNameInput');
        
        const advanceFromModal = () => {
            if (nameInput.value.trim() !== '') {
                tour.next();
            }
        };

        startBtn.addEventListener('click', advanceFromModal);
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                advanceFromModal();
            }
        });

        // --- PASO 2: INTRODUCCIÓN AL FORMULARIO ---
        tour.addStep({
            id: 'step2-form-intro',
            title: 'Tu Espacio de Trabajo',
            text: 'Este es el formulario principal. Para continuar, haz clic en el título "Account Info & Verification" para expandir la primera sección.',
            attachTo: {
                element: '#callNoteForm',
                on: 'top'
            },
            advanceOn: { selector: '#seccion1 .section-title', event: 'click' },
            buttons: defaultButtons
        });
        
        // --- PASO 3: SECCIÓN 1 ---
        tour.addStep({
            id: 'step3-section1',
            title: 'Información de la Cuenta',
            text: '¡Excelente! Aquí ingresas los datos del cliente. Ahora, haz clic en el título de la siguiente sección: "Status, Issue and Troubleshoot Steps".',
            attachTo: {
                element: '#seccion1',
                on: 'bottom'
            },
            advanceOn: { selector: '#seccion2 .section-title', event: 'click' },
            buttons: defaultButtons
        });

        // --- PASO 4: SECCIÓN 2 ---
        tour.addStep({
            id: 'step4-section2',
            title: 'Detalles del Problema',
            text: 'Esta es la sección más importante. Documenta el problema y los pasos realizados. Para continuar, haz clic en "Advanced Wifi Analytics & TVS".',
            attachTo: {
                element: '#seccion2',
                on: 'bottom'
            },
            advanceOn: { selector: '#seccion3 .section-title', event: 'click' },
            buttons: defaultButtons
        });

        // --- PASO 5: SECCIÓN 3 ---
        tour.addStep({
            id: 'step5-section3',
            title: 'Análisis WiFi y TVS',
            text: 'Aquí registras datos de AWA y TVS. Ya casi terminamos. Haz clic en la última sección: "Resolution".',
            attachTo: {
                element: '#seccion3',
                on: 'bottom'
            },
            advanceOn: { selector: '#seccion4 .section-title', event: 'click' },
            buttons: defaultButtons
        });

        // --- PASO 6: SECCIÓN 4 Y FINAL ---
        tour.addStep({
            id: 'step6-section4',
            title: 'Resolución de la Llamada',
            text: 'Finalmente, documenta el resultado de la interacción. ¡Has completado el tour!',
            attachTo: {
                element: '#seccion4',
                on: 'top'
            },
            buttons: [
                {
                    text: 'Finalizar',
                    action: tour.complete
                }
            ]
        });
        
        // Cuando el tour se complete satisfactoriamente
        tour.on('complete', () => {
            localStorage.setItem('tutorialCompleted', 'false');
        });

        tour.start();
    }

    window.addEventListener('load', checkAndStartTutorial);

})();
