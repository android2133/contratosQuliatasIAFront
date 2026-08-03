export interface RegistrarBitacoraPayload {
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  expediente: string;
  pantalla: string;
  documento_id: string;
  documento_nombre: string;
  accion: string;
  exitoso: boolean;
}

// Lo que cada vista provee al registrar un evento — la identidad del usuario
// la completa BitacoraService (la app aún no tiene login).
export type RegistrarBitacoraEvento = Omit<RegistrarBitacoraPayload, 'usuario_id' | 'usuario_nombre' | 'usuario_email'>;

export interface ConsultarBitacoraFiltros {
  expediente?: string;
  accion?: string;
  exitoso?: boolean;
  limit?: number;
}

export interface ConsultarBitacoraRespuesta {
  registros: BitacoraRegistro[];
  total: number;
}

// Shape confirmado contra el backend real: GET /bitacora responde
// { registros: BitacoraRegistro[], total: number }.
export interface BitacoraRegistro {
  id?: string;
  correlation_id?: string;
  usuario_id?: string;
  usuario_nombre?: string;
  usuario_email?: string;
  expediente?: string;
  pantalla?: string;
  documento_id?: string;
  documento_nombre?: string;
  accion?: string;
  exitoso?: boolean;
  fecha_hora?: string;
  codigo_estado?: number | null;
  mensaje_error?: string | null;
  origen?: string;
  metadatos?: Record<string, unknown>;
  [key: string]: unknown;
}
