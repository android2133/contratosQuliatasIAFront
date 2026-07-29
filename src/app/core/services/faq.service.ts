import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PreguntaFrecuente } from '../models/faq.model';

interface PreguntasFrecuentesResponse {
  preguntas_frecuentes: PreguntaFrecuente[];
}

@Injectable({ providedIn: 'root' })
export class FaqService {
  private readonly http = inject(HttpClient);

  obtener(): Observable<PreguntaFrecuente[]> {
    return this.http
      .get<PreguntasFrecuentesResponse>(`${environment.conversationBaseUrl}/preguntas-frecuentes/`)
      .pipe(map((res) => res.preguntas_frecuentes));
  }
}
