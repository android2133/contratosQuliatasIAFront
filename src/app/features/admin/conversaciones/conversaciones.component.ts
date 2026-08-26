import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  LucideSearch, LucideUser, LucideBot, LucideTriangleAlert, LucideX,
} from '@lucide/angular';
import { marked } from 'marked';
import { OperadoresService } from '../../../core/services/operadores.service';
import { ConversacionDetalle, ConversacionHistorialItem } from '../../../core/models/conversacion.model';

@Component({
  selector: 'app-conversaciones',
  imports: [
    FormsModule,
    LucideSearch, LucideUser, LucideBot, LucideTriangleAlert, LucideX,
  ],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="inbox-page">

        <!-- ── Encabezado ── -->
        <div class="inbox-page__header">
          <div>
            <h1 class="inbox-page__title">Conversaciones</h1>
            <p class="inbox-page__subtitle">
              Consulta el historial completo de una conversación a partir de su folio
            </p>
          </div>
        </div>

        <!-- ── Búsqueda por folio ── -->
        <section class="filter-card">
          <p class="filter-card__label">Folio de la conversación</p>
          <div class="flex gap-3 flex-wrap items-center">
            <div class="filter-search-field" style="flex: 1; min-width: 260px">
              <svg lucideSearch class="filter-search-field__icon w-4 h-4"></svg>
              <input class="filter-input" type="text" placeholder="Ej. 5eeb7e30-010a-43e0-94a3-814f4f744133"
                [ngModel]="folio()" (ngModelChange)="folio.set($event)"
                (keydown.enter)="buscar()" />
            </div>

            <button (click)="buscar()" [disabled]="loading() || !folio().trim()" class="btn-search">
              <svg lucideSearch class="w-4 h-4"></svg>
              Buscar
            </button>

            @if (buscado()) {
              <button (click)="limpiar()" class="btn-clear">
                <svg lucideX class="w-4 h-4"></svg>
                Limpiar
              </button>
            }
          </div>
        </section>

        <!-- ── Estado: sin búsqueda ── -->
        @if (!buscado()) {
          <div style="margin-top: 1rem; padding: 2rem; text-align: center; border-radius: var(--radius-lg);
                      border: 1.5px dashed var(--color-border); background: var(--color-surface)">
            <p style="color: var(--color-text-muted); font-size: var(--font-size-sm)">
              Introduce el folio (conversationId) de una conversación para ver su historial completo.
            </p>
          </div>
        }

        <!-- ── Estado: cargando ── -->
        @if (loading()) {
          <div class="flex flex-col gap-4" style="margin-top: 1rem">
            @for (i of [0, 1, 2]; track i) {
              <div class="flex gap-3">
                <div class="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                <div class="flex-1 max-w-2xl bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-4 shadow-sm space-y-2">
                  <div class="skeleton h-3 w-3/4"></div>
                  <div class="skeleton h-3 w-1/2"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- ── Estado: error ── -->
        @if (!loading() && error()) {
          <div class="flex items-start gap-3 rounded-xl px-4 py-3" style="margin-top: 1rem;
            background: var(--color-danger-light); border: 1px solid rgba(239,68,68,.35)">
            <svg lucideTriangleAlert class="w-5 h-5 shrink-0 mt-0.5" style="color: var(--color-danger)"></svg>
            <p class="text-sm" style="color: var(--color-danger)">
              No se encontró ninguna conversación con el folio "{{ folioBuscado() }}".
            </p>
          </div>
        }

        <!-- ── Estado: resultado ── -->
        @if (!loading() && !error() && conversacion(); as conv) {
          <div style="margin-top: 1rem">
            <div class="flex items-center justify-between" style="margin-bottom: 1rem">
              <span class="folio-chip" title="ID de la conversación">{{ conv.conversationId }}</span>
              <span style="font-size: var(--font-size-xs); color: var(--color-text-muted)">
                {{ conv.historial.length }} {{ conv.historial.length === 1 ? 'mensaje' : 'mensajes' }}
              </span>
            </div>

            @if (conv.historial.length === 0) {
              <div style="padding: 2rem; text-align: center; border-radius: var(--radius-lg);
                          border: 1.5px dashed var(--color-border); background: var(--color-surface)">
                <p style="color: var(--color-text-muted); font-size: var(--font-size-sm)">
                  Esta conversación no tiene mensajes registrados.
                </p>
              </div>
            } @else {
              <div class="flex flex-col gap-6">
                @for (item of conv.historial; track $index) {
                  @if (esUsuario(item)) {
                    <div class="flex justify-end gap-3">
                      <div class="max-w-[80%] space-y-2">
                        <div class="bg-accent-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm">
                          <p class="text-sm leading-relaxed" style="white-space: pre-wrap">{{ textoDe(item) }}</p>
                        </div>
                      </div>
                      <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1">
                        <svg lucideUser class="w-4 h-4 text-slate-500"></svg>
                      </div>
                    </div>
                  } @else {
                    <div class="flex gap-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1" style="background: var(--color-primary)">
                        <svg lucideBot class="w-4 h-4 text-white"></svg>
                      </div>
                      <div class="flex-1 max-w-2xl bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
                        <div class="px-4 py-3">
                          <div class="prose prose-sm prose-slate max-w-none
                                      prose-headings:font-semibold prose-headings:text-slate-900
                                      prose-p:text-slate-700 prose-p:leading-relaxed
                                      prose-strong:text-slate-900 prose-li:text-slate-700
                                      prose-blockquote:text-slate-500 prose-blockquote:border-accent-400
                                      prose-code:text-accent-700 prose-code:bg-accent-50 prose-code:rounded prose-code:px-1"
                            [innerHTML]="renderMarkdown(textoDe(item))"></div>
                        </div>
                      </div>
                    </div>
                  }
                }
              </div>
            }
          </div>
        }

      </div>
    </div>
  `,
})
export class ConversacionesComponent implements OnInit {
  private readonly operadoresService = inject(OperadoresService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly folio = signal('');
  readonly folioBuscado = signal('');
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly buscado = signal(false);
  readonly conversacion = signal<ConversacionDetalle | null>(null);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('idConversacion');
        if (id) {
          this.folio.set(id);
          this.buscar();
        }
      });
  }

  buscar(): void {
    const id = this.folio().trim();
    if (!id) return;

    this.loading.set(true);
    this.error.set(false);
    this.buscado.set(true);
    this.folioBuscado.set(id);
    this.conversacion.set(null);

    this.operadoresService.obtenerConversacion(id).subscribe({
      next: (detalle) => {
        this.conversacion.set(detalle);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  limpiar(): void {
    this.folio.set('');
    this.folioBuscado.set('');
    this.buscado.set(false);
    this.error.set(false);
    this.conversacion.set(null);
  }

  esUsuario(item: ConversacionHistorialItem): boolean {
    return item.role !== 'model';
  }

  textoDe(item: ConversacionHistorialItem): string {
    return item.parts.map((p) => p.text).join('\n');
  }

  renderMarkdown(content: string): SafeHtml {
    const html = marked.parse(content, { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
