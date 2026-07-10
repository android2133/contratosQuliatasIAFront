import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  LucideRefreshCw, LucideSearch, LucideX, LucideEye, LucideDownload,
  LucideChevronLeft, LucideChevronRight, LucideChevronsLeft, LucideChevronsRight,
  LucideHistory, LucideUserRound, LucideBot,
} from '@lucide/angular';
import { Conversacion, ConversacionMensaje } from '../../../core/models/conversacion.model';
import { ConversacionesService } from '../../../core/services/conversaciones.service';
import { marked } from 'marked';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-historial-admin',
  imports: [
    LucideRefreshCw, LucideSearch, LucideX, LucideEye, LucideDownload,
    LucideChevronLeft, LucideChevronRight, LucideChevronsLeft, LucideChevronsRight,
    LucideHistory, LucideUserRound, LucideBot,
  ],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="inbox-page">

        <!-- ── Encabezado ── -->
        <div class="inbox-page__header">
          <div>
            <h1 class="inbox-page__title">Conversaciones de operadores</h1>
            <p class="inbox-page__subtitle">
              @if (loading()) { Cargando conversaciones… }
              @if (!loading()) { {{ conversaciones().length }} conversaciones de {{ operadores().length }} operador(es) }
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
            <select class="filter-select" style="max-width: 220px"
              [value]="operadorFilter()" (change)="onOperadorFilter($event)">
              <option value="">Todos los operadores</option>
              @for (op of operadores(); track op) {
                <option [value]="op">{{ op }}</option>
              }
            </select>
            @if (searchQuery() || operadorFilter()) {
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
                  <th>Operador</th>
                  <th>Conversación</th>
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
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-28"></div></td>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-3/5"></div></td>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-24"></div></td>
                      <td><div class="h-5 w-16 bg-slate-100 rounded-full animate-pulse"></div></td>
                      <td class="inbox-table__actions"><div class="h-6 w-14 bg-slate-100 rounded animate-pulse mx-auto"></div></td>
                    </tr>
                  }
                }

                @if (!loading() && paginatedConversaciones().length === 0) {
                  <tr>
                    <td colspan="6" class="inbox-table__state">
                      @if (searchQuery() || operadorFilter()) {
                        Sin resultados para los filtros aplicados
                      } @else {
                        <div class="flex flex-col items-center gap-2 py-2">
                          <svg lucideHistory class="w-6 h-6" style="color: var(--color-text-muted)"></svg>
                          Aún no hay conversaciones registradas
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
                    <td style="white-space: nowrap">
                      <div class="flex items-center gap-2">
                        <svg lucideUserRound class="w-3.5 h-3.5 shrink-0" style="color: var(--color-text-muted)"></svg>
                        <div>
                          <p style="color: var(--color-text-primary); font-size: var(--font-size-sm)">{{ conv.operadorNombre }}</p>
                          <p style="color: var(--color-text-muted); font-size: .68rem">{{ conv.operadorEmail }}</p>
                        </div>
                      </div>
                    </td>
                    <td style="max-width: 280px">
                      <span class="truncate block" style="color: var(--color-text-secondary)">
                        {{ previewDe(conv) }}
                      </span>
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
                        <button (click)="verConversacion(conv)" class="btn-actions-menu" title="Ver conversación">
                          <svg lucideEye class="w-4 h-4"></svg>
                        </button>
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

    <!-- ── Modal transcripción (solo lectura) ── -->
    @if (conversacionAbierta(); as conv) {
      <div class="fixed inset-0 z-50 flex items-center justify-center"
        style="background: rgba(82,85,99,.45); backdrop-filter: blur(10px)"
        (click)="cerrarConversacion()">
        <div class="w-full max-w-2xl mx-4 flex flex-col overflow-hidden"
          style="background: var(--color-surface); border-radius: 24px;
                 box-shadow: 0 32px 80px rgba(17,24,39,.24);
                 border: 1px solid rgba(148,27,128,.08);
                 max-height: 85vh;"
          (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between px-6 py-4 shrink-0" style="border-bottom: 1px solid var(--color-border)">
            <div>
              <h2 class="text-base font-semibold" style="color: var(--color-text-primary)">{{ conv.folio }}</h2>
              <p style="color: var(--color-text-secondary); font-size: var(--font-size-xs)">
                {{ conv.operadorNombre }} · {{ conv.operadorEmail }}
              </p>
            </div>
            <button (click)="cerrarConversacion()" class="icon-button" title="Cerrar">
              <svg lucideX class="w-4 h-4"></svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            @for (m of conv.mensajes; track $index) {
              @if (m.role === 'user') {
                <div class="flex justify-end">
                  <div class="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm" style="background: var(--color-primary); color: #fff">
                    <p class="text-sm leading-relaxed">{{ m.content }}</p>
                  </div>
                </div>
              } @else {
                <div class="flex gap-2.5">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style="background: var(--color-primary)">
                    <svg lucideBot class="w-3.5 h-3.5 text-white"></svg>
                  </div>
                  <div class="flex-1 max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm"
                    style="background: var(--color-bg); border: 1px solid var(--color-border)">
                    <div class="text-sm leading-relaxed" style="color: var(--color-text-primary)" [innerHTML]="renderMarkdown(m.content)"></div>
                  </div>
                </div>
              }
            }
            @if (conv.mensajes.length === 0) {
              <p class="text-center" style="color: var(--color-text-muted); font-size: var(--font-size-sm)">Esta conversación no tiene mensajes registrados.</p>
            }
          </div>

          <div class="flex items-center justify-end gap-3 px-6 py-4 shrink-0" style="border-top: 1px solid var(--color-border)">
            @if (conv.contratoUrl) {
              <a [href]="conv.contratoUrl" target="_blank" rel="noopener" class="secondary-button">
                <svg lucideDownload class="w-3.5 h-3.5"></svg>
                Descargar contrato
              </a>
            }
            <button (click)="cerrarConversacion()" class="primary-button">Cerrar</button>
          </div>

        </div>
      </div>
    }
  `,
})
export class HistorialAdminComponent implements OnInit {
  private readonly svc = inject(ConversacionesService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly operadorFilter = signal('');
  readonly conversaciones = signal<Conversacion[]>([]);
  readonly currentPage = signal(1);
  readonly conversacionAbierta = signal<Conversacion | null>(null);

  readonly operadores = computed(() => {
    const set = new Set(this.conversaciones().map((c) => c.operadorNombre));
    return Array.from(set).sort();
  });

  readonly conversacionesFiltradas = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const op = this.operadorFilter();
    return this.conversaciones().filter((c) => {
      const matchQuery = !q || c.folio.toLowerCase().includes(q) ||
        c.mensajes.some((m: ConversacionMensaje) => m.content.toLowerCase().includes(q));
      const matchOperador = !op || c.operadorNombre === op;
      return matchQuery && matchOperador;
    });
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
    this.loading.set(true);
    this.svc.listarTodas().subscribe((conversaciones) => {
      this.conversaciones.set(conversaciones);
      this.loading.set(false);
    });
  }

  onSearch(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onOperadorFilter(e: Event): void {
    this.operadorFilter.set((e.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.operadorFilter.set('');
    this.currentPage.set(1);
  }

  goToPage(p: number): void { this.currentPage.set(p); }
  prevPage(): void { this.currentPage.update(p => Math.max(1, p - 1)); }
  nextPage(): void { this.currentPage.update(p => Math.min(this.totalPages(), p + 1)); }

  verConversacion(conv: Conversacion): void { this.conversacionAbierta.set(conv); }
  cerrarConversacion(): void { this.conversacionAbierta.set(null); }

  previewDe(conv: Conversacion): string {
    const primerMensaje = conv.mensajes.find((m) => m.role === 'user');
    const texto = primerMensaje?.content || conv.mensajes[0]?.content || 'Sin mensajes aún';
    return texto.length > 80 ? `${texto.slice(0, 80)}…` : texto;
  }

  renderMarkdown(content: string): SafeHtml {
    const html = marked.parse(content, { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  formatFecha(date: Date): string {
    return date.toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
}
