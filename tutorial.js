// Se utiliza una IIFE (Immediately Invoked Function Expression) para evitar conflictos con otras variables globales.
(function() {
    // Se define el objeto driver en un alcance más amplio para que sea accesible por todas las funciones del tour.
    let driver;

    /**
     * Revisa si el tutorial ya fue completado. Si no, lo inicia.
     * Esta es la nueva función de entrada del script.
     */
    function checkAndStartTutorial() {
        // Si la bandera 'tutorialCompleted' existe en localStorage, no se hace nada.
        if (localStorage.getItem('tutorialCompleted') === 'true') {
            console.log("El tutorial ya ha sido completado. No se mostrará de nuevo.");
            return;
        }
        // Si no, se inicia el tour.
        startApplicationTour();
    }

    /**
     * Función principal que inicia y controla el flujo del tour.
     */
    function startApplicationTour() {
        // Crea una nueva instancia de Driver
        driver = new Driver({
            className: 'custom-driver-theme',
            animate: true,
            opacity: 0.75,
            padding: 10,
            allowClose: false, // El usuario no puede cerrar el tour haciendo clic fuera
            doneBtnText: 'Finalizar',
            // No se define 'closeBtnText' para ocultar el botón de cerrar
        });

        // Inicia el tour con el primer paso
        runStep1_WelcomeModal();
    }

    /**
     * PASO 1: Enfocado en el modal de bienvenida.
     */
    function runStep1_WelcomeModal() {
        // Elementos del modal
        const welcomeModal = document.getElementById('welcomeModalOverlay');
        const nameInput = document.getElementById('welcomeAgentNameInput');
        const startBtn = document.getElementById('startTakingNotesBtn');

        // El script del tour ahora controla la visibilidad del modal para nuevos usuarios.
        welcomeModal.style.display = 'flex';

        // Resalta el modal de bienvenida
        driver.highlight({
            element: '#welcomeModalOverlay .modal-content',
            popover: {
                title: '¡Bienvenido!',
                description: 'Por favor, ingresa tu nombre de agente en el campo de texto y presiona "START" o la tecla "Enter" para comenzar.',
                position: 'top-center', // Posición actualizada para mejor visibilidad
            }
        });

        // FIX: Se hace transparente el overlay de Driver.js para este paso específico
        // para que no oculte el overlay oscuro del modal de bienvenida.
        const driverOverlay = document.querySelector('.driver-overlay');
        if (driverOverlay) {
            driverOverlay.style.background = 'transparent';
        }

        // Función para pasar al siguiente paso
        const moveToNextStep = () => {
            // Limpia los listeners para que no se ejecuten de nuevo
            nameInput.removeEventListener('keydown', onEnter);
            startBtn.removeEventListener('click', moveToNextStep);
            
            // Oculta el modal de bienvenida para continuar con la app
            welcomeModal.style.display = 'none';
            driver.clearHighlight(); // Limpia el resaltado actual
            
            // Llama al siguiente paso del tour
            runStep2_FormIntro();
        };

        // Listener para la tecla Enter
        const onEnter = (e) => {
            if (e.key === 'Enter' && nameInput.value.trim() !== '') {
                e.preventDefault();
                moveToNextStep();
            }
        };

        // Agrega los event listeners
        nameInput.addEventListener('keydown', onEnter);
        startBtn.addEventListener('click', moveToNextStep);
    }

    /**
     * PASO 2: Introducción al formulario principal, con todas las secciones colapsadas.
     */
    function runStep2_FormIntro() {
        // FIX: Restaura el overlay oscuro por defecto para el resto del tour.
        const driverOverlay = document.querySelector('.driver-overlay');
        if (driverOverlay) {
            driverOverlay.style.background = ''; // Revierte al estilo por defecto de la librería
        }

        // Colapsa todas las secciones del formulario
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.add('collapsed');
        });

        // Resalta el formulario
        driver.highlight({
            element: '#callNoteForm',
            popover: {
                title: 'Tu Espacio de Trabajo',
                description: 'Este es el formulario principal. Para continuar, haz clic en el título "Account Info & Verification" para expandir la primera sección.',
                position: 'top-center'
            }
        });

        const seccion1Title = document.querySelector('#seccion1 .section-title');
        
        // Listener para el clic en el título de la sección 1
        const onTitleClick = () => {
            seccion1Title.removeEventListener('click', onTitleClick);
            // Pequeña espera para que la animación de despliegue termine
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

        // Marca el tutorial como completado en localStorage
        localStorage.setItem('tutorialCompleted', 'true');
        console.log("Tutorial completado y guardado en localStorage.");

        // Muestra el último paso por 4 segundos y luego finaliza el tour.
        setTimeout(() => {
            driver.reset(); // Finaliza y limpia el tour
        }, 4000); 
    }

    // Se utiliza el evento 'load' para asegurar que todos los recursos se hayan cargado.
    window.addEventListener('load', checkAndStartTutorial);

})();
