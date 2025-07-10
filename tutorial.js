window.addEventListener('load', function () {
  
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
      // LISTA DE PASOS
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
      // ... Aquí van todos los demás pasos que ya tenías ...
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
