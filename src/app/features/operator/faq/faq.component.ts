import { Component, OnInit, inject, signal } from '@angular/core';
import { LucideCircleQuestionMark, LucideTriangleAlert } from '@lucide/angular';
import { FaqService } from '../../../core/services/faq.service';
import { PreguntaFrecuente } from '../../../core/models/faq.model';

@Component({
  selector: 'app-faq',
  imports: [LucideCircleQuestionMark, LucideTriangleAlert],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="inbox-page" style="max-width: 860px">

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
            @for (item of preguntas(); track item.pregunta) {
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

  ngOnInit(): void {
    this.faqService.obtener().subscribe({
      next: (preguntas) => {
        this.preguntas.set(preguntas);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
