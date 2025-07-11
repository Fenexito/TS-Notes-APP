// Se utiliza una IIFE para evitar conflictos.
(function() {

    function startApplicationTour() {
    const intro = introJs();

    intro.setOptions({
        showProgress: true,
        disableInteraction: true,
        highlightClass: 'custom-intro-highlight',
        tooltipClass: 'custom-intro-tooltip',
        steps: [
            {
                element: document.querySelector('#welcomeModalOverlay .modal-content'),
                title: '¡Bienvenido!',
                intro: 'Por favor, ingresa tu nombre de agente en el campo de texto y presiona "START" para comenzar.',
                position: 'top'
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
            {
                element: document.querySelector('#seccion4-wrapper'),
                title: 'Resolución de la Llamada',
                intro: '¡Has completado el tour!',
                position: 'top'
            }
        ]
    });

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
        const currentStep = this._currentStep;

        if (currentStep === 0) {
            document.body.classList.add('intro-modal-step-active');
        } else {
            document.body.classList.remove('intro-modal-step-active');
        }

        switch (currentStep) {
            case 0:
                document.getElementById('welcomeModalOverlay').style.display = 'flex';
                const startBtn = document.getElementById('startTakingNotesBtn');
                startBtn.addEventListener('click', () => {
                    if (document.getElementById('welcomeAgentNameInput').value.trim() !== '') {
                        document.getElementById('welcomeModalOverlay').style.display = 'none';
                        intro.nextStep();
                    }
                }, { once: true });
                break;
            case 1:
                setupManualAdvance('#seccion1 .section-title', 3);
                break;
            case 2:
                setupManualAdvance('#seccion2 .section-title', 4);
                break;
            case 3:
                setupManualAdvance('#seccion3 .section-title', 5);
                break;
            case 4:
                setupManualAdvance('#seccion4 .section-title', 6);
                break;
        }
    });

    intro.onexit(function() {
        document.body.classList.remove('intro-modal-step-active');
        localStorage.setItem('tutorialCompleted', 'true');
    });

    intro.start();
}

    window.addEventListener('load', checkAndStartTutorial);

})();
