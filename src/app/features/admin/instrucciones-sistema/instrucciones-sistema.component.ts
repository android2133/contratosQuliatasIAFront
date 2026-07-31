import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  LucideBotMessageSquare, LucidePlus, LucideX, LucidePencil, LucideTrash2,
  LucideLoader2, LucideTriangleAlert, LucideSave,
  LucideChevronsLeft, LucideChevronLeft, LucideChevronRight, LucideChevronsRight,
} from '@lucide/angular';
import { InstruccionesSistemaService } from '../../../core/services/instrucciones-sistema.service';
import { InstruccionSistema } from '../../../core/models/instruccion-sistema.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-instrucciones-sistema',
  imports: [
    FormsModule,
    LucideBotMessageSquare, LucidePlus, LucideX, LucidePencil, LucideTrash2,
    LucideLoader2, LucideTriangleAlert, LucideSave,
    LucideChevronsLeft, LucideChevronLeft, LucideChevronRight, LucideChevronsRight,
  ],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="inbox-page" style="max-width: 860px">

        <div class="inbox-page__header">
          <div>
            <h1 class="inbox-page__title">Instrucciones del sistema</h1>
            <p class="inbox-page__subtitle">Instrucciones que guían el comportamiento del agente</p>
          </div>
          <button (click)="toggleCrear()" class="btn-primary" style="padding: 0 1rem; min-height: 40px">
            @if (mostrarCrear()) {
              <svg lucideX class="w-4 h-4"></svg>
              Cancelar
            } @else {
              <svg lucidePlus class="w-4 h-4"></svg>
              Nueva instrucción
            }
          </button>
        </div>

        <!-- ── Crear ── -->
        @if (mostrarCrear()) {
          <div class="card mb-4" style="display: flex; flex-direction: column; gap: .75rem">
            <textarea class="input-base" rows="3" placeholder="Escribe la instrucción del sistema…"
              [(ngModel)]="nuevaInstruccion"></textarea>
            @if (crearError()) {
              <p class="flex items-center gap-1.5" style="font-size: var(--font-size-xs); color: var(--color-danger)">
                <svg lucideTriangleAlert class="w-3.5 h-3.5 shrink-0"></svg>
                {{ crearError() }}
              </p>
            }
            <button (click)="crear()" [disabled]="!nuevaInstruccion.trim() || creando()"
              class="btn-primary" style="align-self: flex-end; padding: 0 1.25rem; min-height: 38px">
              @if (creando()) {
                <svg lucideLoader2 class="w-4 h-4 animate-spin"></svg>
              } @else {
                <svg lucidePlus class="w-4 h-4"></svg>
              }
              Crear
            </button>
          </div>
        }

        <!-- ── Listado ── -->
        @if (loading()) {
          <div class="flex flex-col gap-2.5">
            @for (i of [0, 1, 2]; track i) {
              <div class="card skeleton" style="height: 4.5rem"></div>
            }
          </div>
        } @else if (error()) {
          <div class="card flex items-center gap-3" style="padding: 1.25rem">
            <svg lucideTriangleAlert class="w-4 h-4 shrink-0" style="color: var(--color-danger)"></svg>
            <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm)">
              No fue posible cargar las instrucciones del sistema. Intenta de nuevo más tarde.
            </p>
          </div>
        } @else if (instrucciones().length === 0) {
          <div class="card" style="padding: 1.25rem">
            <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm)">
              Aún no hay instrucciones del sistema registradas.
            </p>
          </div>
        } @else {
          <div class="flex flex-col gap-2.5">
            @for (item of paginatedInstrucciones(); track item.idInstruccion) {
              <div class="card" style="padding: 1.1rem 1.25rem">
                @if (editandoId() === item.idInstruccion) {
                  <div class="flex flex-col gap-2.5">
                    <textarea class="input-base" rows="3" [(ngModel)]="textoEdicion"></textarea>
                    @if (editarError()) {
                      <p class="flex items-center gap-1.5" style="font-size: var(--font-size-xs); color: var(--color-danger)">
                        <svg lucideTriangleAlert class="w-3.5 h-3.5 shrink-0"></svg>
                        {{ editarError() }}
                      </p>
                    }
                    <div class="flex items-center gap-2 justify-end">
                      <button (click)="cancelarEdicion()" class="secondary-button">Cancelar</button>
                      <button (click)="guardarEdicion(item)" [disabled]="!textoEdicion.trim() || guardando()"
                        class="btn-primary" style="padding: 0 1rem; min-height: 38px">
                        @if (guardando()) {
                          <svg lucideLoader2 class="w-4 h-4 animate-spin"></svg>
                        } @else {
                          <svg lucideSave class="w-4 h-4"></svg>
                        }
                        Guardar
                      </button>
                    </div>
                  </div>
                } @else {
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-start gap-3 min-w-0">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style="background: var(--color-primary-subtle); border: 1px solid var(--color-primary-light)">
                        <svg lucideBotMessageSquare class="w-4 h-4" style="color: var(--color-primary)"></svg>
                      </div>
                      <p style="color: var(--color-text-primary); font-size: var(--font-size-sm); white-space: pre-wrap; overflow-wrap: anywhere">
                        {{ item.instruccionesSistema }}
                      </p>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      <button (click)="iniciarEdicion(item)"
                        class="p-1.5 rounded-md" style="color: var(--color-text-muted); background: transparent; border: none; cursor: pointer"
                        title="Editar">
                        <svg lucidePencil class="w-4 h-4"></svg>
                      </button>
                      @if (confirmandoEliminarId() !== item.idInstruccion) {
                        <button (click)="confirmandoEliminarId.set(item.idInstruccion)"
                          class="p-1.5 rounded-md" style="color: var(--color-text-muted); background: transparent; border: none; cursor: pointer"
                          title="Eliminar">
                          <svg lucideTrash2 class="w-4 h-4"></svg>
                        </button>
                      } @else {
                        <button (click)="eliminar(item)" [disabled]="eliminandoId() === item.idInstruccion"
                          class="secondary-button" style="color: var(--color-danger); border-color: var(--color-danger)">
                          Confirmar
                        </button>
                        <button (click)="confirmandoEliminarId.set(null)" class="secondary-button">Cancelar</button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <div class="pagination">
            <span class="pagination__info">
              Mostrando {{ pageStart() }}–{{ pageEnd() }} de {{ instrucciones().length }}
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
  `,
})
export class InstruccionesSistemaComponent implements OnInit {
  private readonly svc = inject(InstruccionesSistemaService);

  readonly instrucciones = signal<InstruccionSistema[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly currentPage = signal(1);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.instrucciones().length / PAGE_SIZE)),
  );
  readonly paginatedInstrucciones = computed(() =>
    this.instrucciones().slice(
      (this.currentPage() - 1) * PAGE_SIZE,
      this.currentPage() * PAGE_SIZE,
    ),
  );
  readonly pageStart = computed(() =>
    this.instrucciones().length === 0 ? 0 : (this.currentPage() - 1) * PAGE_SIZE + 1,
  );
  readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * PAGE_SIZE, this.instrucciones().length),
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

  readonly mostrarCrear = signal(false);
  nuevaInstruccion = '';
  readonly creando = signal(false);
  readonly crearError = signal('');

  readonly editandoId = signal<number | null>(null);
  textoEdicion = '';
  readonly guardando = signal(false);
  readonly editarError = signal('');

  readonly confirmandoEliminarId = signal<number | null>(null);
  readonly eliminandoId = signal<number | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(false);
    this.svc.listar().subscribe({
      next: (res) => {
        this.instrucciones.set(res);
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  goToPage(p: number): void { this.currentPage.set(p); }
  prevPage(): void { this.currentPage.update((p) => Math.max(1, p - 1)); }
  nextPage(): void { this.currentPage.update((p) => Math.min(this.totalPages(), p + 1)); }

  toggleCrear(): void {
    this.mostrarCrear.set(!this.mostrarCrear());
    this.nuevaInstruccion = '';
    this.crearError.set('');
  }

  crear(): void {
    const texto = this.nuevaInstruccion.trim();
    if (!texto) return;

    this.creando.set(true);
    this.crearError.set('');
    this.svc.crear(texto).subscribe({
      next: () => {
        this.creando.set(false);
        this.mostrarCrear.set(false);
        this.nuevaInstruccion = '';
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.creando.set(false);
        this.crearError.set(this.mensajeError(err));
      },
    });
  }

  iniciarEdicion(item: InstruccionSistema): void {
    this.confirmandoEliminarId.set(null);
    this.editandoId.set(item.idInstruccion);
    this.textoEdicion = item.instruccionesSistema;
    this.editarError.set('');
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.textoEdicion = '';
    this.editarError.set('');
  }

  guardarEdicion(item: InstruccionSistema): void {
    const texto = this.textoEdicion.trim();
    if (!texto) return;

    this.guardando.set(true);
    this.editarError.set('');
    this.svc.actualizar(item.idInstruccion, texto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.editandoId.set(null);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.editarError.set(this.mensajeError(err));
      },
    });
  }

  eliminar(item: InstruccionSistema): void {
    this.eliminandoId.set(item.idInstruccion);
    this.svc.eliminar(item.idInstruccion).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.confirmandoEliminarId.set(null);
        this.instrucciones.update((items) => items.filter((it) => it.idInstruccion !== item.idInstruccion));
        this.currentPage.update((p) => Math.min(p, this.totalPages()));
      },
      error: () => {
        this.eliminandoId.set(null);
        this.confirmandoEliminarId.set(null);
      },
    });
  }

  private mensajeError(err: HttpErrorResponse): string {
    return err.status === 0
      ? 'Sin respuesta del servidor — verifica tu conexión.'
      : `Error ${err.status}: ${err.statusText || 'No fue posible completar la operación.'}`;
  }
}
