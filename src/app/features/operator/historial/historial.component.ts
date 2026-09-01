import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideTriangleAlert, LucideChevronLeft, LucideChevronRight,
  LucideRefreshCw, LucideMessageSquare,
} from '@lucide/angular';
import { Operador } from '../../../core/models/operador.model';
import { Conversacion } from '../../../core/models/conversacion.model';
import { ChatService } from '../../../core/services/chat.service';
import { OperadoresService } from '../../../core/services/operadores.service';

const PAGE_SIZE_HISTORIAL = 10;

@Component({
  selector: 'app-historial',
  imports: [
    FormsModule, DecimalPipe,
    LucideTriangleAlert, LucideChevronLeft, LucideChevronRight,
    LucideRefreshCw, LucideMessageSquare,
  ],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="inbox-page">

        <!-- ── Encabezado ── -->
        <div class="inbox-page__header">
          <div>
            <h1 class="inbox-page__title">Historial de conversaciones</h1>
            <p class="inbox-page__subtitle">
              Consulta y retoma las conversaciones registradas por operador
            </p>
          </div>
          <button (click)="cargarHistorial()" class="btn-clear" type="button" [disabled]="loading()">
            <svg lucideRefreshCw class="w-4 h-4"></svg>
            Actualizar
          </button>
        </div>

        <!-- ── Filtro por operador ── -->
        <section class="filter-card">
          <p class="filter-card__label">Operador</p>
          <div class="flex gap-3 flex-wrap items-center">
            @if (operadoresDisponibles().length > 0) {
              <select
                class="input-base"
                style="flex: 1; min-width: 260px"
                [ngModel]="operador()"
                (ngModelChange)="onOperadorChange($event)"
              >
                @for (op of operadoresDisponibles(); track op.operador) {
                  <option [ngValue]="op.operador">{{ op.operador }}</option>
                }
              </select>
            } @else {
              <input
                class="input-base"
                style="flex: 1; min-width: 260px"
                placeholder="Nombre del operador"
                [ngModel]="operador()"
                (ngModelChange)="operador.set($event)"
                (keydown.enter)="cargarHistorial()"
              />
            }
          </div>
        </section>

        <!-- ── Estado: cargando ── -->
        @if (loading()) {
          <div class="flex flex-col gap-2" style="margin-top: 1rem">
            @for (i of [0, 1, 2, 3, 4]; track i) {
              <div class="skeleton" style="height: 4.25rem; border-radius: var(--radius-md)"></div>
            }
          </div>
        }

        <!-- ── Estado: error ── -->
        @else if (error()) {
          <div class="flex items-start gap-3 rounded-xl px-4 py-3" style="margin-top: 1rem;
            background: var(--color-danger-light); border: 1px solid rgba(239,68,68,.35)">
            <svg lucideTriangleAlert class="w-5 h-5 shrink-0 mt-0.5" style="color: var(--color-danger)"></svg>
            <p class="text-sm" style="color: var(--color-danger)">
              No fue posible cargar el historial de este operador.
            </p>
          </div>
        }

        <!-- ── Estado: vacío ── -->
        @else if (conversaciones().length === 0) {
          <div style="margin-top: 1rem; padding: 2rem; text-align: center; border-radius: var(--radius-lg);
                      border: 1.5px dashed var(--color-border); background: var(--color-surface)">
            <p style="color: var(--color-text-muted); font-size: var(--font-size-sm)">
              Este operador no tiene conversaciones registradas.
            </p>
          </div>
        }

        <!-- ── Estado: resultado ── -->
        @else {
          <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: .5rem">
            @for (conv of paginated(); track conv.conversationId) {
              <button
                type="button"
                (click)="retomar(conv)"
                style="text-align: left; border-radius: var(--radius-md); padding: .85rem 1rem; cursor: pointer;
                       font-family: var(--font-family); border: 1px solid var(--color-border);
                       background: var(--color-surface); transition: border-color var(--transition-fast)"
                onmouseover="this.style.borderColor='var(--color-primary-light)'"
                onmouseout="this.style.borderColor='var(--color-border)'"
              >
                <div class="flex items-center justify-between gap-3">
                  <p style="margin: 0; font-size: var(--font-size-sm); font-weight: 600; line-height: 1.4;
                            color: var(--color-text-primary); display: -webkit-box; -webkit-line-clamp: 2;
                            -webkit-box-orient: vertical; overflow: hidden">
                    {{ conv.tituloConversacion }}
                  </p>
                  <span class="folio-chip shrink-0" title="ID de la conversación">{{ conv.conversationId }}</span>
                </div>
                <div class="flex items-center gap-2" style="margin-top: .4rem; font-size: var(--font-size-xs); color: var(--color-text-muted)">
                  <span>{{ formatDateTime(conv.inicio) }}</span>
                  <span>·</span>
                  <span>{{ conv.consultasRealizadas }} {{ conv.consultasRealizadas === 1 ? 'consulta' : 'consultas' }}</span>
                  <span>·</span>
                  <span>{{ conv.tokensTotal | number }} tokens</span>
                  <span class="flex items-center gap-1" style="margin-left: auto; color: var(--color-primary)">
                    <svg lucideMessageSquare class="w-3.5 h-3.5"></svg>
                    Retomar
                  </span>
                </div>
              </button>
            }
          </div>

          @if (totalPages() > 1) {
            <div class="flex items-center justify-between" style="margin-top: 1rem">
              <span style="font-size: var(--font-size-xs); color: var(--color-text-muted)">
                Página {{ currentPage() }} de {{ totalPages() }}
              </span>
              <div class="flex items-center gap-1">
                <button class="pagination__btn" [disabled]="currentPage() === 1" (click)="prevPage()">
                  <svg lucideChevronLeft class="w-3.5 h-3.5"></svg>
                </button>
                <button class="pagination__btn" [disabled]="currentPage() === totalPages()" (click)="nextPage()">
                  <svg lucideChevronRight class="w-3.5 h-3.5"></svg>
                </button>
              </div>
            </div>
          }
        }

      </div>
    </div>
  `,
})
export class HistorialComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly chatService = inject(ChatService);
  private readonly operadoresService = inject(OperadoresService);

  readonly operador = this.chatService.operador;
  readonly operadoresDisponibles = signal<Operador[]>([]);

  readonly loading = signal(false);
  readonly error = signal(false);
  readonly conversaciones = signal<Conversacion[]>([]);

  readonly currentPage = signal(1);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.conversaciones().length / PAGE_SIZE_HISTORIAL)),
  );
  readonly paginated = computed(() =>
    this.conversaciones().slice(
      (this.currentPage() - 1) * PAGE_SIZE_HISTORIAL,
      this.currentPage() * PAGE_SIZE_HISTORIAL,
    ),
  );

  ngOnInit(): void {
    this.operadoresService.listar().subscribe({
      next: (items) => this.operadoresDisponibles.set(items),
      error: () => this.operadoresDisponibles.set([]),
    });
    this.cargarHistorial();
  }

  onOperadorChange(operador: string): void {
    this.operador.set(operador);
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.loading.set(true);
    this.error.set(false);
    this.currentPage.set(1);
    this.operadoresService.listarConversaciones(this.operador()).subscribe({
      next: (conversaciones) => {
        this.conversaciones.set(conversaciones);
        this.loading.set(false);
      },
      error: () => {
        this.conversaciones.set([]);
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  retomar(conv: Conversacion): void {
    this.router.navigate(['/operator/chat'], {
      queryParams: { conversacion: conv.conversationId },
    });
  }

  prevPage(): void { this.currentPage.update((p) => Math.max(1, p - 1)); }
  nextPage(): void { this.currentPage.update((p) => Math.min(this.totalPages(), p + 1)); }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
}
