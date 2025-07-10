// Se utiliza una IIFE (Immediately Invoked Function Expression) para evitar conflictos con otras variables globales.
(function() {
    /**
     * Esta función inicializa la configuración del tour.
     * Espera a que se cargue todo el contenido de la página.
     */
    function initializeTour() {
        // Selecciona el botón que iniciará el tutorial
        const startTourBtn = document.getElementById('btnTour');

        // Si el botón no se encuentra, se registra un error en la consola y se detiene la ejecución.
        if (!startTourBtn) {
            console.error("tutorial.js: No se pudo encontrar el botón para iniciar el tour con id 'btnTour'.");
            return;
        }

        /**
         * Define los pasos y la configuración del tour de Driver.js y lo inicia.
         */
        function startApplicationTour() {
            try {
                // Crea una nueva instancia de Driver con opciones personalizadas
                const driver = new Driver({
                    className: 'custom-driver-theme', // Clase CSS para personalizar la apariencia
                    animate: true,
                    opacity: 0.75,
                    padding: 10,
                    allowClose: true,
                    nextBtnText: 'Siguiente',
                    prevBtnText: 'Anterior',
                    closeBtnText: 'Cerrar',
                    doneBtnText: 'Finalizar',
                    onHighlightStarted: (element) => {
                        // CORRECCIÓN: Se accede al nodo del DOM a través de 'element.node'
                        // Antes de resaltar un elemento, comprueba si está dentro de una sección colapsada y la expande.
                        const section = element.node.closest('.form-section.collapsed');
                        if (section) {
                            section.classList.remove('collapsed');
                        }
                    },
                });

                // Define todos los pasos del tour
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
                    },
                     {
                        element: '#seccion2 .section-content',
                        popover: {
                            title: 'Llenado de Información',
                            description: 'Selecciona el estado de la cuenta, el servicio, el flujo de trabajo y describe el problema del cliente aquí.',
                            position: 'top'
                        }
                    },
                    {
                        element: '#seccion3 .section-title',
                        popover: {
                            title: 'Análisis Avanzado de WiFi',
                            description: 'Aquí puedes documentar los detalles de AWA, pruebas de velocidad y el uso de TVS.',
                            position: 'top'
                        },
                    },
                    {
                        element: '#seccion4 .section-title',
                        popover: {
                            title: 'Resolución',
                            description: 'Finalmente, documenta la resolución de la llamada, si se agendó un técnico, se creó un ticket, etc.',
                            position: 'top'
                        },
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
            } catch (e) {
                // Si ocurre un error al iniciar el tour, lo muestra en la consola.
                console.error("tutorial.js: Ocurrió un error al intentar iniciar el tour.", e);
            }
        }

        // Se asegura de eliminar cualquier listener previo para evitar duplicados.
        startTourBtn.removeEventListener('click', startApplicationTour);
        // Agrega el evento 'click' al botón para iniciar el tour.
        startTourBtn.addEventListener('click', startApplicationTour);
    }

    // Se utiliza el evento 'load' en lugar de 'DOMContentLoaded' para asegurar que todos los recursos
    // (imágenes, otros scripts) se hayan cargado completamente antes de ejecutar el código.
    window.addEventListener('load', initializeTour);

})();
