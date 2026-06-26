import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { XcmAuthService } from './xcm-auth.service';
import { environment } from '../../../environments/environment';

export const xcmAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const xcmAuth = inject(XcmAuthService);
  const token = xcmAuth.token();

  const isXcmRequest = req.url.startsWith(environment.xcmBase);

  if (token && isXcmRequest) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(authReq);
  }

  return next(req);
};
