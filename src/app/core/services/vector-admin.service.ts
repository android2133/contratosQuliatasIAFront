import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InsertarDocumentoPayload {
  uri: string;
  mimetype: string;
  nombreArchivo: string;
  coleccion: string;
  web: boolean;
  id: string;
  expediente: string;
}

export interface DocumentoRefPayload {
  id: string;
  coleccion: string;
}

/**
 * Cliente 1:1 de "02 - Administración vectorial" (admin_base_url).
 * Los shapes de respuesta no vienen documentados en la colección de Postman
 * (solo los requests), así que todo se tipa como `unknown` — el componente
 * consumidor decide cómo interpretarlos y siempre expone el JSON crudo.
 */
@Injectable({ providedIn: 'root' })
export class VectorAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.vectorAdminBaseUrl;

  health(): Observable<string> {
    return this.http.get(`${this.base}/`, { responseType: 'text' });
  }

  listarColecciones(): Observable<unknown> {
    return this.http.get(`${this.base}/coleccion/obtener`);
  }

  crearColeccion(coleccion: string): Observable<unknown> {
    return this.http.post(`${this.base}/coleccion/crear`, { coleccion });
  }

  borrarColeccion(coleccion: string): Observable<unknown> {
    return this.http.post(`${this.base}/coleccion/borrar`, { coleccion });
  }

  insertarDocumento(payload: InsertarDocumentoPayload): Observable<unknown> {
    return this.http.post(`${this.base}/documentos/insertar`, payload);
  }

  obtenerDocumento(ref: DocumentoRefPayload): Observable<unknown> {
    return this.http.post(`${this.base}/documentos/obtener-documento`, ref);
  }

  borrarDocumento(ref: DocumentoRefPayload): Observable<unknown> {
    return this.http.post(`${this.base}/documentos/borrar`, ref);
  }
}
