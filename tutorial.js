// Variable global para controlar el estado del tour
let tourCompletado = localStorage.getItem('tutorialCompletado') === 'true';

// ---- TOUR PARTE 1: PÁGINA PRINCIPAL (CORREGIDO) ----
function iniciarTourPrincipal() {
    // Solo se ejecuta si el tutorial no se ha completado
    if (tourCompletado) return;

    const driver = new Driver({
        animate: true,
        allowClose: false,
        doneBtnText: 'Entendido',
        onNext: (element) => {
            if (driver.currentStep === 2) {
                driver.reset();
            } else {
                driver.moveNext();
            }
        }
    });

    driver.defineSteps([
        {
            // CAMBIO: Usamos el título como ancla para el primer paso.
            element: '.ts-notes-title', 
            title: '¡Bienvenido/a a APad!',
            description: 'Te guiaremos a través de las funciones principales de la aplicación.',
            position: 'bottom' // Posicionamos el popover debajo del título.
        },
        {
            element: '#agentinfo',
            title: 'Información del Agente',
            description: 'Asegúrate de que tus datos aquí sean correctos.',
            position: 'bottom'
        },
        {
            element: '#btnSee',
            title: 'Ver la Nota',
            description: 'Para continuar con el tour, haz clic en el botón <strong>VER (SEE)</strong>.',
            position: 'bottom'
        }
    ]);

    driver.start();
}

// ---- TOUR PARTE 2: MODAL DE LA NOTA ----
function iniciarTourNoteModal() {
    if (tourCompletado) return;

    const driver = new Driver({
        animate: true,
        allowClose: false,
        doneBtnText: 'Entendido',
        onNext: () => {
            if (driver.currentStep === 1) {
                driver.reset();
            } else {
                driver.moveNext();
            }
        }
    });

    driver.defineSteps([
        { element: '#noteModalOverlay', title: 'Vista Previa de la Nota', description: 'Aquí puedes ver tu nota final. Es muy útil.', position: 'top' },
        { element: '#modalSeparateBtn', title: 'Separar Nota', description: 'Para continuar, haz clic en el botón <strong>SPLIT (SEPARAR)</strong>.', position: 'bottom' }
    ]);

    setTimeout(() => driver.start(), 200); // Pequeña espera para que aparezca el modal
}

// ---- TOUR PARTE 3: MODAL SEPARADO ----
function iniciarTourSeparateModal() {
    if (tourCompletado) return;

    const driver = new Driver({
        animate: true,
        allowClose: true,
        doneBtnText: 'Entendido',
        onReset: () => {
            // No marcamos como completado, solo cerramos esta parte
        }
    });
    
    driver.defineSteps([
        { element: '#separateNoteModalOverlay', title: 'Nota Separada', description: 'Esta es la vista de nota separada. Ahora, <strong>cierra este modal</strong> y luego haz clic en <strong>HISTORY</strong> en el menú principal.', position: 'top' }
    ]);

    setTimeout(() => driver.start(), 200);
}

// ---- TOUR PARTE 4: HISTORIAL ----
function iniciarTourHistory() {
    if (tourCompletado) return;

    const driver = new Driver({
        animate: true,
        allowClose: false,
        doneBtnText: 'Entendido',
        onNext: () => {
            if (driver.currentStep === 2) {
                driver.reset();
            } else {
                driver.moveNext();
            }
        }
    });

    driver.defineSteps([
        { element: '#historySidebar', title: 'Panel de Historial', description: 'Aquí se guardan tus notas anteriores.', position: 'left' },
        { element: '#historySearchInput', title: 'Buscador', description: 'Puedes buscar notas antiguas aquí.', position: 'bottom' },
        { element: '#btnChecklistMenu', title: 'Último Paso', description: 'Muy bien. Ahora, <strong>cierra este panel</strong> y haz clic en el <strong>botón del Menú</strong> (arriba a la izquierda) para finalizar.', position: 'bottom' }
    ]);

    setTimeout(() => driver.start(), 200);
}

// ---- TOUR PARTE 5: CHECKLIST (FINAL) ----
function iniciarTourChecklist() {
    if (tourCompletado) return;

    const driver = new Driver({
        animate: true,
        allowClose: true,
        doneBtnText: 'Finalizar Tour',
        onReset: () => {
            // ¡Ahora sí! Al cerrar el último paso, marcamos todo como completado.
            localStorage.setItem('tutorialCompletado', 'true');
            tourCompletado = true;
        }
    });

    driver.defineSteps([
        { element: '#checklistSidebar', title: 'Menú de Checklist', description: '¡Felicidades! Has completado el recorrido por las funciones principales.', position: 'right' }
    ]);

    setTimeout(() => driver.start(), 200);
}

// Inicia el primer tour cuando la página carga
document.addEventListener('DOMContentLoaded', iniciarTourPrincipal);
