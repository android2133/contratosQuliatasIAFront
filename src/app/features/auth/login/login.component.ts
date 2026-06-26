import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideMail, LucideLock, LucideArrowRight, LucideEye, LucideEyeOff,
  LucideSparkles, LucideAlertCircle
} from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    LucideMail, LucideLock, LucideArrowRight, LucideEye, LucideEyeOff,
    LucideSparkles, LucideAlertCircle,
  ],
  template: `
    <div class="min-h-screen flex">

      <!-- Left panel — branding -->
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden" style="background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 50%, var(--color-tertiary) 100%)">
        <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent-500/10 blur-3xl"></div>
        <div class="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"></div>

        <div class="relative z-10 flex flex-col justify-between p-12 w-full">
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25)">
              <svg lucideSparkles class="w-5 h-5 text-white"></svg>
            </div>
            <span class="text-white font-bold text-xl" style="font-family: var(--font-family)">Contratos</span>
          </div>

          <!-- Center content -->
          <div class="space-y-6">
            <div class="space-y-3">
              <h1 class="text-4xl font-bold text-white leading-tight">
                Inteligencia aplicada<br>
                <span class="text-accent-300">a tu conocimiento</span>
              </h1>
              <p class="text-slate-300 text-lg leading-relaxed max-w-sm">
                Gestiona, indexa y consulta tu base de conocimientos empresarial con IA de última generación.
              </p>
            </div>
            <div class="space-y-3">
              @for (feat of features; track feat) {
                <div class="flex items-center gap-3">
                  <div class="w-5 h-5 rounded-full bg-accent-500/30 border border-accent-400/50 flex items-center justify-center shrink-0">
                    <div class="w-1.5 h-1.5 rounded-full bg-accent-400"></div>
                  </div>
                  <span class="text-slate-300 text-sm">{{ feat }}</span>
                </div>
              }
            </div>
          </div>

          <p class="text-slate-500 text-xs">© 2026 Contratos — Plataforma Empresarial</p>
        </div>
      </div>

      <!-- Right panel — form -->
      <div class="flex-1 flex items-center justify-center p-6 sm:p-12" style="background: var(--color-primary-subtle)">
        <div class="w-full max-w-md space-y-8 bg-white rounded-2xl p-8 shadow-md" style="border-radius: var(--radius-xl); box-shadow: var(--shadow-md)">

          <!-- Mobile logo -->
          <div class="flex items-center gap-2 lg:hidden">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: var(--color-primary)">
              <svg lucideSparkles class="w-4 h-4 text-white"></svg>
            </div>
            <span class="font-bold" style="color: var(--color-text-primary)">Contratos Qualitas IA</span>
          </div>

          <div class="space-y-2">
            <h2 class="text-2xl font-bold" style="color: var(--color-text-primary)">Bienvenido de vuelta</h2>
            <p class="text-sm" style="color: var(--color-text-secondary)">Ingresa tus credenciales para continuar</p>
          </div>

          <!-- Demo credentials chips -->
          <div class="flex flex-wrap gap-2">
            @for (cred of demoCredentials; track cred.label) {
              <button type="button" (click)="fillCredentials(cred)"
                class="text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-200
                       hover:border-accent-400 hover:text-accent-600 hover:bg-accent-50"
                style="border-color: var(--color-border); color: var(--color-text-secondary)">
                Demo: {{ cred.label }}
              </button>
            }
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

            @if (errorMsg()) {
              <div class="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200">
                <svg lucideAlertCircle class="w-4 h-4 text-red-500 shrink-0"></svg>
                <p class="text-sm text-red-700">{{ errorMsg() }}</p>
              </div>
            }

            <!-- Email -->
            <div class="space-y-1.5">
              <label class="text-sm font-medium" style="color: var(--color-text-primary)" for="email">Correo electrónico</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <svg lucideMail class="w-4 h-4 text-slate-400"></svg>
                </div>
                <input id="email" type="email" formControlName="email"
                  placeholder="tu@empresa.com" autocomplete="email"
                  class="input-base pl-10"
                  [class.border-red-300]="emailInvalid" />
              </div>
              @if (emailInvalid) {
                <p class="text-xs text-red-500">Ingresa un correo válido</p>
              }
            </div>

            <!-- Password -->
            <div class="space-y-1.5">
              <label class="text-sm font-medium" style="color: var(--color-text-primary)" for="password">Contraseña</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <svg lucideLock class="w-4 h-4 text-slate-400"></svg>
                </div>
                <input id="password" [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password" placeholder="••••••••" autocomplete="current-password"
                  class="input-base pl-10 pr-10" />
                <button type="button" (click)="showPassword.set(!showPassword())"
                  class="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                  @if (showPassword()) {
                    <svg lucideEyeOff class="w-4 h-4"></svg>
                  } @else {
                    <svg lucideEye class="w-4 h-4"></svg>
                  }
                </button>
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" [disabled]="loading() || form.invalid" class="login-form__submit-btn">
              @if (loading()) {
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Iniciando sesión...</span>
              } @else {
                <span>Iniciar sesión</span>
                <svg lucideArrowRight class="w-4 h-4"></svg>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly errorMsg = signal('');
  readonly showPassword = signal(false);

  readonly features = [
    'Indexación inteligente de documentos con IA',
    'Chat conversacional basado en tu base de conocimientos',
    'Generación automática de contratos y documentos',
    'Control de accesos por rol y equipo',
  ];

  readonly demoCredentials = [
    { label: 'Admin', email: 'admin@test.com', password: 'admin123' },
    { label: 'Operador', email: 'operador@test.com', password: 'oper123' },
  ];

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  get emailInvalid(): boolean {
    const ctrl = this.form.get('email');
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  fillCredentials(cred: { email: string; password: string }): void {
    this.form.patchValue(cred);
    this.errorMsg.set('');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMsg.set('');

    setTimeout(() => {
      const result = this.auth.login({
        email: this.form.value.email!,
        password: this.form.value.password!,
      });
      if (!result.success) this.errorMsg.set(result.error ?? 'Error desconocido');
      this.loading.set(false);
    }, 800);
  }
}
