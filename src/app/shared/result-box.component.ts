import { Component, input } from '@angular/core';
import { LucideCircleCheck, LucideCircleX } from '@lucide/angular';

export type ActionStatus = 'idle' | 'loading' | 'ok' | 'error';

export interface ActionState {
  status: ActionStatus;
  message: string;
  raw: string;
}

/** Caja de resultado genérica para consolas de administración: mensaje + JSON crudo del backend. */
@Component({
  selector: 'app-result-box',
  standalone: true,
  imports: [LucideCircleCheck, LucideCircleX],
  template: `
    @if (state().status === 'ok' || state().status === 'error') {
      <div class="flex items-start gap-2" style="font-size: var(--font-size-xs)">
        @if (state().status === 'ok') {
          <svg lucideCircleCheck class="w-3.5 h-3.5 shrink-0 mt-0.5" style="color: var(--color-success)"></svg>
        } @else {
          <svg lucideCircleX class="w-3.5 h-3.5 shrink-0 mt-0.5" style="color: var(--color-danger)"></svg>
        }
        <span [style.color]="state().status === 'ok' ? 'var(--color-text-secondary)' : 'var(--color-danger)'">
          {{ state().message }}
        </span>
      </div>
    }
    @if (state().raw) {
      <pre style="background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md);
                   padding: .65rem .75rem; font-size: .68rem; line-height: 1.5; max-height: 220px; overflow: auto;
                   white-space: pre-wrap; word-break: break-all; color: var(--color-text-secondary);
                   font-family: ui-monospace, monospace">{{ state().raw }}</pre>
    }
  `,
})
export class ResultBoxComponent {
  readonly state = input.required<ActionState>();
}
