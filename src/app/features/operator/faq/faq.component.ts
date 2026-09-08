import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  LucideCircleQuestionMark, LucideTriangleAlert,
  LucideChevronsLeft, LucideChevronLeft, LucideChevronRight, LucideChevronsRight,
} from '@lucide/angular';
import { FaqService } from '../../../core/services/faq.service';
import { PreguntaFrecuente } from '../../../core/models/faq.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-faq',
  imports: [
    LucideCircleQuestionMark, LucideTriangleAlert,
    LucideChevronsLeft, LucideChevronLeft, LucideChevronRight, LucideChevronsRight,
  ],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg); scrollbar-gutter: stable">
      <div class="inbox-page">

        <div class="inbox-page__header">
          <div>
            <h1 class="inbox-page__title">Preguntas frecuentes</h1>
            <p class="inbox-page__subtitle">Las preguntas más consultadas al agente de contratos</p>
          </div>
          <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style="background: var(--color-primary-subtle); border: 1px solid var(--color-primary-light)">
            <svg lucideCircleQuestionMark class="w-5 h-5" style="color: var(--color-primary)"></svg>
          </div>
        </div>

        @if (loading()) {
          <div class="flex flex-col gap-2.5">
            @for (i of [0, 1, 2, 3]; track i) {
              <div class="card skeleton" style="height: 3.5rem"></div>
            }
          </div>
        } @else if (error()) {
          <div class="card flex items-center gap-3" style="padding: 1.25rem">
            <svg lucideTriangleAlert class="w-4 h-4 shrink-0" style="color: var(--color-danger, #b91c1c)"></svg>
            <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm)">
              No fue posible cargar las preguntas frecuentes. Intenta de nuevo más tarde.
            </p>
          </div>
        } @else if (preguntas().length === 0) {
          <div class="card" style="padding: 1.25rem">
            <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm)">
              Aún no hay suficientes conversaciones para mostrar preguntas frecuentes.
            </p>
          </div>
        } @else {
          <div class="flex flex-col gap-2.5">
            @for (item of paginatedPreguntas(); track item.pregunta) {
              <div class="card flex items-center justify-between gap-3" style="padding: 1rem 1.25rem">
                <span style="color: var(--color-text-primary); font-weight: 600; font-size: var(--font-size-sm)">
                  {{ item.pregunta }}
                </span>
                <span class="shrink-0 rounded-full"
                  style="padding: .15rem .65rem; font-size: var(--font-size-xs); font-weight: 700; background: var(--color-primary-subtle); color: var(--color-primary)">
                  {{ item.cantidad }}
                </span>
              </div>
            }
          </div>

          <div class="pagination">
            <span class="pagination__info">
              Mostrando {{ pageStart() }}–{{ pageEnd() }} de {{ preguntas().length }}
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
export class FaqComponent implements OnInit {
  private readonly faqService = inject(FaqService);

  readonly preguntas = signal<PreguntaFrecuente[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly currentPage = signal(1);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.preguntas().length / PAGE_SIZE)),
  );
  readonly paginatedPreguntas = computed(() =>
    this.preguntas().slice(
      (this.currentPage() - 1) * PAGE_SIZE,
      this.currentPage() * PAGE_SIZE,
    ),
  );
  readonly pageStart = computed(() =>
    this.preguntas().length === 0 ? 0 : (this.currentPage() - 1) * PAGE_SIZE + 1,
  );
  readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * PAGE_SIZE, this.preguntas().length),
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
    this.faqService.obtener().subscribe({
      next: (preguntas) => {
        this.preguntas.set(preguntas);
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
}
