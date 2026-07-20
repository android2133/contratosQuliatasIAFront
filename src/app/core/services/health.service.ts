import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

export type HealthState = 'idle' | 'checking' | 'ok' | 'error';

export interface HealthCheckResult {
  key: string;
  name: string;
  baseUrl: string;
  state: HealthState;
  httpStatus?: number;
  message?: string;
  isLikelyCors: boolean;
  latencyMs?: number;
  checkedAt?: Date;
}

interface ServiceDef {
  key: string;
  name: string;
  baseUrl: string;
}

const TIMEOUT_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);

  readonly services: ServiceDef[] = [
    { key: 'files', name: 'Servicio de archivos', baseUrl: environment.filesBaseUrl },
    { key: 'vectorAdmin', name: 'Administración vectorial', baseUrl: environment.vectorAdminBaseUrl },
    { key: 'vectorSearch', name: 'Búsqueda vectorial', baseUrl: environment.vectorSearchBaseUrl },
    { key: 'conversation', name: 'Servicio conversacional', baseUrl: environment.conversationBaseUrl },
  ];

  check(def: ServiceDef): Observable<HealthCheckResult> {
    const started = performance.now();

    return this.http.get(`${def.baseUrl}/`, { responseType: 'text', observe: 'response' }).pipe(
      timeout(TIMEOUT_MS),
      map((res) => ({
        key: def.key,
        name: def.name,
        baseUrl: def.baseUrl,
        state: 'ok' as HealthState,
        httpStatus: res.status,
        message: (res.body ?? '').slice(0, 200) || 'OK',
        isLikelyCors: false,
        latencyMs: Math.round(performance.now() - started),
        checkedAt: new Date(),
      })),
      catchError((err: unknown) => {
        const latencyMs = Math.round(performance.now() - started);

        if (err instanceof HttpErrorResponse) {
          // status 0 con un error de red genérico casi siempre es CORS o el
          // servidor caído/URL incorrecta — el navegador no distingue ambos casos.
          const isLikelyCors = err.status === 0;
          return of({
            key: def.key,
            name: def.name,
            baseUrl: def.baseUrl,
            state: 'error' as HealthState,
            httpStatus: err.status,
            message: isLikelyCors
              ? 'Sin respuesta (status 0). Probable bloqueo CORS, servidor caído o URL incorrecta.'
              : (err.error?.toString?.() || err.message || err.statusText || 'Error desconocido'),
            isLikelyCors,
            latencyMs,
            checkedAt: new Date(),
          });
        }

        return of({
          key: def.key,
          name: def.name,
          baseUrl: def.baseUrl,
          state: 'error' as HealthState,
          message: err instanceof Error ? err.message : 'Tiempo de espera agotado',
          isLikelyCors: false,
          latencyMs,
          checkedAt: new Date(),
        });
      }),
    );
  }
}
