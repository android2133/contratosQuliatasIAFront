import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InstruccionSistema } from '../models/instruccion-sistema.model';

@Injectable({ providedIn: 'root' })
export class InstruccionesSistemaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.instruccionesSistemaBaseUrl}/instrucciones`;

  listar(): Observable<InstruccionSistema[]> {
    return this.http.get<InstruccionSistema[]>(this.baseUrl);
  }

  crear(instruccionesSistema: string): Observable<InstruccionSistema> {
    return this.http.post<InstruccionSistema>(this.baseUrl, { instruccionesSistema });
  }

  actualizar(idinstruccionesSistema: number, nuevasInstrucciones: string): Observable<InstruccionSistema> {
    return this.http.put<InstruccionSistema>(this.baseUrl, { idInstruccion: idinstruccionesSistema, nuevasInstrucciones });
  }

  eliminar(idInstruccion: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${idInstruccion}`);
  }
}
