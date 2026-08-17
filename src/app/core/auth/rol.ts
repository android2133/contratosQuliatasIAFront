export type Rol = 'admin' | 'operador';

export const ROL_STORAGE_KEY = 'app-rol';

export const RUTA_INICIAL: Record<Rol, string> = {
  admin: '/admin/knowledge-base',
  operador: '/operator/chat',
};

export function obtenerRolActivo(urlActual: string): Rol {
  const guardado = localStorage.getItem(ROL_STORAGE_KEY);
  if (guardado === 'admin' || guardado === 'operador') return guardado;
  return urlActual.startsWith('/operator') ? 'operador' : 'admin';
}
