// Espera a que todo el contenido del DOM esté cargado antes de ejecutar el script
document.addEventListener('DOMContentLoaded', function () {
    // Selecciona el botón que iniciará el tutorial
    const startTourBtn = document.getElementById('btnTour');

    // Si el botón no existe, no hagas nada.
    if (!startTourBtn) {
        console.error("El botón para iniciar el tour ('btnTour') no se encontró.");
        return;
    }

    // Función que define e inicia el tour de Driver.js
    function startApplicationTour() {
        // Crea una nueva instancia de Driver
        const driver = new Driver({
            className: 'custom-driver-theme', // Clase CSS personalizada para el popover (opcional)
            animate: true,                    // Animar el resaltado y el popover
            opacity: 0.75,                    // Opacidad del fondo (0 significa sin fondo)
            padding: 10,                      // Relleno alrededor del elemento resaltado
            allowClose: true,                 // Permitir cerrar haciendo clic en el fondo
            nextBtnText: 'Siguiente',         // Texto para el botón 'Siguiente'
            prevBtnText: 'Anterior',          // Texto para el botón 'Anterior'
            closeBtnText: 'Cerrar',           // Texto para el botón 'Cerrar'
            doneBtnText: 'Finalizar',         // Texto para el botón de último paso
            onHighlightStarted: (element) => {
                // Colapsa todas las secciones antes de resaltar una nueva
                document.querySelectorAll('.form-section.collapsed').forEach(section => {
                    // No queremos afectar la sección que está a punto de ser mostrada
                    if (!element.parentElement.contains(section) && !section.contains(element.parentElement)) {
                       // No es necesario hacer nada aquí si el manejo de colapso es correcto
                    }
                });

                // Si el elemento está dentro de una sección colapsada, la expande
                const section = element.closest('.form-section.collapsed');
                if (section) {
                    section.classList.remove('collapsed');
                }
            },
        });

        // Define los pasos del tour
        driver.defineSteps([
            {
                element: '.container',
                popover: {
                    title: '¡Bienvenido a APad | NoteApp!',
                    description: 'Esta es una guía rápida para mostrarte las principales funcionalidades de la aplicación. ¡Vamos a empezar!',
                    position: 'top-center'
                }
            },
            {
                element: '#topactions',
                popover: {
                    title: 'Acciones Principales',
                    description: 'Aquí encuentras los botones para ver, guardar, reiniciar la nota y ver tu historial.',
                    position: 'bottom'
                }
            },
            {
                element: '.agent-info',
                popover: {
                    title: 'Información del Agente',
                    description: 'Puedes ver y editar tu nombre de agente aquí. También puedes cambiar entre los modos FFH y FVT con este interruptor.',
                    position: 'bottom'
                }
            },
            {
                element: '#seccion1 .section-title',
                popover: {
                    title: 'Información de la Cuenta',
                    description: 'Ingresa los datos básicos de la cuenta del cliente. Los campos requeridos tienen un borde rojo hasta que se completan.',
                    position: 'bottom'
                },
                onNext: () => {
                     // Asegurarse de que la sección esté expandida para el siguiente paso
                    document.querySelector('#seccion1').classList.remove('collapsed');
                    driver.moveNext();
                }
            },
            {
                element: '#seccion1 .section-content',
                popover: {
                    title: 'Detalles de Verificación',
                    description: 'Completa la información de la cuenta y los detalles de verificación. Puedes usar los botones de copia para mayor facilidad.',
                    position: 'top'
                }
            },
            {
                element: '#seccion2 .section-title',
                popover: {
                    title: 'Estado y Troubleshooting',
                    description: 'Esta es la sección principal donde documentarás el problema del cliente y los pasos que realizaste.',
                    position: 'bottom'
                },
                 onNext: () => {
                    document.querySelector('#seccion2').classList.remove('collapsed');
                    driver.moveNext();
                }
            },
            {
                element: '#seccion3 .section-title',
                popover: {
                    title: 'Análisis Avanzado de WiFi',
                    description: 'Aquí puedes documentar los detalles de AWA, pruebas de velocidad y el uso de TVS.',
                    position: 'top'
                },
                 onNext: () => {
                    document.querySelector('#seccion3').classList.remove('collapsed');
                    driver.moveNext();
                }
            },
            {
                element: '#seccion4 .section-title',
                popover: {
                    title: 'Resolución',
                    description: 'Finalmente, documenta la resolución de la llamada, si se agendó un técnico, se creó un ticket, etc.',
                    position: 'top'
                },
                 onNext: () => {
                    document.querySelector('#seccion4').classList.remove('collapsed');
                    driver.moveNext();
                }
            },
            {
                element: '#btnChecklistMenu',
                popover: {
                    title: 'Menú de Checklist',
                    description: 'Abre un menú lateral con una lista de verificación para asegurar que sigues todos los procedimientos mandatorios.',
                    position: 'right'
                }
            },
            {
                element: '#btnHistory',
                popover: {
                    title: 'Historial de Notas',
                    description: 'Accede a todas tus notas guardadas. Puedes verlas, editarlas o eliminarlas desde aquí.',
                    position: 'left'
                }
            },
            {
                element: '#feedback-widget',
                popover: {
                    title: 'Enviar Feedback',
                    description: '¿Tienes alguna idea para mejorar la aplicación? ¡Envíala desde aquí!',
                    position: 'top-right'
                }
            },
            {
                element: '.app-footer',
                popover: {
                    title: '¡Todo Listo!',
                    description: 'Has completado el tour. ¡Ahora estás listo para usar la aplicación eficientemente!',
                    position: 'top-center'
                }
            }
        ]);

        // Inicia el tour
        driver.start();
    }

    // Agrega el evento 'click' al botón para iniciar el tour
    startTourBtn.addEventListener('click', startApplicationTour);
});
