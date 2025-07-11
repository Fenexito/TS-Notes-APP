// Se utiliza una IIFE (Immediately Invoked Function Expression) para evitar conflictos con otras variables globales.
(function() {
    // Se define el objeto driver en un alcance más amplio para que sea accesible por todas las funciones del tour.
    let driver;
    const FAKE_POPOVER_ID = 'tutorial-fake-popover';

    /**
     * Revisa si el tutorial ya fue completado. Si no, lo inicia.
     */
    function checkAndStartTutorial() {
        if (localStorage.getItem('tutorialCompleted') === 'true') {
            return;
        }
        // Inicia directamente con el paso 1 manual, sin activar Driver.js aún.
        runStep1_ManualWelcome();
    }

    /**
     * PASO 1 (MANUAL): Muestra el modal de bienvenida y un popover falso sin usar Driver.js.
     */
    function runStep1_ManualWelcome() {
        const welcomeModal = document.getElementById('welcomeModalOverlay');
        const nameInput = document.getElementById('welcomeAgentNameInput');
        const startBtn = document.getElementById('startTakingNotesBtn');

        // Muestra el modal de bienvenida de la aplicación
        welcomeModal.style.display = 'flex';

        // Crea y muestra un popover falso sobre el modal
        const fakePopover = document.createElement('div');
        fakePopover.id = FAKE_POPOVER_ID;
        fakePopover.innerHTML = `
            <div class="driver-popover-title">¡Bienvenido!</div>
            <div class="driver-popover-description">Por favor, ingresa tu nombre de agente en el campo de texto y presiona "START" o la tecla "Enter" para comenzar.</div>
        `;
        document.body.appendChild(fakePopover);

        const moveToNextStep = () => {
            nameInput.removeEventListener('keydown', onEnter);
            startBtn.removeEventListener('click', moveToNextStep);
            
            // Elimina el popover falso
            document.getElementById(FAKE_POPOVER_ID)?.remove();
            
            // Oculta el modal de bienvenida
            welcomeModal.style.display = 'none';
            
            // AHORA SÍ, inicia el verdadero tour de Driver.js
            startRealDriverTour();
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
     * Inicializa Driver.js y comienza el tour desde el paso 2.
     */
    function startRealDriverTour() {
        driver = new Driver({
            className: 'custom-driver-theme',
            animate: true,
            opacity: 0.75,
            padding: 10,
            allowClose: false,
            doneBtnText: 'Finalizar',
        });
        
        // Comienza el tour desde la introducción al formulario.
        runStep2_FormIntro();
    }

    /**
     * PASO 2: Introducción al formulario principal.
     */
    function runStep2_FormIntro() {
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

    // Añade los estilos para el popover falso al final del CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #${FAKE_POPOVER_ID} {
            position: fixed;
            top: 15%;
            left: 50%;
            transform: translateX(-50%);
            background-color: #333;
            color: #f0f0f0;
            border: 1px solid #007bff;
            border-radius: 8px;
            padding: 15px 20px;
            z-index: 100000; /* Un z-index muy alto para estar por encima de todo */
            max-width: 350px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
    `;
    document.head.appendChild(style);

    window.addEventListener('load', checkAndStartTutorial);

})();
