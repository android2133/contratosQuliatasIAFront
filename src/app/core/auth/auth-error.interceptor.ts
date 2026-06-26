import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { XcmAuthService } from './xcm-auth.service';
import { environment } from '../../../environments/environment';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const xcmAuth = inject(XcmAuthService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 403) {
        // Re-login silencioso y reintento de la request original
        return xcmAuth.loginToWebcontent().pipe(
          switchMap(() => {
            const newToken = xcmAuth.token();
            const isXcmReq = req.url.startsWith(environment.xcmBase);
            const retryReq = newToken && isXcmReq
              ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
              : req;
            return next(retryReq);
          }),
          catchError(() => {
            // Si el re-login falla, ahí sí mandamos al login
            xcmAuth.clearToken();
            sessionStorage.removeItem('knowledgeai_session');
            router.navigateByUrl('/login');
            return throwError(() => err);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
