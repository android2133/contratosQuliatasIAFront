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
  instruccionesSistema: string;
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

export interface ChatResponse {
  respuesta: string;
  conversation_id: string;
  citas?: Cita[];
}

const MODELO = 'gemini-2.5-flash';
const DEFAULT_OPERADOR = 'Web 2';

const DEFAULT_INSTRUCCIONES = `Hola`;

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);

  private readonly _conversationId = signal('');
  readonly conversationId = this._conversationId.asReadonly();

  private readonly COLECCION = 'CONTRATOS_QLT';

  readonly operador = signal(DEFAULT_OPERADOR);
  readonly instrucciones = signal(DEFAULT_INSTRUCCIONES);

  private resolveInstrucciones(): string {
    const fecha = new Date().toLocaleDateString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    return this.instrucciones().replace('{fecha}', fecha);
  }

  send(texto: string, contenidos: Contenido[] = []): Observable<ChatResponse> {
    const body: ChatRequest = {
      texto,
      contenidos,
      coleccion: this.COLECCION,
      conversation_id: this._conversationId(),
      operador: this.operador(),
      expediente: null,
      instruccionesSistema: this.resolveInstrucciones(),
      modelo: MODELO,
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
