import { Component, input, computed } from '@angular/core';
import {
  LucideFileText, LucideCircleCheck, LucideAlertCircle, LucideLoader2,
  LucideServer, LucideBrainCircuit,
} from '@lucide/angular';
import { UploadTask } from '../../../core/models/collection.model';

type StepState = 'done' | 'active' | 'pending';

interface StepVm {
  shortLabel: string;
  state: StepState;
  icon: 'server' | 'brain' | 'check';
}

const STEP_ORDER = ['uploading', 'vectorizing', 'done'] as const;
const STEP_META = [
  { shortLabel: 'Subiendo',   icon: 'server' as const },
  { shortLabel: 'Vectorizar', icon: 'brain' as const },
  { shortLabel: 'Completado', icon: 'check' as const },
];
const STEP_LABELS = [
  'Subiendo archivo...',
  'Indexando y vectorizando...',
  'Completado',
];

@Component({
  selector: 'app-upload-task',
  standalone: true,
  imports: [
    LucideFileText, LucideCircleCheck, LucideAlertCircle, LucideLoader2,
    LucideServer, LucideBrainCircuit,
  ],
  template: `
    <div class="bg-zinc-900 border rounded-2xl overflow-hidden"
      [class.border-zinc-800]="task().step !== 'done' && task().step !== 'error'"
      [class.border-emerald-500]="task().step === 'done'"
      [class.border-red-800]="task().step === 'error'">

      <!-- Header del archivo -->
      <div class="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
        <div class="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
          <svg lucideFileText class="w-4 h-4 text-zinc-400"></svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-zinc-200 truncate">{{ task().fileName }}</p>
          <p class="text-xs text-zinc-500 mt-0.5">{{ formatSize(task().fileSize) }}</p>
        </div>

        @if (task().step === 'done') {
          <div class="flex items-center gap-1.5 text-xs text-emerald-400 font-medium shrink-0">
            <svg lucideCircleCheck class="w-4 h-4"></svg>
            Completado
          </div>
        }
        @if (task().step === 'error') {
          <div class="flex items-center gap-1.5 text-xs text-red-400 font-medium shrink-0">
            <svg lucideAlertCircle class="w-4 h-4"></svg>
            Error
          </div>
        }
        @if (task().step !== 'done' && task().step !== 'error') {
          <div class="flex items-center gap-1.5 text-xs text-cyan-400 shrink-0">
            <svg lucideLoader2 class="w-4 h-4 animate-spin"></svg>
            Procesando...
          </div>
        }
      </div>

      <!-- Stepper -->
      <div class="px-5 py-4 space-y-4">
        <div class="flex items-start">
          @for (step of stepVms(); track step.shortLabel; let last = $last) {
            <div class="flex flex-col items-center flex-1">
              <div class="flex flex-col items-center gap-2">
                <!-- Dot -->
                <div class="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                  [class.border-emerald-500]="step.state === 'done'"
                  [class.bg-emerald-900]="step.state === 'done'"
                  [class.border-cyan-500]="step.state === 'active'"
                  [class.bg-cyan-950]="step.state === 'active'"
                  [class.border-zinc-700]="step.state === 'pending'"
                  [class.bg-zinc-800]="step.state === 'pending'">

                  @if (step.state === 'done') {
                    <svg lucideCircleCheck class="w-3.5 h-3.5 text-emerald-400"></svg>
                  }
                  @if (step.state === 'active') {
                    <svg lucideLoader2 class="w-3.5 h-3.5 text-cyan-400 animate-spin"></svg>
                  }
                  @if (step.state === 'pending' && step.icon === 'server') {
                    <svg lucideServer class="w-3 h-3 text-zinc-600"></svg>
                  }
                  @if (step.state === 'pending' && step.icon === 'brain') {
                    <svg lucideBrainCircuit class="w-3 h-3 text-zinc-600"></svg>
                  }
                  @if (step.state === 'pending' && step.icon === 'check') {
                    <svg lucideCircleCheck class="w-3 h-3 text-zinc-600"></svg>
                  }
                </div>

                <!-- Label -->
                <p class="text-center text-xs leading-tight transition-colors duration-300 max-w-20"
                  [class.text-emerald-400]="step.state === 'done'"
                  [class.text-cyan-400]="step.state === 'active'"
                  [class.font-medium]="step.state === 'active'"
                  [class.text-zinc-600]="step.state === 'pending'">
                  {{ step.shortLabel }}
                </p>
              </div>
            </div>

            @if (!last) {
              <div class="h-px flex-1 mt-3.5 rounded-full transition-all duration-500"
                [class.bg-emerald-500]="step.state === 'done'"
                [class.bg-cyan-700]="step.state === 'active'"
                [class.bg-zinc-800]="step.state === 'pending'">
              </div>
            }
          }
        </div>

        <!-- Mensaje de estado -->
        @if (task().step !== 'done' && task().step !== 'error' && task().step !== 'idle') {
          <div class="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2">
            <svg lucideLoader2 class="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0"></svg>
            <p class="text-xs text-cyan-300">{{ currentStepLabel() }}</p>
          </div>
        }

        @if (task().step === 'done') {
          <div class="flex items-center gap-2 bg-zinc-800 border border-emerald-800 rounded-xl px-3 py-2">
            <svg lucideCircleCheck class="w-3.5 h-3.5 text-emerald-400 shrink-0"></svg>
            <p class="text-xs text-emerald-300">Vectorizado e indexado correctamente.</p>
          </div>
        }

        @if (task().step === 'error') {
          <div class="flex items-center gap-2 bg-zinc-800 border border-red-800 rounded-xl px-3 py-2">
            <svg lucideAlertCircle class="w-3.5 h-3.5 text-red-400 shrink-0"></svg>
            <p class="text-xs text-red-300">{{ task().error ?? 'Error durante el proceso.' }}</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class UploadTaskComponent {
  readonly task = input.required<UploadTask>();

  readonly stepVms = computed<StepVm[]>(() => {
    const currentIdx = STEP_ORDER.indexOf(
      this.task().step as (typeof STEP_ORDER)[number],
    );

    return STEP_META.map((meta, i) => {
      let state: StepState = 'pending';
      if (this.task().step === 'error') {
        state = i < currentIdx ? 'done' : 'pending';
      } else if (i < currentIdx || this.task().step === 'done') {
        state = 'done';
      } else if (i === currentIdx) {
        state = 'active';
      }
      return { ...meta, state };
    });
  });

  readonly currentStepLabel = computed(() => {
    const idx = STEP_ORDER.indexOf(
      this.task().step as (typeof STEP_ORDER)[number],
    );
    return idx >= 0 ? STEP_LABELS[idx] : '';
  });

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
}
