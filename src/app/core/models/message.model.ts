import { Cita, Documento } from '../services/chat.service';

export type MessageRole = 'user' | 'assistant';
export type MessageContentType = 'text' | 'markdown' | 'table' | 'chart' | 'image-card';

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  base64?: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ChartData {
  label: string;
  labels: string[];
  values: number[];
  color: string;
}

export interface RetryPayload {
  userInput: string;
  contenidos: { mimetype: string; uri: string; nombreArchivo: string }[];
  instruccionId: number | null;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  contentType: MessageContentType;
  timestamp: Date;
  attachments?: AttachedFile[];
  tableData?: TableData;
  chartData?: ChartData;
  imageUrl?: string;
  isLoading?: boolean;
  isError?: boolean;
  retryPayload?: RetryPayload;
  citas?: Cita[];
  documento?: Documento;
}
