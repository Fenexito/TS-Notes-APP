document.addEventListener('DOMContentLoaded', function () {
  
  // CONFIGURACIÓN DEL DRIVER (TUTORIAL)
  const driverObj = driver.driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    onDestroyStarted: () => {
      if (!driverObj.isLastStep() && driverObj.getActiveIndex() !== undefined) {
          localStorage.setItem('tutorialDriverCompletado', 'true');
          return;
      }
      driverObj.destroy();
      localStorage.setItem('tutorialDriverCompletado', 'true');
    },
    steps: [
      // 2. LISTA DE PASOS
      {
        popover: {
          title: '¡Bienvenido/a a tu Asistente de Notas!',
          description: 'Este es un recorrido rápido por las funciones principales. ¡Empecemos!'
        }
      },
      {
        element: '#agentinfo',
        popover: {
          title: 'Información del Agente',
          description: 'Primero, asegúrate de que tu nombre y tu "Skill" o especialidad estén correctamente seleccionados aquí.',
          side: "bottom"
        }
      },
      {
        element: '#callNoteForm',
        popover: {
          title: 'Formulario Principal de la Nota',
          description: 'Este es el corazón de la herramienta. Aquí documentarás toda la información de la llamada.',
          side: "top"
        }
      },
      {
        element: '#seccion1',
        popover: {
          title: 'Cuenta y Verificación',
          description: 'En esta primera sección, ingresa todos los detalles de la cuenta del cliente y los pasos de verificación.',
          side: "top"
        }
      },
      {
        element: '#seccion2',
        popover: {
          title: 'Problema y Diagnóstico',
          description: 'Describe el problema del cliente y todos los pasos de diagnóstico que seguiste para solucionarlo.',
          side: "top"
        }
      },
      {
        element: '#seccion3',
        popover: {
          title: 'AWA y TVS',
          description: 'Utiliza esta sección para documentar cualquier información relevante sobre AWA o TVS.',
          side: "top"
        }
      },
      {
        element: '#seccion4',
        popover: {
          title: 'Resolución del Caso',
          description: 'Detalla aquí la solución final que se le dio al cliente y si hay algún paso a seguir.',
          side: "top"
        }
      },
      {
        element: '#topactions',
        popover: {
          title: 'Acciones Principales',
          description: 'Estos botones te permiten copiar la nota, generar la vista final o limpiar todo el formulario.',
          side: "bottom"
        }
      },
      {
        element: '#noteModalOverlay',
        popover: {
          title: 'Modal de Nota Final',
          description: 'Cuando generas la nota, esta ventana aparecerá para mostrarte una vista previa.',
          side: "top"
        }
      },
      {
        element: '#separateNoteModalOverlay',
        popover: {
          title: 'Modal de Nota Separada',
          description: 'Este es otro tipo de modal que puedes usar para ver o trabajar con la nota.',
          side: "top"
        }
      },
      {
        element: '#historySidebar',
        popover: {
          title: 'Historial de Notas',
          description: 'Este panel lateral guarda un registro de todas las notas que has creado.',
          side: "left"
        }
      },
      {
        element: '#historySearchInput',
        popover: {
          title: 'Buscador de Notas',
          description: 'Usa esta barra para buscar rápidamente en tu historial.',
          side: "bottom"
        }
      },
      {
        element: '#historyactionsfooter',
        popover: {
          title: 'Exportar e Importar',
          description: 'Puedes exportar todo tu historial para tener un respaldo, o importar uno previamente guardado.',
          side: "top"
        }
      },
      {
        element: '#checklistSidebar',
        popover: {
          title: 'Checklist de Calidad',
          description: 'Consulta este menú para asegurarte de que cumples con todos los puntos de calidad requeridos.',
          side: "right"
        }
      },
      {
        element: '#feedback-btn',
        popover: {
          title: '¡Tu Opinión es Importante!',
          description: 'Si tienes alguna sugerencia para mejorar la herramienta, por favor, háznoslo saber usando este botón.',
          side: "top"
        }
      },
       {
        popover: {
          title: '¡Tour Completado!',
          description: '¡Ya estás listo para empezar! Si necesitas ver esto de nuevo, puedes añadir un botón en el menú de configuración.'
        }
      }
    ]
  });

  // DECISIÓN DE INICIAR EL TOUR
  if (!localStorage.getItem('tutorialDriverCompletado')) {
    driverObj.drive();
  }

});