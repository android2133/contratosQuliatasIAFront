import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Contenido {
  mimetype: string;
  uri: string;
  nombreArchivo: string;
}

interface ChatRequest {
  texto: string;
  contenidos: Contenido[];
  coleccion: string | null;
  conversation_id: string;
  operador: string;
  expediente: string | null;
  idInstruccionesSistema: number | null;
  modelo: string | null;
}

export interface Cita {
  textoPagina: string;
  score: number;
  file_name: string;
  page: string;
  expediente?: string;
  [key: string]: unknown;
}

export interface Documento {
  nombre: string;
  mime_type: string;
  base64: string;
}

export interface ChatResponse {
  respuesta: string;
  conversation_id: string;
  citas?: Cita[];
  documento?: Documento;
}

const DEFAULT_OPERADOR = 'Web 2';
const DEFAULT_MODELO = 'gemini-2.5-flash';

export const MODELOS_DISPONIBLES = [
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-3.5-pro',
  'gemini-3.5-pro-lite',
] as const;

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);

  private readonly _conversationId = signal('');
  readonly conversationId = this._conversationId.asReadonly();

  private readonly COLECCION = 'CONTRATOS_QLT';

  readonly operador = signal(DEFAULT_OPERADOR);
  readonly instrucciones = signal('');
  readonly modelo = signal<string>(DEFAULT_MODELO);
  readonly modelosDisponibles = MODELOS_DISPONIBLES;

  send(
    texto: string,
    contenidos: Contenido[] = [],
    idInstruccionesSistema: number | null = null,
  ): Observable<ChatResponse> {
    const body: ChatRequest = {
      texto,
      contenidos,
      coleccion: this.COLECCION,
      conversation_id: this._conversationId(),
      operador: this.operador(),
      expediente: null,
      idInstruccionesSistema,
      modelo: this.modelo(),
    };

    return this.http
      .post<ChatResponse>(`${environment.conversationBaseUrl}/api-agente/`, body)
      .pipe(tap((res) => this._conversationId.set(res.conversation_id)));
  }

  resetConversacion(): void {
    this._conversationId.set('');
  }

  resumirConversacion(conversationId: string): void {
    this._conversationId.set(conversationId);
  }
}
