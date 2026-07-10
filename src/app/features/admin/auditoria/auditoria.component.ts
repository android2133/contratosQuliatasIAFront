import { Component, inject, signal, computed, OnInit } from '@angular/core';
import {
  LucideRefreshCw, LucideSearch, LucideX, LucideHistory, LucideUserRound,
  LucideChevronLeft, LucideChevronRight, LucideChevronsLeft, LucideChevronsRight,
} from '@lucide/angular';
import { AuditoriaEntrada, AuditoriaAccion } from '../../../core/models/auditoria.model';
import { AuditoriaService } from '../../../core/services/auditoria.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-auditoria',
  imports: [
    LucideRefreshCw, LucideSearch, LucideX, LucideHistory, LucideUserRound,
    LucideChevronLeft, LucideChevronRight, LucideChevronsLeft, LucideChevronsRight,
  ],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="inbox-page">

        <!-- ── Encabezado ── -->
        <div class="inbox-page__header">
          <div>
            <h1 class="inbox-page__title">Registro de cambios</h1>
            <p class="inbox-page__subtitle">
              @if (loading()) { Cargando registro… }
              @if (!loading()) { {{ entradas().length }} acciones registradas }
            </p>
          </div>
          <button (click)="cargar()" [disabled]="loading()" class="btn-clear">
            <svg lucideRefreshCw class="w-4 h-4" [class.animate-spin]="loading()"></svg>
            Refrescar
          </button>
        </div>

        <!-- ── Filtros ── -->
        <section class="filter-card">
          <p class="filter-card__label">Filtros</p>
          <div class="flex gap-3 flex-wrap">
            <div class="filter-search-field" style="flex: 1; min-width: 200px">
              <svg lucideSearch class="filter-search-field__icon w-4 h-4"></svg>
              <input class="filter-input" type="text" placeholder="Buscar por elemento o administrador…"
                [value]="searchQuery()" (input)="onSearch($event)" />
            </div>
            <select class="filter-select" style="max-width: 200px"
              [value]="pantallaFilter()" (change)="onPantallaFilter($event)">
              <option value="">Todas las pantallas</option>
              @for (p of pantallas(); track p) {
                <option [value]="p">{{ p }}</option>
              }
            </select>
            <select class="filter-select" style="max-width: 180px"
              [value]="accionFilter()" (change)="onAccionFilter($event)">
              <option value="">Todas las acciones</option>
              <option value="crear">Crear</option>
              <option value="eliminar">Eliminar</option>
              <option value="editar">Editar</option>
            </select>
            @if (searchQuery() || pantallaFilter() || accionFilter()) {
              <button class="btn-clear" (click)="clearFilters()">
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
                  <th>Administrador</th>
                  <th>Pantalla</th>
                  <th>Acción</th>
                  <th>Elemento afectado</th>
                  <th>Fecha</th>
                  <th>Resultado</th>
                  <th class="inbox-table__actions">Detalle</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (i of [1,2,3,4,5]; track i) {
                    <tr>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-28"></div></td>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-24"></div></td>
                      <td><div class="h-5 w-16 bg-slate-100 rounded-full animate-pulse"></div></td>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-3/5"></div></td>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-20"></div></td>
                      <td><div class="h-5 w-14 bg-slate-100 rounded-full animate-pulse"></div></td>
                      <td class="inbox-table__actions"><div class="h-6 w-14 bg-slate-100 rounded animate-pulse mx-auto"></div></td>
                    </tr>
                  }
                }

                @if (!loading() && paginadas().length === 0) {
                  <tr>
                    <td colspan="7" class="inbox-table__state">
                      @if (searchQuery() || pantallaFilter() || accionFilter()) {
                        Sin resultados para los filtros aplicados
                      } @else {
                        <div class="flex flex-col items-center gap-2 py-2">
                          <svg lucideHistory class="w-6 h-6" style="color: var(--color-text-muted)"></svg>
                          Aún no hay cambios registrados
                        </div>
                      }
                    </td>
                  </tr>
                }

                @for (entrada of paginadas(); track entrada.id) {
                  <tr>
                    <td style="white-space: nowrap">
                      <div class="flex items-center gap-2">
                        <svg lucideUserRound class="w-3.5 h-3.5 shrink-0" style="color: var(--color-text-muted)"></svg>
                        <div>
                          <p style="color: var(--color-text-primary); font-size: var(--font-size-sm)">{{ entrada.adminNombre }}</p>
                          <p style="color: var(--color-text-muted); font-size: .68rem">{{ entrada.adminEmail }}</p>
                        </div>
                      </div>
                    </td>
                    <td style="color: var(--color-text-secondary); white-space: nowrap">{{ entrada.pantalla }}</td>
                    <td>
                      <span class="det-badge"
                        [class.det-badge--success]="entrada.accion === 'crear'"
                        [class.det-badge--danger]="entrada.accion === 'eliminar'"
                        [class.det-badge--warning]="entrada.accion === 'editar'">
                        <span class="det-badge__dot"></span>
                        {{ etiquetaAccion(entrada.accion) }}
                      </span>
                    </td>
                    <td style="max-width: 260px">
                      <span class="truncate block font-medium" style="color: var(--color-text-primary)">{{ entrada.elemento }}</span>
                    </td>
                    <td style="color: var(--color-text-secondary); white-space: nowrap">{{ formatFecha(entrada.fecha) }}</td>
                    <td>
                      <span class="det-badge" [class.det-badge--success]="entrada.resultado === 'exito'"
                        [class.det-badge--danger]="entrada.resultado === 'error'">
                        <span class="det-badge__dot"></span>
                        {{ entrada.resultado === 'exito' ? 'Éxito' : 'Error' }}
                      </span>
                    </td>
                    <td class="inbox-table__actions">
                      @if (entrada.detalleAntes || entrada.detalleDespues || entrada.mensajeError) {
                        <button (click)="verDetalle(entrada)" class="btn-actions-menu" title="Ver detalle" style="width: auto; padding: 0 .5rem; font-size: .72rem; font-weight: 700; color: var(--color-primary)">
                          Ver
                        </button>
                      } @else {
                        <span style="color: var(--color-text-muted); font-size: .72rem">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (!loading() && filtradas().length > 0) {
            <div class="pagination">
              <span class="pagination__info">
                Mostrando {{ pageStart() }}–{{ pageEnd() }} de {{ filtradas().length }}
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

    <!-- ── Modal detalle ── -->
    @if (detalleAbierto(); as entrada) {
      <div class="fixed inset-0 z-50 flex items-center justify-center"
        style="background: rgba(82,85,99,.45); backdrop-filter: blur(10px)"
        (click)="cerrarDetalle()">
        <div class="w-full max-w-lg mx-4 overflow-hidden"
          style="background: var(--color-surface); border-radius: 24px;
                 box-shadow: 0 32px 80px rgba(17,24,39,.24);
                 border: 1px solid rgba(148,27,128,.08)"
          (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between px-6 py-4" style="border-bottom: 1px solid var(--color-border)">
            <div>
              <h2 class="text-base font-semibold" style="color: var(--color-text-primary)">{{ entrada.elemento }}</h2>
              <p style="color: var(--color-text-secondary); font-size: var(--font-size-xs)">
                {{ entrada.adminNombre }} · {{ formatFecha(entrada.fecha) }}
              </p>
            </div>
            <button (click)="cerrarDetalle()" class="icon-button" title="Cerrar">
              <svg lucideX class="w-4 h-4"></svg>
            </button>
          </div>

          <div class="px-6 py-5 flex flex-col gap-4">
            @if (entrada.resultado === 'error' && entrada.mensajeError) {
              <div class="rounded-xl px-4 py-3" style="background: var(--color-danger-light)">
                <p style="color: #991b1b; font-size: var(--font-size-sm); font-weight: 600">Error al ejecutar la acción</p>
                <p style="color: #991b1b; font-size: var(--font-size-xs); margin-top: .25rem">{{ entrada.mensajeError }}</p>
              </div>
            }
            @if (entrada.detalleAntes || entrada.detalleDespues) {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="rounded-xl px-4 py-3" style="background: var(--color-danger-light)">
                  <p style="color: var(--color-danger); font-size: .64rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; margin-bottom: .4rem">Antes</p>
                  <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); line-height: 1.55">{{ entrada.detalleAntes || '—' }}</p>
                </div>
                <div class="rounded-xl px-4 py-3" style="background: var(--color-success-light)">
                  <p style="color: #065f46; font-size: .64rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; margin-bottom: .4rem">Después</p>
                  <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); line-height: 1.55">{{ entrada.detalleDespues || '—' }}</p>
                </div>
              </div>
            }
          </div>

          <div class="flex items-center justify-end px-6 py-4" style="border-top: 1px solid var(--color-border)">
            <button (click)="cerrarDetalle()" class="primary-button">Cerrar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AuditoriaComponent implements OnInit {
  private readonly svc = inject(AuditoriaService);

  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly pantallaFilter = signal('');
  readonly accionFilter = signal('');
  readonly entradas = signal<AuditoriaEntrada[]>([]);
  readonly currentPage = signal(1);
  readonly detalleAbierto = signal<AuditoriaEntrada | null>(null);

  readonly pantallas = computed(() => {
    const set = new Set(this.entradas().map((e) => e.pantalla));
    return Array.from(set).sort();
  });

  readonly filtradas = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const pantalla = this.pantallaFilter();
    const accion = this.accionFilter();
    return this.entradas().filter((e) => {
      const matchQuery = !q ||
        e.elemento.toLowerCase().includes(q) ||
        e.adminNombre.toLowerCase().includes(q) ||
        e.adminEmail.toLowerCase().includes(q);
      const matchPantalla = !pantalla || e.pantalla === pantalla;
      const matchAccion = !accion || e.accion === accion;
      return matchQuery && matchPantalla && matchAccion;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtradas().length / PAGE_SIZE))
  );

  readonly paginadas = computed(() =>
    this.filtradas().slice(
      (this.currentPage() - 1) * PAGE_SIZE,
      this.currentPage() * PAGE_SIZE,
    )
  );

  readonly pageStart = computed(() =>
    this.filtradas().length === 0 ? 0 : (this.currentPage() - 1) * PAGE_SIZE + 1
  );

  readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * PAGE_SIZE, this.filtradas().length)
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

  cargar(): void {
    this.loading.set(true);
    this.svc.listar().subscribe((entradas) => {
      this.entradas.set(entradas);
      this.loading.set(false);
    });
  }

  onSearch(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onPantallaFilter(e: Event): void {
    this.pantallaFilter.set((e.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  onAccionFilter(e: Event): void {
    this.accionFilter.set((e.target as HTMLSelectElement).value as AuditoriaAccion | '');
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.pantallaFilter.set('');
    this.accionFilter.set('');
    this.currentPage.set(1);
  }

  goToPage(p: number): void { this.currentPage.set(p); }
  prevPage(): void { this.currentPage.update(p => Math.max(1, p - 1)); }
  nextPage(): void { this.currentPage.update(p => Math.min(this.totalPages(), p + 1)); }

  verDetalle(entrada: AuditoriaEntrada): void { this.detalleAbierto.set(entrada); }
  cerrarDetalle(): void { this.detalleAbierto.set(null); }

  etiquetaAccion(accion: AuditoriaAccion): string {
    return { crear: 'Creó', eliminar: 'Eliminó', editar: 'Editó' }[accion];
  }

  formatFecha(date: Date): string {
    return date.toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
}
