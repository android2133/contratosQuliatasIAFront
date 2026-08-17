import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol, RUTA_INICIAL, obtenerRolActivo } from './rol';

export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const rolRequerido = route.data['rol'] as Rol;
  const rolActivo = obtenerRolActivo(router.url);

  if (rolActivo !== rolRequerido) {
    return router.parseUrl(RUTA_INICIAL[rolActivo]);
  }

  return true;
};
