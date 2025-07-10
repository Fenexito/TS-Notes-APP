// Variable global para controlar el estado del tour
let tourCompletado = localStorage.getItem('tutorialCompletado') === 'true';

// ---- TOUR PARTE 1: PÁGINA PRINCIPAL (CORREGIDO) ----
function iniciarTourPrincipal() {
    if (tourCompletado) return;

    // Se simplificaron las opciones para máxima compatibilidad
    const driver = new Driver({
        animate: true,
        allowClose: true, // Permitimos que se cierre por ahora para depurar
        onReset: () => {
            localStorage.setItem('tutorialCompletado', 'true');
        }
    });

    driver.defineSteps([
        {
            // CAMBIO: Anclado a la primera sección del formulario
            element: '#seccion1', 
            title: '¡Bienvenido/a a APad!',
            description: 'Este es el formulario principal. Te guiaremos a través de las secciones más importantes.',
            position: 'top' // Se posiciona arriba de la sección
        },
        {
            element: '#topactions',
            title: 'Acciones Principales',
            description: 'Desde aquí puedes copiar, guardar o reiniciar la nota. <strong>Ahora, haz clic en "VER" para continuar el tour.</strong>',
            position: 'bottom'
        }
    ]);

    driver.start();
}


// ---- RESTO DE LAS FUNCIONES DEL TOUR (SIN CAMBIOS) ----

// Función para iniciar el tour del modal de la nota
function iniciarTourDelModal() {
    if (tourCompletado) return;
    // ... (el código de esta función y las demás permanece igual) ...
    const driverModal = new Driver({
        animate: true,
        allowClose: true,
        onReset: () => { localStorage.setItem('tutorialCompletado', 'true'); }
    });
    driverModal.defineSteps([
        {
            element: '#noteModalOverlay',
            title: 'Vista Previa de la Nota',
            description: '¡Excelente! Este es el modal donde ves la nota final. Ahora, haz clic en <strong>SPLIT</strong>.',
            position: 'top'
        }
    ]);
    setTimeout(() => driverModal.start(), 200);
}

// Función para iniciar el tour del modal separado
function iniciarTourSeparateModal() {
    if (tourCompletado) return;
    const driver = new Driver({
        animate: true,
        allowClose: true
    });
    driver.defineSteps([
        {
            element: '#separateNoteModalOverlay',
            title: 'Nota Separada',
            description: 'Esta es la vista de nota separada. Ahora, <strong>cierra este modal</strong> y luego haz clic en <strong>HISTORY</strong> en el menú principal.',
            position: 'top'
        }
    ]);
    setTimeout(() => driver.start(), 200);
}

// Función para iniciar el tour del historial
function iniciarTourHistory() {
    if (tourCompletado) return;
    const driver = new Driver({
        animate: true,
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
        { element: '#historySidebar', title: 'Panel de Historial', description: 'Aquí se guardan tus notas anteriores.', position: 'left' },
        { element: '#historySearchInput', title: 'Buscador', description: 'Puedes buscar notas antiguas aquí.', position: 'bottom' },
        { element: '#btnChecklistMenu', title: 'Último Paso', description: 'Muy bien. Ahora, <strong>cierra este panel</strong> y haz clic en el <strong>botón del Menú</strong> (arriba a la izquierda) para finalizar.', position: 'bottom' }
    ]);
    setTimeout(() => driver.start(), 200);
}

// Función para iniciar el tour del checklist
function iniciarTourChecklist() {
    if (tourCompletado) return;
    const driver = new Driver({
        animate: true,
        doneBtnText: 'Finalizar Tour',
        onReset: () => {
            localStorage.setItem('tutorialCompletado', 'true');
            tourCompletado = true;
        }
    });
    driver.defineSteps([
        { element: '#checklistSidebar', title: 'Menú de Checklist', description: '¡Felicidades! Has completado el recorrido.', position: 'right' }
    ]);
    setTimeout(() => driver.start(), 200);
}


// Inicia el primer tour cuando la página carga
document.addEventListener('DOMContentLoaded', iniciarTourPrincipal);
