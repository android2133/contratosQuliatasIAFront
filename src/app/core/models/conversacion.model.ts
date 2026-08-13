export interface Conversacion {
  conversationId: string;
  tituloConversacion: string;
  inicio: string;
  fin: string;
  consultasRealizadas: number;
  tokensTotal: number;
}

export interface ConversacionParte {
  text: string;
}

export interface ConversacionHistorialItem {
  role: 'user' | 'model';
  parts: ConversacionParte[];
}

export interface ConversacionDetalle {
  conversationId: string;
  historial: ConversacionHistorialItem[];
}
