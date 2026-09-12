export interface Conversacion {
  conversationId: string;
  tituloConversacion: string;
  inicio: string;
  fin: string;
  consultasRealizadas: number;
  tokensTotal: number;
}

export interface ConversacionArtifact {
  id?: number;
  nombre: string;
  mime_type: string;
  base64: string;
}

export interface ConversacionParte {
  text?: string;
  artifact?: ConversacionArtifact;
}

export interface ConversacionHistorialItem {
  role: 'user' | 'model';
  parts: ConversacionParte[];
}

export interface ConversacionDetalle {
  conversationId: string;
  historial: ConversacionHistorialItem[];
}
