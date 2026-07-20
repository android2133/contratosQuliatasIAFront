// ── Entidades del dominio ──────────────────────────────────────────────────

export type CollectionStatus = 'active' | 'indexing' | 'error';

export interface Collection {
  id: string;
  name: string;
  documentCount: number;
  createdAt: Date;
  status: CollectionStatus;
}

// ── Respuestas del servicio de archivos (files_base_url) ───────────────────
// Shape real confirmado contra el backend (GET /archivos y POST /archivos).
// GET /archivos admite filtrar server-side con ?coleccion=&expediente=
// (desplegado en agentes-files-00003-kks). coleccion/expediente/id_documento
// se guardan desde la carga; los archivos previos a ese cambio pueden
// reclasificarse sin volver a subirlos vía CollectionsService.reclassify().

export interface ArchivoItem {
  id: string;
  nombre: string;
  content_type: string;
  size: number;
  sha256?: string;
  uri: string;
  created_at: string;
  updated_at?: string;
  coleccion?: string;
  expediente?: string;
  id_documento?: string;
}

export interface ListarArchivosResponse {
  archivos: ArchivoItem[];
}

export interface SubirArchivoResponse {
  archivo: ArchivoItem;
}

// ── Pipeline de subida ────────────────────────────────────────────────────────

export type UploadStep =
  | 'idle'
  | 'uploading'    // Paso 1 — Subiendo y vectorizando el archivo
  | 'vectorizing'  // Paso 2 — Esperando a que termine la vectorización
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
  { key: 'uploading',   label: 'Subiendo archivo...' },
  { key: 'vectorizing', label: 'Indexando y vectorizando...' },
  { key: 'done',        label: 'Documento indexado exitosamente' },
];
