export interface Faq {
  pregunta: string;
  respuesta: string;
}

export const PREGUNTAS_FRECUENTES: Faq[] = [
  {
    pregunta: '¿Qué tipos de contrato puedo generar con el agente?',
    respuesta: 'Contratos laborales (por tiempo indefinido o temporal), contratos comerciales y contratos de confidencialidad (NDA). También puedes adjuntar un contrato existente para que el agente lo analice y sugiera recomendaciones.',
  },
  {
    pregunta: '¿Cómo inicio una conversación nueva?',
    respuesta: 'Da clic en "Nueva conversación" dentro del chat. Se limpia el hilo actual y se genera automáticamente un folio nuevo para darle seguimiento al caso.',
  },
  {
    pregunta: '¿Para qué sirve el folio que aparece en el chat?',
    respuesta: 'Es el identificador único de esa conversación. Úsalo para dar seguimiento con soporte, para encontrarla después en "Historial" o para referenciarla en el expediente del contrato.',
  },
  {
    pregunta: '¿Puedo retomar una conversación que ya había iniciado?',
    respuesta: 'Sí. Ve a la sección "Historial", busca el folio o el contenido de la conversación, y da clic en el ícono de reanudar. El chat continúa exactamente donde la dejaste.',
  },
  {
    pregunta: '¿Cómo firmo un contrato generado por el agente?',
    respuesta: 'Una vez que confirmes los datos, el agente muestra el contrato en el chat y, si aceptas firmarlo, te envía el o los enlaces de firma directamente en la conversación.',
  },
  {
    pregunta: '¿Puedo adjuntar una identificación en lugar de escribir los datos?',
    respuesta: 'Sí, puedes adjuntar una INE o pasaporte vigente. El agente extrae los datos automáticamente (nombre, CURP, RFC, dirección) y valida la vigencia del documento.',
  },
  {
    pregunta: '¿Dónde recibo el contrato ya firmado?',
    respuesta: 'Se envía automáticamente al correo electrónico que proporcionaste durante la conversación.',
  },
  {
    pregunta: '¿Qué hago si el agente no entiende mi solicitud?',
    respuesta: 'Intenta reformular la petición con más detalle. Si el problema persiste, contacta a soporte e incluye el folio de la conversación para agilizar la revisión.',
  },
];
