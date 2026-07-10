import { MessageRole, MessageContentType } from './message.model';

export type ConversacionEstado = 'activa' | 'archivada';

export interface ConversacionMensaje {
  role: MessageRole;
  content: string;
  contentType: MessageContentType;
  timestamp: string;
}

export interface Conversacion {
  folio: string;
  operadorId: string;
  operadorEmail: string;
  operadorNombre: string;
  historia: string;
  mensajes: ConversacionMensaje[];
  contratoUrl: string | null;
  estado: ConversacionEstado;
  fechaInicio: Date;
  fechaActualizacion: Date;
}
