import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideRefreshCw, LucideSearch, LucideX, LucidePlay, LucideDownload,
  LucideChevronLeft, LucideChevronRight, LucideChevronsLeft, LucideChevronsRight,
  LucideHistory,
} from '@lucide/angular';
import { Conversacion } from '../../../core/models/conversacion.model';
import { ConversacionesService } from '../../../core/services/conversaciones.service';
import { AuthService } from '../../../core/auth/auth.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-historial',
  imports: [
    RouterLink,
    LucideRefreshCw, LucideSearch, LucideX, LucidePlay, LucideDownload,
    LucideChevronLeft, LucideChevronRight, LucideChevronsLeft, LucideChevronsRight,
    LucideHistory,
  ],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="inbox-page">

        <!-- ── Encabezado ── -->
        <div class="inbox-page__header">
          <div>
            <h1 class="inbox-page__title">Historial de conversaciones</h1>
            <p class="inbox-page__subtitle">
              @if (loading()) { Cargando conversaciones… }
              @if (!loading()) { {{ conversaciones().length }} conversaciones registradas }
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
              <input class="filter-input" type="text" placeholder="Buscar por folio o contenido…"
                [value]="searchQuery()" (input)="onSearch($event)" />
            </div>
            @if (searchQuery()) {
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
                  <th>Folio</th>
                  <th>Conversación</th>
                  <th>Inicio</th>
                  <th>Última actividad</th>
                  <th>Estado</th>
                  <th class="inbox-table__actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (i of [1,2,3,4,5]; track i) {
                    <tr>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-20"></div></td>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-3/5"></div></td>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-24"></div></td>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-24"></div></td>
                      <td><div class="h-5 w-16 bg-slate-100 rounded-full animate-pulse"></div></td>
                      <td class="inbox-table__actions"><div class="h-6 w-14 bg-slate-100 rounded animate-pulse mx-auto"></div></td>
                    </tr>
                  }
                }

                @if (!loading() && paginatedConversaciones().length === 0) {
                  <tr>
                    <td colspan="6" class="inbox-table__state">
                      @if (searchQuery()) {
                        Sin resultados para los filtros aplicados
                      } @else {
                        <div class="flex flex-col items-center gap-2 py-2">
                          <svg lucideHistory class="w-6 h-6" style="color: var(--color-text-muted)"></svg>
                          Aún no tienes conversaciones registradas
                        </div>
                      }
                    </td>
                  </tr>
                }

                @for (conv of paginatedConversaciones(); track conv.folio) {
                  <tr>
                    <td style="white-space: nowrap">
                      <span class="font-medium">{{ conv.folio }}</span>
                    </td>
                    <td style="max-width: 320px">
                      <span class="truncate block" style="color: var(--color-text-secondary)">
                        {{ previewDe(conv) }}
                      </span>
                    </td>
                    <td style="color: var(--color-text-secondary); white-space: nowrap">
                      {{ formatFecha(conv.fechaInicio) }}
                    </td>
                    <td style="color: var(--color-text-secondary); white-space: nowrap">
                      {{ formatFecha(conv.fechaActualizacion) }}
                    </td>
                    <td>
                      <span class="det-badge" [class.det-badge--success]="conv.estado === 'activa'"
                        [class.det-badge--neutral]="conv.estado !== 'activa'">
                        <span class="det-badge__dot"></span>
                        {{ conv.estado === 'activa' ? 'Activa' : 'Archivada' }}
                      </span>
                    </td>
                    <td class="inbox-table__actions">
                      <div class="flex items-center justify-center gap-1">
                        <a [routerLink]="['/operator/chat']" [queryParams]="{ folio: conv.folio }"
                          class="btn-actions-menu" title="Retomar conversación">
                          <svg lucidePlay class="w-4 h-4"></svg>
                        </a>
                        @if (conv.contratoUrl) {
                          <a [href]="conv.contratoUrl" target="_blank" rel="noopener"
                            (click)="$event.stopPropagation()"
                            class="btn-actions-menu" title="Descargar contrato">
                            <svg lucideDownload class="w-4 h-4"></svg>
                          </a>
                        } @else {
                          <span class="btn-actions-menu" style="opacity: .35; cursor: not-allowed"
                            title="Aún no hay contrato generado en esta conversación">
                            <svg lucideDownload class="w-4 h-4"></svg>
                          </span>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (!loading() && conversacionesFiltradas().length > 0) {
            <div class="pagination">
              <span class="pagination__info">
                Mostrando {{ pageStart() }}–{{ pageEnd() }} de {{ conversacionesFiltradas().length }}
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
export class HistorialComponent implements OnInit {
  private readonly svc = inject(ConversacionesService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly conversaciones = signal<Conversacion[]>([]);
  readonly currentPage = signal(1);

  readonly conversacionesFiltradas = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.conversaciones();
    return this.conversaciones().filter((c) =>
      c.folio.toLowerCase().includes(q) ||
      c.mensajes.some((m) => m.content.toLowerCase().includes(q)),
    );
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.conversacionesFiltradas().length / PAGE_SIZE))
  );

  readonly paginatedConversaciones = computed(() =>
    this.conversacionesFiltradas().slice(
      (this.currentPage() - 1) * PAGE_SIZE,
      this.currentPage() * PAGE_SIZE,
    )
  );

  readonly pageStart = computed(() =>
    this.conversacionesFiltradas().length === 0
      ? 0
      : (this.currentPage() - 1) * PAGE_SIZE + 1
  );

  readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * PAGE_SIZE, this.conversacionesFiltradas().length)
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
    const operador = this.auth.currentUser();
    if (!operador) return;

    this.loading.set(true);
    this.svc.listarPorOperador(operador.id).subscribe((conversaciones) => {
      this.conversaciones.set(conversaciones);
      this.loading.set(false);
    });
  }

  onSearch(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  goToPage(p: number): void { this.currentPage.set(p); }
  prevPage(): void { this.currentPage.update(p => Math.max(1, p - 1)); }
  nextPage(): void { this.currentPage.update(p => Math.min(this.totalPages(), p + 1)); }

  previewDe(conv: Conversacion): string {
    const primerMensaje = conv.mensajes.find((m) => m.role === 'user');
    const texto = primerMensaje?.content || conv.mensajes[0]?.content || 'Sin mensajes aún';
    return texto.length > 90 ? `${texto.slice(0, 90)}…` : texto;
  }

  formatFecha(date: Date): string {
    return date.toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
}
