export type DocumentStatus = 'processing' | 'indexed' | 'error';

export interface KnowledgeBaseConfig {
  title: string;
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
}
