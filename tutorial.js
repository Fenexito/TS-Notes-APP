// Se utiliza una IIFE (Immediately Invoked Function Expression) para evitar conflictos con otras variables globales.
(function() {
    // Se define el objeto driver en un alcance más amplio para que sea accesible por todas las funciones del tour.
    let driver;
    const TUTORIAL_STYLE_ID = 'driver-tutorial-fix'; // ID para nuestro estilo CSS temporal

    /**
     * Revisa si el tutorial ya fue completado. Si no, lo inicia.
     */
    function checkAndStartTutorial() {
        if (localStorage.getItem('tutorialCompleted') === 'true') {
            return;
        }
        startApplicationTour();
    }

    /**
     * Función principal que inicia y controla el flujo del tour.
     */
    function startApplicationTour() {
        driver = new Driver({
            className: 'custom-driver-theme',
            animate: true,
            opacity: 0.75,
            padding: 10,
            allowClose: false,
            doneBtnText: 'Finalizar',
        });
        
        runStep1_WelcomeModal();
    }

    /**
     * PASO 1: Enfocado en el modal de bienvenida.
     */
    function runStep1_WelcomeModal() {
        // Elementos de la UI
        const welcomeModal = document.getElementById('welcomeModalOverlay');
        const nameInput = document.getElementById('welcomeAgentNameInput');
        const startBtn = document.getElementById('startTakingNotesBtn');

        // FIX: Inyecta un estilo CSS para hacer el *escenario* de Driver.js transparente,
        // que es la capa blanca que está cubriendo el modal.
        const css = `.driver-stage-background { background: transparent !important; }`;
        const style = document.createElement('style');
        style.id = TUTORIAL_STYLE_ID;
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);

        // Muestra el modal
        welcomeModal.style.display = 'flex';

        // Resalta el modal de bienvenida.
        driver.highlight({
            element: '#welcomeModalOverlay .modal-content',
            popover: {
                title: '¡Bienvenido!',
                description: 'Por favor, ingresa tu nombre de agente en el campo de texto y presiona "START" o la tecla "Enter" para comenzar.',
                position: 'top-center',
            }
        });

        const moveToNextStep = () => {
            nameInput.removeEventListener('keydown', onEnter);
            startBtn.removeEventListener('click', moveToNextStep);
            
            // Oculta el modal de bienvenida
            welcomeModal.style.display = 'none';
            driver.clearHighlight();
            
            runStep2_FormIntro();
        };

        const onEnter = (e) => {
            if (e.key === 'Enter' && nameInput.value.trim() !== '') {
                e.preventDefault();
                moveToNextStep();
            }
        };

        nameInput.addEventListener('keydown', onEnter);
        startBtn.addEventListener('click', moveToNextStep);
    }

    /**
     * PASO 2: Introducción al formulario principal.
     */
    function runStep2_FormIntro() {
        // FIX: Elimina el estilo CSS inyectado para restaurar el comportamiento normal del overlay.
        const styleElement = document.getElementById(TUTORIAL_STYLE_ID);
        if (styleElement) {
            styleElement.remove();
        }

        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.add('collapsed');
        });

        driver.highlight({
            element: '#callNoteForm',
            popover: {
                title: 'Tu Espacio de Trabajo',
                description: 'Este es el formulario principal. Para continuar, haz clic en el título "Account Info & Verification" para expandir la primera sección.',
                position: 'top-center'
            }
        });

        const seccion1Title = document.querySelector('#seccion1 .section-title');
        
        const onTitleClick = () => {
            seccion1Title.removeEventListener('click', onTitleClick);
            setTimeout(runStep3_Section1, 350); 
        };
        
        seccion1Title.addEventListener('click', onTitleClick);
    }

    /**
     * PASO 3: Explica la Sección 1 y espera clic en la Sección 2.
     */
    function runStep3_Section1() {
        driver.highlight({
            element: '#seccion1',
            popover: {
                title: 'Información de la Cuenta',
                description: '¡Excelente! Aquí ingresas los datos del cliente. Ahora, haz clic en el título de la siguiente sección: "Status, Issue and Troubleshoot Steps".',
                position: 'bottom'
            }
        });

        const seccion2Title = document.querySelector('#seccion2 .section-title');
        const onTitleClick = () => {
            seccion2Title.removeEventListener('click', onTitleClick);
            setTimeout(runStep4_Section2, 350);
        };
        seccion2Title.addEventListener('click', onTitleClick);
    }
    
    /**
     * PASO 4: Explica la Sección 2 y espera clic en la Sección 3.
     */
    function runStep4_Section2() {
        driver.highlight({
            element: '#seccion2',
            popover: {
                title: 'Detalles del Problema',
                description: 'Esta es la sección más importante. Documenta el problema y los pasos realizados. Para continuar, haz clic en "Advanced Wifi Analytics & TVS".',
                position: 'bottom'
            }
        });

        const seccion3Title = document.querySelector('#seccion3 .section-title');
        const onTitleClick = () => {
            seccion3Title.removeEventListener('click', onTitleClick);
            setTimeout(runStep5_Section3, 350);
        };
        seccion3Title.addEventListener('click', onTitleClick);
    }

    /**
     * PASO 5: Explica la Sección 3 y espera clic en la Sección 4.
     */
    function runStep5_Section3() {
        driver.highlight({
            element: '#seccion3',
            popover: {
                title: 'Análisis WiFi y TVS',
                description: 'Aquí registras datos de AWA y TVS. Ya casi terminamos. Haz clic en la última sección: "Resolution".',
                position: 'bottom'
            }
        });

        const seccion4Title = document.querySelector('#seccion4 .section-title');
        const onTitleClick = () => {
            seccion4Title.removeEventListener('click', onTitleClick);
            setTimeout(runStep6_Section4, 350);
        };
        seccion4Title.addEventListener('click', onTitleClick);
    }

    /**
     * PASO 6: Explica la Sección 4 y finaliza el tutorial.
     */
    function runStep6_Section4() {
         driver.highlight({
            element: '#seccion4',
            popover: {
                title: 'Resolución de la Llamada',
                description: 'Finalmente, documenta el resultado de la interacción. ¡Has completado la parte interactiva del formulario!',
                position: 'top'
            }
        });

        localStorage.setItem('tutorialCompleted', 'true');

        setTimeout(() => {
            driver.reset();
        }, 4000); 
    }

    window.addEventListener('load', checkAndStartTutorial);

})();
