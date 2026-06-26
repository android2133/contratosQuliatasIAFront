import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';

interface XcmLoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    changePassword: boolean;
  };
}

const SESSION_KEY = 'xcm_token';
const XCM_USER = 'admin1';
const XCM_PASS = 'Hola12345@';

@Injectable({ providedIn: 'root' })
export class XcmAuthService {
  private readonly http = inject(HttpClient);

  private readonly _token = signal<string | null>(
    sessionStorage.getItem(SESSION_KEY),
  );

  readonly token = this._token.asReadonly();

  loginToWebcontent() {
    return this.http
      .post<XcmLoginResponse>(
        `${environment.xcmBase}/xccm-spring/auth/login`,
        { username: XCM_USER, password: XCM_PASS },
      )
      .pipe(
        tap((res) => {
          const tok = res?.data?.token ?? null;
          this._token.set(tok);
          if (tok) sessionStorage.setItem(SESSION_KEY, tok);
        }),
        catchError(() => EMPTY),
      );
  }

  clearToken(): void {
    this._token.set(null);
    sessionStorage.removeItem(SESSION_KEY);
  }
}
