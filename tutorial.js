// Espera a que todo el contenido de la página se cargue antes de configurar el tour
document.addEventListener('DOMContentLoaded', function () {

  // 1. INICIALIZACIÓN DEL TOUR
  // Aquí se configura el comportamiento general del tour
  const tour = new Shepherd.Tour({
    useModalOverlay: true, // Esto oscurece el fondo
    defaultStepOptions: {
      classes: 'shepherd-theme-arrows', // Tema visual
      scrollTo: true, // Se desplaza automáticamente al elemento
      cancelIcon: {
        enabled: true // Permite al usuario cerrar el tour
      },
      buttons: [
        {
          action() {
            return this.back();
          },
          secondary: true,
          text: 'Anterior' // Botón para ir atrás
        },
        {
          action() {
            return this.next();
          },
          text: 'Siguiente' // Botón para ir adelante
        }
      ]
    }
  });

  // 2. DEFINICIÓN DE LOS PASOS
  // Aquí se define cada paso del tutorial. Puedes modificar 'title' y 'text'.
  tour.addSteps([
    {
      id: 'step1',
      title: '¡Bienvenido/a a tu Asistente de Notas!',
      text: 'Este es un recorrido rápido por las funciones principales de la aplicación. ¡Empecemos!',
      buttons: [
        {
          action() {
            return this.next();
          },
          text: 'Comenzar Tour'
        }
      ]
    },
    {
      id: 'step2',
      attachTo: { element: '#agentinfo', on: 'bottom' },
      title: 'Información del Agente',
      text: 'Primero, asegúrate de que tu nombre y tu "Skill" o especialidad estén correctamente seleccionados aquí.'
    },
    {
      id: 'step3',
      attachTo: { element: '#callNoteForm', on: 'top' },
      title: 'Formulario Principal de la Nota',
      text: 'Este es el corazón de la herramienta. Aquí documentarás toda la información de la llamada, dividida en varias secciones.'
    },
    {
      id: 'step4',
      attachTo: { element: '#seccion1', on: 'top' },
      title: 'Cuenta y Verificación',
      text: 'En esta primera sección, ingresa todos los detalles de la cuenta del cliente y los pasos de verificación que realizaste.'
    },
    {
      id: 'step5',
      attachTo: { element: '#seccion2', on: 'top' },
      title: 'Problema y Diagnóstico (Troubleshooting)',
      text: 'Describe el problema del cliente y todos los pasos de diagnóstico que seguiste para intentar solucionarlo.'
    },
    {
      id: 'step6',
      attachTo: { element: '#seccion3', on: 'top' },
      title: 'AWA y TVS',
      text: 'Utiliza esta sección para documentar cualquier información relevante sobre "Additional Work Authorization" o "Total Value Sold".'
    },
    {
      id: 'step7',
      attachTo: { element: '#seccion4', on: 'top' },
      title: 'Resolución del Caso',
      text: 'Aquí debes detallar la solución final que se le dio al cliente y si hay algún paso a seguir.'
    },
    {
      id: 'step8',
      attachTo: { element: '#topactions', on: 'bottom' },
      title: 'Acciones Principales',
      text: 'Estos botones te permiten copiar la nota al portapapeles, generar la nota final o limpiar todo el formulario para empezar de nuevo.'
    },
    {
      id: 'step9',
      attachTo: { element: '#noteModalOverlay', on: 'top' },
      title: 'Modal de Nota Final',
      text: 'Cuando generas la nota, esta ventana (modal) aparecerá para mostrarte una vista previa. Desde aquí podrás copiar el texto final.'
    },
    {
      id: 'step10',
      attachTo: { element: '#separateNoteModalOverlay', on: 'top' },
      title: 'Modal de Nota Separada',
      text: 'Este es otro tipo de modal que puedes usar para ver o trabajar con la nota en un formato diferente.'
    },
    // Omití el paso 11 porque no estaba en tu lista
    {
      id: 'step12',
      attachTo: { element: '#historySidebar', on: 'left' },
      title: 'Historial de Notas',
      text: 'Este panel lateral guarda un registro de todas las notas que has creado. ¡Nunca perderás tu trabajo!'
    },
    {
      id: 'step13',
      attachTo: { element: '#historySearchInput', on: 'bottom' },
      title: 'Buscador de Notas',
      text: 'Usa esta barra para buscar rápidamente en tu historial por palabra clave, fecha o número de caso.'
    },
    {
      id: 'step14',
      attachTo: { element: '#historyactionsfooter', on: 'top' },
      title: 'Exportar e Importar',
      text: 'Puedes exportar todo tu historial a un archivo para tener un respaldo, o importar un historial previamente guardado.'
    },
    {
      id: 'step15',
      attachTo: { element: '#checklistSidebar', on: 'right' },
      title: 'Checklist de Calidad (Excellence Mandate)',
      text: 'Consulta este menú para asegurarte de que cumples con todos los puntos de calidad y procedimientos requeridos.'
    },
    {
      id: 'step16',
      attachTo: { element: '#feedback-btn', on: 'top' },
      title: '¡Tu Opinión es Importante!',
      text: 'Si tienes alguna sugerencia para mejorar la herramienta o encuentras un error, por favor, háznoslo saber usando este botón. ¡Gracias!',
      buttons: [
        {
          action() {
            return this.back();
          },
          secondary: true,
          text: 'Anterior'
        },
        {
          action() {
            return this.complete();
          },
          text: 'Finalizar' // El último botón para terminar el tour
        }
      ]
    }
  ]);

  // 3. INICIO DEL TOUR
  // Esta línea hace que el tour comience automáticamente.
  // Puedes comentarla y llamar a tour.start() desde un botón si lo prefieres.
  tour.start();

});