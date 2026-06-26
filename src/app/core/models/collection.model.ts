// ── Entidades del dominio ──────────────────────────────────────────────────

export type CollectionStatus = 'active' | 'indexing' | 'error';

export interface Collection {
  id: string;
  name: string;
  documentCount: number;
  createdAt: Date;
  status: CollectionStatus;
}

// ── Respuestas de la API documental ──────────────────────────────────────────

export interface ExpedienteResponse {
  id: string;
  ruta: string;
  idFolder: string;
  idTipoExpediente: string;
}

export interface UploadObjectResponse {
  objectId: string;
  [key: string]: unknown;
}

export interface SignedUrlItem {
  objectId: string;
  archivo: string;
  nombre: string;
  extension: string;
  url: string;
  bucketId: string;
  carpeta: string;
  rutaGSC: string;
  idTipoDocumental: string;
  labelTipoDocumental: string;
  nombreTipoDocumental: string;
  metadata: {
    fecha_creacion?: string;
    nombre?: string;
    [key: string]: unknown;
  };
}

export interface SignedUrlResponse {
  success: boolean;
  message: string;
  data: SignedUrlItem[];
}

export interface VectorDocument {
  id: string;
  nombreArchivo?: string;
  nombre?: string;
  mimetype?: string;
  coleccion?: string;
  [key: string]: unknown;
}

export interface VectorizeRequest {
  coleccion: string;
  id: string;
  mimetype: string;
  nombreArchivo: string;
  uri: string;
}

// ── Pipeline de subida ────────────────────────────────────────────────────────

export type UploadStep =
  | 'idle'
  | 'uploading'    // Paso 1 — Subiendo a repositorio documental
  | 'signed-url'   // Paso 2 — Generando URL firmada de Google Cloud
  | 'vectorizing'  // Paso 3 — Indexando y vectorizando
  | 'done'         // Completado
  | 'error';       // Error en cualquier paso

export interface UploadTask {
  id: string;
  fileName: string;
  fileSize: number;
  step: UploadStep;
  error?: string;
}

export const UPLOAD_STEPS: { key: UploadStep; label: string }[] = [
  { key: 'uploading',   label: 'Subiendo a Repositorio Documental...' },
  { key: 'signed-url',  label: 'Generando URL Firmada de Google Cloud...' },
  { key: 'vectorizing', label: 'Indexando y Vectorizando en wsVector...' },
  { key: 'done',        label: 'Documento indexado exitosamente' },
];
