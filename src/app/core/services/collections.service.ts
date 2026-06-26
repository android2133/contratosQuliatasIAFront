import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Collection,
  SignedUrlItem,
  SignedUrlResponse,
  UploadObjectResponse,
  UploadStep,
  VectorDocument,
} from '../models/collection.model';
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
  //  API — Crear colección
  // ─────────────────────────────────────────────────────────────────────────

  createCollection(name: string): Observable<void> {
    return this.http
      .post<void>(`${environment.wsVector}/coleccion/crear`, { coleccion: name })
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

  deleteCollection(id: string): void {
    this._collections.update((cols) => cols.filter((c) => c.id !== id));
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
  //  API — Listar documentos del expediente
  // ─────────────────────────────────────────────────────────────────────────

  deleteDocument(objectId: string, collection: string): Observable<void> {
    return this.http
      .delete<void>(`${environment.xcmBase}/xccm-spring/object/${objectId}`)
      .pipe(
        switchMap(() =>
          this.http.post<void>(`${environment.wsVector}/documentos/borrar`, {
            id: objectId,
            coleccion: collection,
          }),
        ),
      );
  }

  getDocumentsByCollection(coleccion: string): Observable<VectorDocument[]> {
    return this.http
      .post<VectorDocument[]>(`${environment.wsVector}/documentos/obtener`, {
        id: '',
        coleccion,
      });
  }

  getDocuments(expedienteId: string, rutaBase: string): Observable<SignedUrlItem[]> {
    return this.http
      .post<SignedUrlResponse>(
        `${environment.xcmBase}/xccm-spring/object/get-signed-urls`,
        { idRegExp: expedienteId, rutaBase },
      )
      .pipe(map((res) => res.data ?? []));
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Pipeline secuencial — 4 pasos
  //  Paso 1: Subir archivo a WebContent
  //  Paso 2: Obtener URL firmada de Google Cloud
  //  Paso 3: Vectorizar en wsVector
  //  Paso 4: Completado
  // ─────────────────────────────────────────────────────────────────────────

  uploadAndIndex(file: File, cfg: KnowledgeBaseConfig): Observable<UploadStep> {
    return new Observable<UploadStep>((subscriber) => {
      subscriber.next('uploading');

      const pipeline = this.uploadDocument(file, cfg).pipe(

        // ── Paso 2: Obtener URL firmada ──────────────────────────────────
        tap(() => subscriber.next('signed-url')),
        switchMap((uploadResult) =>
          this.getSignedUrl(cfg).pipe(
            map((url) => ({ uploadResult, url })),
          ),
        ),

        // ── Paso 3: Vectorizar ───────────────────────────────────────────
        tap(() => subscriber.next('vectorizing')),
        switchMap(({ uploadResult, url }) =>
          this.vectorize(file, cfg, uploadResult.objectId, url),
        ),
      );

      const sub = pipeline.subscribe({
        next: () => {
          subscriber.next('done');
          this.incrementDocCount(cfg.collection);
          subscriber.complete();
        },
        error: (err: Error) => subscriber.error(err),
      });

      return () => sub.unsubscribe();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Métodos privados de API
  // ─────────────────────────────────────────────────────────────────────────

  private uploadDocument(file: File, cfg: KnowledgeBaseConfig): Observable<UploadObjectResponse> {
    const ext = file.name.split('.').pop() ?? '';
    const nameNoExt = file.name.replace(/\.[^/.]+$/, '');
    const today = new Date().toISOString().split('T')[0];

    const metadata = {
      idFolder: cfg.folderId,
      idRegExp: cfg.expedienteId,
      idTipoDocumental: cfg.tipoDocumentalId,
      name: nameNoExt,
      ext,
      properties: {
        nombre: nameNoExt,
        fecha_creacion: today,
      },
    };

    const form = new FormData();
    form.append('json', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    return this.http.post<UploadObjectResponse>(
      `${environment.xcmBase}/xccm-spring/object`,
      form,
    );
  }

  private getSignedUrl(cfg: KnowledgeBaseConfig): Observable<string> {
    return this.http
      .post<SignedUrlResponse>(
        `${environment.xcmBase}/xccm-spring/object/get-signed-urls`,
        { idRegExp: cfg.expedienteId, rutaBase: cfg.rutaBase },
      )
      .pipe(
        map((res) => {
          const items = res.data ?? [];
          const match = items.find((i) => i.idTipoDocumental === cfg.tipoDocumentalId);
          if (!match) throw new Error('URL firmada no encontrada para el tipo documental.');
          return match.url;
        }),
      );
  }

  private vectorize(
    file: File,
    cfg: KnowledgeBaseConfig,
    objectId: string,
    uri: string,
  ): Observable<unknown> {
    return this.http.post(`${environment.wsVector}/documentos/insertar`, {
      coleccion: cfg.collection,
      id: objectId ?? crypto.randomUUID(),
      mimetype: file.type || 'application/pdf',
      nombreArchivo: file.name,
      uri,
      expediente: cfg.expediente,
    });
  }
}
