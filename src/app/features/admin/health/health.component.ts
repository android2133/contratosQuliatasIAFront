import { Component, OnInit, inject, signal, computed } from '@angular/core';
import {
  LucideRefreshCw, LucideCircleCheck, LucideCircleX, LucideCircleAlert,
  LucideClock, LucideLink,
} from '@lucide/angular';
import { HealthCheckResult, HealthService } from '../../../core/services/health.service';

@Component({
  selector: 'app-health',
  imports: [
    LucideRefreshCw, LucideCircleCheck, LucideCircleX, LucideCircleAlert,
    LucideClock, LucideLink,
  ],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="inbox-page">

        <!-- ── Encabezado ── -->
        <div class="inbox-page__header">
          <div>
            <h1 class="inbox-page__title">Estado de servicios</h1>
            <p class="inbox-page__subtitle">
              Prueba de conectividad (health check) contra los 4 servicios de la colección "Agentes Webcontent - GCP".
            </p>
          </div>
          <button (click)="checkAll()" [disabled]="anyChecking()" class="btn-clear">
            <svg lucideRefreshCw class="w-4 h-4" [class.animate-spin]="anyChecking()"></svg>
            Probar todos
          </button>
        </div>

        @if (hasCorsIssue()) {
          <div class="flex items-start gap-3 rounded-xl px-4 py-3"
            style="background: var(--color-warning-light); border: 1px solid rgba(245,158,11,.35)">
            <svg lucideCircleAlert class="w-5 h-5 shrink-0 mt-0.5" style="color: #92400e"></svg>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium" style="color: #92400e">Posible bloqueo por CORS</p>
              <p class="text-xs mt-0.5" style="color: #92400e">
                Un status 0 sin cuerpo de respuesta casi siempre significa que el navegador bloqueó la
                respuesta por falta de cabeceras <code>Access-Control-Allow-Origin</code> en el servidor,
                aunque también puede ser que el servicio esté caído o la URL sea incorrecta. Revisa la
                pestaña Network de las herramientas de desarrollador para confirmar.
              </p>
            </div>
          </div>
        }

        <!-- ── Tarjetas de servicio ── -->
        <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))">
          @for (r of results(); track r.key) {
            <div class="card" style="display: flex; flex-direction: column; gap: .75rem">

              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-primary)">
                    {{ r.name }}
                  </h4>
                  <p class="flex items-center gap-1" style="font-size: .68rem; color: var(--color-text-muted); margin-top: .2rem; word-break: break-all">
                    <svg lucideLink class="w-3 h-3 shrink-0"></svg>
                    {{ r.baseUrl }}
                  </p>
                </div>

                @if (r.state === 'checking') {
                  <span class="det-badge det-badge--neutral">
                    <svg lucideRefreshCw class="w-3 h-3 animate-spin"></svg>
                    Probando…
                  </span>
                }
                @if (r.state === 'ok') {
                  <span class="det-badge det-badge--success">
                    <svg lucideCircleCheck class="w-3 h-3"></svg>
                    OK
                  </span>
                }
                @if (r.state === 'error') {
                  <span class="det-badge det-badge--danger">
                    <svg lucideCircleX class="w-3 h-3"></svg>
                    Error
                  </span>
                }
                @if (r.state === 'idle') {
                  <span class="det-badge det-badge--neutral">
                    <span class="det-badge__dot"></span>
                    Sin probar
                  </span>
                }
              </div>

              @if (r.state === 'ok' || r.state === 'error') {
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1" style="font-size: .68rem; color: var(--color-text-secondary)">
                  @if (r.httpStatus !== undefined) {
                    <span>HTTP {{ r.httpStatus }}</span>
                  }
                  @if (r.latencyMs !== undefined) {
                    <span class="flex items-center gap-1">
                      <svg lucideClock class="w-3 h-3"></svg>
                      {{ r.latencyMs }} ms
                    </span>
                  }
                </div>
                <p style="font-size: var(--font-size-xs); line-height: 1.5; color: var(--color-text-secondary); word-break: break-word">
                  {{ r.message }}
                </p>
              }

              <button (click)="checkOne(r.key)" [disabled]="r.state === 'checking'"
                class="btn-clear" style="width: 100%; margin-top: auto">
                <svg lucideRefreshCw class="w-3.5 h-3.5" [class.animate-spin]="r.state === 'checking'"></svg>
                Probar de nuevo
              </button>
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class HealthComponent implements OnInit {
  private readonly svc = inject(HealthService);

  readonly results = signal<HealthCheckResult[]>(
    this.svc.services.map((s) => ({
      key: s.key,
      name: s.name,
      baseUrl: s.baseUrl,
      state: 'idle',
      isLikelyCors: false,
    })),
  );

  readonly anyChecking = signal(false);
  readonly hasCorsIssue = computed(() => this.results().some((r) => r.isLikelyCors));

  ngOnInit(): void {
    this.checkAll();
  }

  checkAll(): void {
    this.anyChecking.set(true);
    this.svc.services.forEach((s) => this.runCheck(s.key));
  }

  checkOne(key: string): void {
    this.runCheck(key);
  }

  private runCheck(key: string): void {
    const def = this.svc.services.find((s) => s.key === key);
    if (!def) return;

    this.updateResult(key, { state: 'checking' });

    this.svc.check(def).subscribe((result) => {
      this.updateResult(key, result);
      if (this.svc.services.every((s) => this.results().find((r) => r.key === s.key)?.state !== 'checking')) {
        this.anyChecking.set(false);
      }
    });
  }

  private updateResult(key: string, patch: Partial<HealthCheckResult>): void {
    this.results.update((list) =>
      list.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }
}
