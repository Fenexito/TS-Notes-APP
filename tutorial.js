// tutorial.js (Versión Final Simplificada)

// Variable global para controlar si el tour ya fue visto
let tourCompletado = localStorage.getItem('tutorialCompletado') === 'true';

function iniciarTour(pasoDeInicio = 0) {
    if (tourCompletado) return;

    // Si ya hay un tour activo, lo limpiamos antes de empezar uno nuevo.
    if (window.driverInstance) {
        window.driverInstance.reset();
    }

    const driver = new Driver({
        animate: true,
        allowClose: true,
        onReset: () => {
            localStorage.setItem('tutorialCompletado', 'true');
            tourCompletado = true;
        }
    });

    driver.defineSteps([
        // Paso 0: Modal de Bienvenida
        {
            element: '#welcomeModalOverlay',
            title: '¡Bienvenido a APad!',
            description: 'Para comenzar, ingresa tu nombre y presiona <strong>START</strong>. El tutorial continuará.',
            position: 'right'
        },
        // Paso 1: Página Principal
        {
            element: '#agentinfo',
            title: 'Información del Agente',
            description: '¡Perfecto! Tu nombre aparece aquí. Asegúrate también de que tu "Skill" sea el correcto.',
            position: 'bottom'
        },
        // Aquí puedes seguir añadiendo todos los demás pasos en orden...
        // Por ejemplo:
        // {
        //     element: '#btnSee',
        //     title: 'Ver la Nota',
        //     description: 'Haz clic aquí para ver la nota final.',
        //     position: 'bottom'
        // }
    ]);

    // Guardamos la instancia para poder limpiarla después
    window.driverInstance = driver;
    
    // Iniciamos el tour desde el paso que nos indicaron
    driver.start(pasoDeInicio);
}
