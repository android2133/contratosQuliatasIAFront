import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ArchivoItem, Collection, ListarArchivosResponse, SubirArchivoResponse, UploadStep } from '../models/collection.model';
import { KnowledgeBaseConfig } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private readonly http = inject(HttpClient);

  // ── Estado reactivo de colecciones ────────────────────────────────────────
  private readonly _collections = signal<Collection[]>([
    { id: crypto.randomUUID(), name: 'Contratos Vigentes', documentCount: 12, createdAt: new Date('2025-05-10'), status: 'active' },
    { id: crypto.randomUUID(), name: 'Políticas Internas', documentCount: 7, createdAt: new Date('2025-06-01'), status: 'active' },
  ]);

  readonly collections = this._collections.asReadonly();

  // ─────────────────────────────────────────────────────────────────────────
  //  API — Colecciones vectoriales (admin_base_url)
  // ─────────────────────────────────────────────────────────────────────────

  createCollection(name: string): Observable<void> {
    return this.http
      .post<void>(`${environment.vectorAdminBaseUrl}/coleccion/crear`, { coleccion: name })
      .pipe(
        tap(() => {
          const col: Collection = {
            id: crypto.randomUUID(),
            name,
            documentCount: 0,
            createdAt: new Date(),
            status: 'active',
          };
          this._collections.update((prev) => [col, ...prev]);
        }),
      );
  }

  deleteCollection(id: string): Observable<void> {
    const nombre = this._collections().find((c) => c.id === id)?.name;
    const borrar$ = nombre
      ? this.http.post<void>(`${environment.vectorAdminBaseUrl}/coleccion/borrar`, { coleccion: nombre })
      : new Observable<void>((s) => { s.next(); s.complete(); });

    return borrar$.pipe(
      tap(() => this._collections.update((cols) => cols.filter((c) => c.id !== id))),
    );
  }

  incrementDocCount(collectionName: string): void {
    this._collections.update((cols) =>
      cols.map((c) =>
        c.name === collectionName
          ? { ...c, documentCount: c.documentCount + 1 }
          : c,
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  API — Archivos (files_base_url)
  // ─────────────────────────────────────────────────────────────────────────

  deleteDocument(objectId: string, coleccion: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.filesBaseUrl}/archivos/${objectId}?eliminar_vectores=true&coleccion=${encodeURIComponent(coleccion)}&id_documento=${encodeURIComponent(objectId)}`,
    );
  }

  getDocuments(coleccion: string, expediente: string): Observable<ArchivoItem[]> {
    const params = new URLSearchParams();
    if (coleccion) params.set('coleccion', coleccion);
    if (expediente) params.set('expediente', expediente);

    return this.http
      .get<ListarArchivosResponse>(`${environment.filesBaseUrl}/archivos?${params.toString()}`)
      .pipe(map((res) => res.archivos ?? []));
  }

  contentUrl(id: string, descargar = false): string {
    return `${environment.filesBaseUrl}/archivos/${id}/contenido${descargar ? '?descargar=true' : ''}`;
  }

  // Reclasifica un archivo ya subido (antes de que el backend guardara
  // coleccion/expediente en la carga) sin necesidad de volver a subirlo.
  reclassify(id: string, coleccion: string, expediente: string): Observable<void> {
    const form = new FormData();
    form.append('coleccion', coleccion);
    form.append('expediente', expediente);
    return this.http.put<void>(`${environment.filesBaseUrl}/archivos/${id}`, form);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Subida + vectorización — 1 sola llamada (archivo público, sin pasos intermedios)
  // ─────────────────────────────────────────────────────────────────────────

  uploadAndIndex(file: File, cfg: KnowledgeBaseConfig): Observable<{ step: UploadStep; archivo?: ArchivoItem }> {
    return new Observable<{ step: UploadStep; archivo?: ArchivoItem }>((subscriber) => {
      subscriber.next({ step: 'uploading' });

      const form = new FormData();
      form.append('archivo', file);
      form.append('vectorizar', 'true');
      form.append('coleccion', cfg.collection);
      form.append('expediente', cfg.expediente);

      subscriber.next({ step: 'vectorizing' });

      const sub = this.http
        .post<SubirArchivoResponse>(`${environment.filesBaseUrl}/archivos`, form)
        .subscribe({
          next: (res) => {
            subscriber.next({ step: 'done', archivo: res.archivo });
            this.incrementDocCount(cfg.collection);
            subscriber.complete();
          },
          error: (err: Error) => subscriber.error(err),
        });

      return () => sub.unsubscribe();
    });
  }
}
