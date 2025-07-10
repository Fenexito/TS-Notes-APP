// Variable global para controlar el estado del tour
let tourCompletado = localStorage.getItem('tutorialCompletado') === 'true';

// ---- TOUR PARTE 1: MODAL DE BIENVENIDA ----
function iniciarTourPrincipal() {
    if (tourCompletado) return;

    const driver = new Driver({
        animate: true,
        allowClose: false, // El usuario debe interactuar con el modal
        showButtons: false // No mostramos botones de "Next" o "Close"
    });

    driver.defineSteps([
        {
            element: '#welcomeModalOverlay',
            title: '¡Bienvenido a APad!',
            description: 'Para comenzar, por favor ingresa tu nombre en el campo de abajo y presiona <strong>START</strong>. El tutorial continuará.',
            position: 'right'
        }
    ]);

    // Pequeña espera para asegurar que el modal de bienvenida sea visible
    setTimeout(() => {
        // Solo inicia si el modal está visible
        if (document.getElementById('welcomeModalOverlay').style.display !== 'none') {
            driver.start();
        }
    }, 500);
}

// ---- TOUR PARTE 2: TOUR PRINCIPAL POST-BIENVENIDA ----
function iniciarTourPostBienvenida() {
    if (tourCompletado) return;

    // Detenemos el tour anterior si estuviera activo
    Driver.prototype.reset();

    const driver = new Driver({
        animate: true,
        allowClose: false,
        doneBtnText: 'Entendido',
        onNext: (element) => {
            // Cuando llegamos al último paso de esta sección, finaliza esta parte.
            if (driver.currentStep === 1) { // El índice del paso de #btnSee
                driver.reset();
            } else {
                driver.moveNext();
            }
        }
    });

    driver.defineSteps([
        {
            element: '#agentinfo',
            title: 'Información del Agente',
            description: '¡Perfecto! Tu nombre aparece aquí. Asegúrate también de que tu "Skill" sea el correcto.',
            position: 'bottom'
        },
        {
            element: '#btnSee',
            title: 'Ver la Nota',
            description: 'Para continuar con el tour, haz clic en el botón <strong>VER (SEE)</strong>.',
            position: 'bottom'
        }
    ]);
    
    setTimeout(() => driver.start(), 200);
}


// ---- RESTO DE LAS FUNCIONES DEL TOUR (SIN CAMBIOS) ----
// (Aquí van las demás funciones: iniciarTourDelModal, iniciarTourSeparateModal, etc., tal como estaban en la respuesta anterior)

function iniciarTourDelModal() {
    if (tourCompletado) return;
    const driverModal = new Driver({
        animate: true,
        allowClose: true,
        onReset: () => { localStorage.setItem('tutorialCompletado', 'true'); }
    });
    driverModal.defineSteps([
        {
            element: '#noteModalOverlay',
            title: 'Vista Previa de la Nota',
            description: 'Este es el modal donde ves la nota final.',
            position: 'top'
        }
    ]);
    setTimeout(() => driverModal.start(), 200);
}

// ... etc. ...


// Inicia el primer tour (del modal de bienvenida) cuando la página carga
document.addEventListener('DOMContentLoaded', iniciarTourPrincipal);
