import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MetricasGlobales, MetricasOperador } from '../models/metrics.model';

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
}
