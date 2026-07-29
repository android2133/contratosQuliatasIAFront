import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthTokenService } from '../services/auth-token.service';

/** Agrega el Bearer token de servicio a las llamadas contra {@link environment.conversationBaseUrl}. */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const isConversationRequest = req.url.startsWith(environment.conversationBaseUrl);
  const isAuthRequest = req.url.includes('/auth/token');

  if (!isConversationRequest || isAuthRequest) {
    return next(req);
  }

  const authTokenService = inject(AuthTokenService);
  const withToken = (forceRefresh: boolean) =>
    authTokenService
      .getToken(forceRefresh)
      .pipe(
        switchMap((token) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })),
        ),
      );

  return withToken(false).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        return withToken(true);
      }
      return throwError(() => err);
    }),
  );
};
