document.addEventListener('DOMContentLoaded', function () {
    // Solo iniciar si el tutorial no se ha completado
    if (!localStorage.getItem('tutorialDriverCompletado')) {
        
        // 1. Crear una instancia de Driver
        const driver = new Driver({
            animate: true,
            allowClose: true,
            onReset: () => {
                // Cuando el tour se cierra o termina, lo guardamos en la memoria
                localStorage.setItem('tutorialDriverCompletado', 'true');
            }
        });

        // 2. Definir los pasos del tutorial
        driver.defineSteps([
            {
                title: '¡Bienvenido/a a tu Asistente de Notas!',
                description: 'Este es un recorrido rápido por las funciones principales.'
            },
            {
                element: '#agentinfo',
                title: 'Información del Agente',
                description: 'Asegúrate de que tu nombre y "Skill" estén correctos.',
                position: 'bottom'
            },
            {
                element: '#callNoteForm',
                title: 'Formulario Principal',
                description: 'Aquí documentarás toda la interacción.',
                position: 'top'
            },
            {
                element: '#seccion1',
                title: 'Cuenta y Verificación',
                description: 'Ingresa los detalles de la cuenta y los pasos de verificación.',
                position: 'top'
            },
            {
                element: '#seccion2',
                title: 'Problema y Diagnóstico',
                description: 'Describe el problema reportado y los pasos de diagnóstico.',
                position: 'top'
            },
            {
                element: '#seccion3',
                title: 'AWA y TVS',
                description: 'Documenta aquí la información relacionada con AWA y TVS.',
                position: 'top'
            },
            {
                element: '#seccion4',
                title: 'Resolución',
                description: 'Detalla la resolución del caso y los próximos pasos.',
                position: 'top'
            },
            {
                element: '#topactions',
                title: 'Acciones Principales',
                description: 'Desde aquí puedes copiar la nota, generarla o limpiarla.',
                position: 'bottom'
            },
            {
                element: '#noteModalOverlay',
                title: 'Vista Previa de la Nota',
                description: 'Aquí puedes ver una vista previa de la nota final.',
                position: 'top'
            },
            {
                element: '#separateNoteModalOverlay',
                title: 'Nota Separada',
                description: 'Este modal te permite trabajar con la nota en otro formato.',
                position: 'top'
            },
            {
                element: '#historySidebar',
                title: 'Historial de Notas',
                description: 'Este panel contiene el historial de tus notas.',
                position: 'left'
            },
            {
                element: '#historySearchInput',
                title: 'Buscador en Historial',
                description: 'Usa este campo para buscar rápidamente en tu historial.',
                position: 'bottom'
            },
            {
                element: '#historyactionsfooter',
                title: 'Exportar e Importar',
                description: 'Desde aquí puedes exportar o importar tu historial.',
                position: 'top'
            },
            {
                element: '#checklistSidebar',
                title: 'Excellence Mandate',
                description: 'Este menú te da acceso a checklists y mandatos de excelencia.',
                position: 'right'
            },
            {
                element: '#feedback-btn',
                title: 'Tu Opinión Importa',
                description: 'Si tienes sugerencias o encuentras un error, contáctanos aquí.',
                position: 'top'
            }
        ]);

        // 3. Iniciar el tour
        driver.start();
    }
});