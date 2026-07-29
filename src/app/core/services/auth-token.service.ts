import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AuthTokenResponse {
  codigo: number;
  token_type: string;
  expires_in: number;
  access_token: string;
}

const EXPIRY_BUFFER_MS = 30_000;

/** Obtiene y cachea el Bearer token de servicio para {@link environment.conversationBaseUrl}. */
@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly http = inject(HttpClient);

  private cachedToken: string | null = null;
  private expiresAt = 0;
  private inFlight: Observable<string> | null = null;

  getToken(forceRefresh = false): Observable<string> {
    if (!forceRefresh && this.cachedToken && Date.now() < this.expiresAt) {
      return of(this.cachedToken);
    }

    if (forceRefresh) {
      this.cachedToken = null;
    }

    if (!this.inFlight) {
      this.inFlight = this.http
        .post<AuthTokenResponse>(`${environment.conversationBaseUrl}/auth/token`, {
          usuario: environment.authUsuario,
          contrasena: environment.authContrasena,
        })
        .pipe(
          tap((res) => {
            this.cachedToken = res.access_token;
            // expires_in === -1 indica que el token no expira.
            this.expiresAt = res.expires_in < 0
              ? Infinity
              : Date.now() + res.expires_in * 1000 - EXPIRY_BUFFER_MS;
          }),
          map((res) => res.access_token),
          finalize(() => (this.inFlight = null)),
          shareReplay(1),
        );
    }

    return this.inFlight;
  }
}
