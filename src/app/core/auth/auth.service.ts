import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Credentials, MOCK_USERS, User } from '../models/user.model';
import { XcmAuthService } from './xcm-auth.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly SESSION_KEY = 'knowledgeai_session';
  private readonly router = inject(Router);
  private readonly xcmAuth = inject(XcmAuthService);

  private _currentUser = signal<User | null>(this.loadSession());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');
  readonly isOperador = computed(() => this._currentUser()?.role === 'operador');

  login(credentials: Credentials): { success: boolean; error?: string } {
    const found = MOCK_USERS.find(
      (u) => u.email === credentials.email && u.password === credentials.password,
    );

    if (!found) {
      return { success: false, error: 'Credenciales incorrectas. Intenta de nuevo.' };
    }

    const { password: _, ...user } = found;
    this._currentUser.set(user);
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));

    // Login automático a WebContent al entrar como admin
    if (user.role === 'admin') {
      this.xcmAuth.loginToWebcontent().subscribe();
    }

    const redirectUrl = user.role === 'admin' ? '/admin/knowledge-base' : '/operator/chat';
    this.router.navigateByUrl(redirectUrl);
    return { success: true };
  }

  logout(): void {
    this._currentUser.set(null);
    sessionStorage.removeItem(this.SESSION_KEY);
    this.xcmAuth.clearToken();
    this.router.navigateByUrl('/login');
  }

  private loadSession(): User | null {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
