import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MetricasGlobales, MetricasOperador, VolumenConversacionesRango } from '../models/metrics.model';

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private readonly http = inject(HttpClient);

  obtenerGlobales(): Observable<MetricasGlobales> {
    return this.http.get<MetricasGlobales>(`${environment.conversationBaseUrl}/metricas-globales/`);
  }

  obtenerPorOperador(operador: string): Observable<MetricasOperador> {
    return this.http.post<MetricasOperador>(
      `${environment.conversationBaseUrl}/metricas-operador/`,
      { operador },
    );
  }

  obtenerVolumenConversaciones(fechaInicio: string, fechaFin: string): Observable<VolumenConversacionesRango> {
    const params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin);
    return this.http.get<VolumenConversacionesRango>(
      `${environment.conversationBaseUrl}/volumen-conversaciones/`,
      { params },
    );
  }
}
