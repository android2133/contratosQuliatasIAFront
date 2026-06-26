export type DocumentStatus = 'processing' | 'indexed' | 'error';

export interface KnowledgeBaseConfig {
  title: string;
  expedienteId: string;
  tipoDocumentalId: string;
  folderId: string;
  rutaBase: string;
  collection: string;
  expediente: string;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  status: DocumentStatus;
  uploadedAt: Date;
  url?: string;
  labelTipoDocumental?: string;
  chunks?: number;
  pages?: number;
}
