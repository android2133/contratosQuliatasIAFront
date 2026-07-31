import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Operador } from '../models/operador.model';
import { Conversacion } from '../models/conversacion.model';

interface OperadoresResponse {
  operadores: Operador[];
}

interface ConversacionesResponse {
  operador: string;
  conversaciones: Conversacion[];
}

@Injectable({ providedIn: 'root' })
export class OperadoresService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Operador[]> {
    return this.http
      .get<OperadoresResponse>(`${environment.conversationBaseUrl}/operadores`)
      .pipe(map((res) => res.operadores));
  }

  listarConversaciones(operador: string): Observable<Conversacion[]> {
    return this.http
      .get<ConversacionesResponse>(
        `${environment.conversationBaseUrl}/operadores/${encodeURIComponent(operador)}/conversaciones`,
      )
      .pipe(map((res) => res.conversaciones));
  }
}
