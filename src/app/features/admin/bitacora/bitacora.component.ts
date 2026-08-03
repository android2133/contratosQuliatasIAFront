import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  LucideRefreshCw, LucideSearch, LucideX, LucideCircleCheck,
  LucideCircleX, LucideTriangleAlert,
  LucideChevronLeft, LucideChevronRight, LucideChevronsLeft, LucideChevronsRight,
} from '@lucide/angular';
import { BitacoraService } from '../../../core/services/bitacora.service';
import { BitacoraRegistro } from '../../../core/models/bitacora.model';

const PAGE_SIZE = 10;
const OPCIONES_LIMITE = [10, 20, 50, 100];

@Component({
  selector: 'app-bitacora',
  imports: [
    FormsModule,
    LucideRefreshCw, LucideSearch, LucideX, LucideCircleCheck,
    LucideCircleX, LucideTriangleAlert,
    LucideChevronLeft, LucideChevronRight, LucideChevronsLeft, LucideChevronsRight,
  ],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="inbox-page">

        <!-- ── Encabezado ── -->
        <div class="inbox-page__header">
          <div>
            <h1 class="inbox-page__title">Bitácora de administración</h1>
            <p class="inbox-page__subtitle">
              @if (loading()) { Consultando registros… }
              @if (!loading() && !error()) {
                @if (total() > registros().length) {
                  {{ registros().length }} de {{ total() }} registros — sube el límite para ver más
                } @else {
                  {{ total() }} registros (GET /bitacora)
                }
              }
              @if (!loading() && error()) { No fue posible consultar la bitácora }
            </p>
          </div>
          <button (click)="cargar()" [disabled]="loading()" class="btn-clear">
            <svg lucideRefreshCw class="w-4 h-4" [class.animate-spin]="loading()"></svg>
            Refrescar
          </button>
        </div>

        @if (error()) {
          <div class="flex items-start gap-3 rounded-xl px-4 py-3"
            style="background: var(--color-danger-light); border: 1px solid rgba(239,68,68,.35)">
            <svg lucideTriangleAlert class="w-5 h-5 shrink-0 mt-0.5" style="color: var(--color-danger)"></svg>
            <p class="text-sm" style="color: var(--color-danger)">
              No fue posible cargar la bitácora. Intenta de nuevo más tarde.
            </p>
          </div>
        }

        <!-- ── Filtros ── -->
        <section class="filter-card">
          <p class="filter-card__label">Filtros</p>
          <div class="flex gap-3 flex-wrap items-center">
            <div class="filter-search-field" style="flex: 1; min-width: 200px">
              <svg lucideSearch class="filter-search-field__icon w-4 h-4"></svg>
              <input class="filter-input" type="text" placeholder="Buscar por expediente…"
                [(ngModel)]="filtros.expediente" (keydown.enter)="aplicarFiltros()" />
            </div>

            <select class="filter-select" style="width: auto; min-width: 160px" [(ngModel)]="filtros.accion">
              <option value="">Todas las acciones</option>
              <option value="CREAR">CREAR</option>
              <option value="ACTUALIZAR">ACTUALIZAR</option>
              <option value="ELIMINAR">ELIMINAR</option>
              <option value="VECTORIZAR">VECTORIZAR</option>
              <option value="DESCARGAR">DESCARGAR</option>
            </select>

            <select class="filter-select" style="width: auto; min-width: 140px" [(ngModel)]="filtros.exitoso">
              <option value="">Todos los resultados</option>
              <option value="true">Exitoso</option>
              <option value="false">Fallido</option>
            </select>

            <select class="filter-select" style="width: auto; min-width: 110px" [(ngModel)]="filtros.limit">
              @for (n of opcionesLimite; track n) {
                <option [ngValue]="n">Límite {{ n }}</option>
              }
            </select>

            <button (click)="aplicarFiltros()" [disabled]="loading()" class="btn-search">
              <svg lucideSearch class="w-4 h-4"></svg>
              Aplicar
            </button>

            @if (hayFiltrosActivos()) {
              <button (click)="limpiarFiltros()" class="btn-clear">
                <svg lucideX class="w-4 h-4"></svg>
                Limpiar
              </button>
            }
          </div>
        </section>

        <!-- ── Tabla ── -->
        <div class="table-card">
          <div class="table-card__scroll">
            <table class="inbox-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Expediente</th>
                  <th>Pantalla</th>
                  <th>Documento</th>
                  <th>Acción</th>
                  <th>Resultado</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (i of [1,2,3,4,5]; track i) {
                    <tr>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-20"></div></td>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-3/5"></div></td>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-3/5"></div></td>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-4/5"></div></td>
                      <td><div class="h-5 w-20 bg-slate-100 rounded-full animate-pulse"></div></td>
                      <td><div class="h-5 w-16 bg-slate-100 rounded-full animate-pulse"></div></td>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-3/5"></div></td>
                    </tr>
                  }
                }

                @if (!loading() && !error() && paginatedRegistros().length === 0) {
                  <tr>
                    <td colspan="7" class="inbox-table__state">
                      @if (hayFiltrosActivos()) {
                        Sin resultados para los filtros aplicados
                      } @else {
                        Aún no hay registros de bitácora
                      }
                    </td>
                  </tr>
                }

                @for (item of paginatedRegistros(); track $index) {
                  <tr>
                    <td style="color: var(--color-text-secondary); white-space: nowrap">
                      {{ fechaRegistro(item) }}
                    </td>
                    <td class="font-medium">{{ item.expediente || '—' }}</td>
                    <td>{{ item.pantalla || '—' }}</td>
                    <td>
                      <div class="min-w-0">
                        <div>{{ item.documento_nombre || '—' }}</div>
                        @if (item.documento_id) {
                          <div style="font-size: .68rem; color: var(--color-text-muted)">{{ item.documento_id }}</div>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="det-badge" [class]="accionBadgeClass(item.accion)">
                        <span class="det-badge__dot"></span>
                        {{ item.accion || '—' }}
                      </span>
                    </td>
                    <td>
                      @if (item.exitoso === true) {
                        <span class="det-badge det-badge--success">
                          <svg lucideCircleCheck class="w-3 h-3"></svg>
                          Exitoso
                        </span>
                      } @else if (item.exitoso === false) {
                        <span class="det-badge det-badge--danger">
                          <svg lucideCircleX class="w-3 h-3"></svg>
                          Fallido
                        </span>
                      } @else {
                        <span class="det-badge det-badge--neutral">
                          <span class="det-badge__dot"></span>
                          —
                        </span>
                      }
                    </td>
                    <td>
                      <div class="min-w-0">
                        <div>{{ item.usuario_nombre || '—' }}</div>
                        @if (item.usuario_email) {
                          <div style="font-size: .68rem; color: var(--color-text-muted)">{{ item.usuario_email }}</div>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (!loading() && !error() && registros().length > 0) {
            <div class="pagination">
              <span class="pagination__info">
                Mostrando {{ pageStart() }}–{{ pageEnd() }} de {{ registros().length }}
              </span>
              <div class="pagination__controls">
                <button class="pagination__btn" [disabled]="currentPage() === 1"
                  (click)="goToPage(1)" title="Primera página">
                  <svg lucideChevronsLeft class="w-3.5 h-3.5"></svg>
                </button>
                <button class="pagination__btn" [disabled]="currentPage() === 1"
                  (click)="prevPage()" title="Anterior">
                  <svg lucideChevronLeft class="w-3.5 h-3.5"></svg>
                </button>
                @for (p of visiblePages(); track p) {
                  <button class="pagination__btn"
                    [class.pagination__btn--active]="p === currentPage()"
                    (click)="goToPage(p)">{{ p }}</button>
                }
                <button class="pagination__btn" [disabled]="currentPage() === totalPages()"
                  (click)="nextPage()" title="Siguiente">
                  <svg lucideChevronRight class="w-3.5 h-3.5"></svg>
                </button>
                <button class="pagination__btn" [disabled]="currentPage() === totalPages()"
                  (click)="goToPage(totalPages())" title="Última página">
                  <svg lucideChevronsRight class="w-3.5 h-3.5"></svg>
                </button>
              </div>
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class BitacoraComponent implements OnInit {
  private readonly svc = inject(BitacoraService);

  readonly opcionesLimite = OPCIONES_LIMITE;

  filtros: { expediente: string; accion: string; exitoso: '' | 'true' | 'false'; limit: number } = {
    expediente: '',
    accion: '',
    exitoso: '',
    limit: 20,
  };

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly registros = signal<BitacoraRegistro[]>([]);
  readonly total = signal(0);

  readonly currentPage = signal(1);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.registros().length / PAGE_SIZE)),
  );
  readonly paginatedRegistros = computed(() =>
    this.registros().slice(
      (this.currentPage() - 1) * PAGE_SIZE,
      this.currentPage() * PAGE_SIZE,
    ),
  );
  readonly pageStart = computed(() =>
    this.registros().length === 0 ? 0 : (this.currentPage() - 1) * PAGE_SIZE + 1,
  );
  readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * PAGE_SIZE, this.registros().length),
  );
  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const cur = this.currentPage();
    const range: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) {
      range.push(i);
    }
    return range;
  });

  ngOnInit(): void {
    this.cargar();
  }

  aplicarFiltros(): void {
    this.cargar();
  }

  limpiarFiltros(): void {
    this.filtros = { expediente: '', accion: '', exitoso: '', limit: 20 };
    this.cargar();
  }

  hayFiltrosActivos(): boolean {
    return !!this.filtros.expediente.trim() || !!this.filtros.accion || !!this.filtros.exitoso || this.filtros.limit !== 20;
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(false);

    this.svc.consultar({
      expediente: this.filtros.expediente.trim() || undefined,
      accion: this.filtros.accion || undefined,
      exitoso: this.filtros.exitoso === '' ? undefined : this.filtros.exitoso === 'true',
      limit: this.filtros.limit,
    }).subscribe({
      next: (res) => {
        this.registros.set(res.registros ?? []);
        this.total.set(res.total ?? res.registros?.length ?? 0);
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: (_err: HttpErrorResponse) => {
        this.registros.set([]);
        this.total.set(0);
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  goToPage(p: number): void { this.currentPage.set(p); }
  prevPage(): void { this.currentPage.update((p) => Math.max(1, p - 1)); }
  nextPage(): void { this.currentPage.update((p) => Math.min(this.totalPages(), p + 1)); }

  fechaRegistro(item: BitacoraRegistro): string {
    const raw = item.fecha_hora ?? item['fecha'] ?? item['timestamp'] ?? item['created_at'] ?? item['createdAt'];
    if (!raw) return '—';
    const fecha = new Date(raw as string);
    if (Number.isNaN(fecha.getTime())) return String(raw);
    return fecha.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  accionBadgeClass(accion?: string): string {
    switch ((accion || '').toUpperCase()) {
      case 'CREAR': return 'det-badge--success';
      case 'ACTUALIZAR': return 'det-badge--warning';
      case 'ELIMINAR': return 'det-badge--danger';
      case 'VECTORIZAR': return 'det-badge--primary';
      case 'DESCARGAR': return 'det-badge--primary';
      default: return 'det-badge--neutral';
    }
  }
}
