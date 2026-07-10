export type AuditoriaAccion = 'crear' | 'eliminar' | 'editar';
export type AuditoriaResultado = 'exito' | 'error';

export interface AuditoriaEntrada {
  id: string;
  adminId: string;
  adminNombre: string;
  adminEmail: string;
  pantalla: string;
  accion: AuditoriaAccion;
  elemento: string;
  detalleAntes?: string;
  detalleDespues?: string;
  resultado: AuditoriaResultado;
  mensajeError?: string;
  fecha: Date;
}
