import { Component, signal } from '@angular/core';
import { LucideChevronDown, LucideCircleQuestionMark } from '@lucide/angular';
import { PREGUNTAS_FRECUENTES } from '../../../core/models/faq.model';

@Component({
  selector: 'app-faq',
  imports: [LucideChevronDown, LucideCircleQuestionMark],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="inbox-page" style="max-width: 860px">

        <div class="inbox-page__header">
          <div>
            <h1 class="inbox-page__title">Preguntas frecuentes</h1>
            <p class="inbox-page__subtitle">Dudas comunes sobre el uso del agente de contratos</p>
          </div>
          <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style="background: var(--color-primary-subtle); border: 1px solid var(--color-primary-light)">
            <svg lucideCircleQuestionMark class="w-5 h-5" style="color: var(--color-primary)"></svg>
          </div>
        </div>

        <div class="flex flex-col gap-2.5">
          @for (item of preguntas; track $index) {
            <div class="card" style="padding: 0; overflow: hidden">
              <button type="button" (click)="toggle($index)"
                class="w-full flex items-center justify-between gap-3 text-left"
                style="padding: 1rem 1.25rem; background: transparent; border: none; cursor: pointer">
                <span style="color: var(--color-text-primary); font-weight: 600; font-size: var(--font-size-sm)">
                  {{ item.pregunta }}
                </span>
                <svg lucideChevronDown class="w-4 h-4 shrink-0" style="color: var(--color-text-muted); transition: transform var(--transition-fast)"
                  [style.transform]="abierto() === $index ? 'rotate(180deg)' : 'rotate(0deg)'"></svg>
              </button>
              @if (abierto() === $index) {
                <div style="padding: 0 1.25rem 1.1rem; color: var(--color-text-secondary); font-size: var(--font-size-sm); line-height: 1.6">
                  {{ item.respuesta }}
                </div>
              }
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class FaqComponent {
  readonly preguntas = PREGUNTAS_FRECUENTES;
  readonly abierto = signal<number | null>(0);

  toggle(index: number): void {
    this.abierto.update((actual) => (actual === index ? null : index));
  }
}
