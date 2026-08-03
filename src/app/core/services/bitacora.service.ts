import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConsultarBitacoraFiltros, ConsultarBitacoraRespuesta, RegistrarBitacoraEvento } from '../models/bitacora.model';

// La app no tiene sesión/login de usuario todavía: se usa una identidad fija
// para toda acción registrada hasta que exista autenticación real.
const USUARIO_ACTUAL = {
  usuario_id: 'admin-web',
  usuario_nombre: 'Administrador',
  usuario_email: '',
};

@Injectable({ providedIn: 'root' })
export class BitacoraService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.bitacoraBaseUrl}/bitacora`;

  /**
   * Registra un evento de auditoría. Nunca debe romper el flujo principal de
   * la acción que lo dispara, así que los errores de red se silencian aquí.
   */
  registrar(evento: RegistrarBitacoraEvento): Observable<unknown> {
    return this.http.post(this.base, { ...USUARIO_ACTUAL, ...evento }).pipe(
      catchError(() => of(null)),
    );
  }

  consultar(filtros: ConsultarBitacoraFiltros): Observable<ConsultarBitacoraRespuesta> {
    let params = new HttpParams();
    if (filtros.expediente) params = params.set('expediente', filtros.expediente);
    if (filtros.accion) params = params.set('accion', filtros.accion);
    if (filtros.exitoso !== undefined) params = params.set('exitoso', String(filtros.exitoso));
    params = params.set('limit', String(filtros.limit ?? 20));

    return this.http.get<ConsultarBitacoraRespuesta>(this.base, { params });
  }
}
