import { Component, input, output, computed } from '@angular/core';
import {
  LucideZap, LucideCheckCircle, LucideLoader2, LucideX,
  LucideServer, LucideCloud, LucideBrainCircuit, LucideFile,
  LucideAlertCircle,
} from '@lucide/angular';
import { UploadTask, UploadStep } from '../core/models/collection.model';

type StepState = 'done' | 'active' | 'pending' | 'error';

interface StepVm {
  label: string;
  shortLabel: string;
  state: StepState;
  icon: 'server' | 'cloud' | 'brain' | 'check';
}

const STEP_ORDER: UploadStep[] = ['uploading', 'signed-url', 'vectorizing', 'done'];

const STEP_META = [
  { label: 'Subiendo a WebContent',        shortLabel: 'WebContent',  icon: 'server' as const },
  { label: 'Generando URL firmada',         shortLabel: 'URL Firmada', icon: 'cloud'  as const },
  { label: 'Vectorizando en wsVector',      shortLabel: 'Vectorizar',  icon: 'brain'  as const },
  { label: 'Indexado correctamente',        shortLabel: 'Completado',  icon: 'check'  as const },
];

function buildStepVms(task: UploadTask): StepVm[] {
  const currentIdx = STEP_ORDER.indexOf(task.step as UploadStep);
  return STEP_META.map((meta, i) => {
    let state: StepState = 'pending';
    if (task.step === 'error') {
      state = i < currentIdx ? 'done' : (i === currentIdx ? 'error' : 'pending');
    } else if (task.step === 'done' || i < currentIdx) {
      state = 'done';
    } else if (i === currentIdx) {
      state = 'active';
    }
    return { ...meta, state };
  });
}

function currentLabel(task: UploadTask): string {
  const idx = STEP_ORDER.indexOf(task.step as UploadStep);
  return idx >= 0 ? STEP_META[idx]?.label ?? '' : '';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

@Component({
  selector: 'app-upload-pipeline-panel',
  standalone: true,
  imports: [
    LucideZap, LucideCheckCircle, LucideLoader2, LucideX,
    LucideServer, LucideCloud, LucideBrainCircuit, LucideFile,
    LucideAlertCircle,
  ],
  styles: [`
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .panel-enter { animation: slideDown 0.3s cubic-bezier(0.16,1,0.3,1); }

    @keyframes taskSlide {
      from { opacity: 0; transform: translateX(12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .task-slide { animation: taskSlide 0.3s cubic-bezier(0.16,1,0.3,1); }
  `],
  template: `
    @if (tasks().length > 0) {
      <div class="panel-enter rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <div class="flex items-center gap-2.5">
            <div class="w-6 h-6 rounded-lg bg-accent-100 border border-accent-200 flex items-center justify-center">
              <svg lucideZap class="w-3.5 h-3.5 text-accent-600"></svg>
            </div>
            <span class="text-sm font-semibold text-slate-800">Pipeline de Vectorización</span>
            <span class="text-xs bg-white text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
              {{ tasks().length }}
            </span>
            @if (pendingCount() > 0) {
              <span class="flex items-center gap-1 text-xs text-accent-600 font-medium">
                <svg lucideLoader2 class="w-3 h-3 animate-spin"></svg>
                {{ pendingCount() }} procesando
              </span>
            }
            @if (pendingCount() === 0) {
              <span class="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <svg lucideCheckCircle class="w-3 h-3"></svg>
                Todos completados
              </span>
            }
          </div>

          <div class="flex items-center gap-2">
            @if (doneCount() > 0) {
              <button (click)="onClearDone()"
                class="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg
                       hover:bg-slate-100 transition-all duration-200">
                Limpiar completados
              </button>
            }
            <button (click)="onClearAll()"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <svg lucideX class="w-4 h-4"></svg>
            </button>
          </div>
        </div>

        <!-- Barra de progreso global -->
        <div class="h-1 bg-slate-100">
          <div class="h-full rounded-full transition-all duration-700"
            [class.bg-gradient-to-r]="pendingCount() > 0"
            [class.from-accent-400]="pendingCount() > 0"
            [class.to-emerald-400]="pendingCount() > 0"
            [class.bg-emerald-400]="pendingCount() === 0"
            [style.width.%]="progressPercent()"></div>
        </div>

        <!-- Lista de tareas -->
        <div class="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          @for (task of tasks(); track task.id) {
            <div class="task-slide px-5 py-4">

              <!-- Encabezado del archivo -->
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <svg lucideFile class="w-4 h-4 text-slate-500"></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-800 truncate">{{ task.fileName }}</p>
                  <p class="text-xs text-slate-400 mt-0.5">{{ formatSize(task.fileSize) }}</p>
                </div>

                @if (task.step === 'done') {
                  <span class="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                    <svg lucideCheckCircle class="w-3.5 h-3.5"></svg>
                    Completado
                  </span>
                }
                @if (task.step === 'error') {
                  <span class="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full shrink-0">
                    <svg lucideAlertCircle class="w-3.5 h-3.5"></svg>
                    Error
                  </span>
                }
                @if (task.step !== 'done' && task.step !== 'error') {
                  <span class="flex items-center gap-1 text-xs text-accent-600 shrink-0">
                    <svg lucideLoader2 class="w-3.5 h-3.5 animate-spin"></svg>
                    Procesando...
                  </span>
                }
              </div>

              <!-- Stepper de 4 pasos -->
              <div class="flex items-start">
                @for (step of buildSteps(task); track step.shortLabel; let last = $last) {
                  <div class="flex flex-col items-center flex-1">
                    <div class="flex flex-col items-center gap-2">

                      <!-- Dot -->
                      <div class="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                        [class.border-emerald-400]="step.state === 'done'"
                        [class.bg-emerald-50]="step.state === 'done'"
                        [class.border-accent-500]="step.state === 'active'"
                        [class.bg-accent-50]="step.state === 'active'"
                        [class.border-red-400]="step.state === 'error'"
                        [class.bg-red-50]="step.state === 'error'"
                        [class.border-slate-200]="step.state === 'pending'"
                        [class.bg-slate-50]="step.state === 'pending'">

                        @if (step.state === 'done') {
                          <svg lucideCheckCircle class="w-3.5 h-3.5 text-emerald-500"></svg>
                        }
                        @if (step.state === 'active') {
                          <svg lucideLoader2 class="w-3.5 h-3.5 text-accent-500 animate-spin"></svg>
                        }
                        @if (step.state === 'error') {
                          <svg lucideAlertCircle class="w-3.5 h-3.5 text-red-500"></svg>
                        }
                        @if (step.state === 'pending' && step.icon === 'server') {
                          <svg lucideServer class="w-3 h-3 text-slate-300"></svg>
                        }
                        @if (step.state === 'pending' && step.icon === 'cloud') {
                          <svg lucideCloud class="w-3 h-3 text-slate-300"></svg>
                        }
                        @if (step.state === 'pending' && step.icon === 'brain') {
                          <svg lucideBrainCircuit class="w-3 h-3 text-slate-300"></svg>
                        }
                        @if (step.state === 'pending' && step.icon === 'check') {
                          <svg lucideCheckCircle class="w-3 h-3 text-slate-300"></svg>
                        }
                      </div>

                      <!-- Label -->
                      <p class="text-center text-xs leading-tight max-w-20 transition-colors duration-300"
                        [class.text-emerald-600]="step.state === 'done'"
                        [class.text-accent-600]="step.state === 'active'"
                        [class.font-semibold]="step.state === 'active'"
                        [class.text-red-500]="step.state === 'error'"
                        [class.text-slate-400]="step.state === 'pending'">
                        {{ step.shortLabel }}
                      </p>
                    </div>
                  </div>

                  @if (!last) {
                    <div class="h-px flex-1 mt-3.5 rounded-full transition-all duration-500"
                      [class.bg-emerald-300]="step.state === 'done'"
                      [class.bg-accent-300]="step.state === 'active'"
                      [class.bg-slate-200]="step.state === 'pending' || step.state === 'error'">
                    </div>
                  }
                }
              </div>

              <!-- Mensaje de estado -->
              @if (task.step !== 'done' && task.step !== 'error' && task.step !== 'idle') {
                <div class="mt-3 flex items-center gap-2 bg-accent-50 border border-accent-100 rounded-xl px-3 py-2">
                  <svg lucideLoader2 class="w-3.5 h-3.5 text-accent-500 animate-spin shrink-0"></svg>
                  <p class="text-xs text-accent-700">{{ getLabel(task) }}</p>
                </div>
              }
              @if (task.step === 'done') {
                <div class="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                  <svg lucideCheckCircle class="w-3.5 h-3.5 text-emerald-500 shrink-0"></svg>
                  <p class="text-xs text-emerald-700">Documento vectorizado e indexado correctamente.</p>
                </div>
              }
              @if (task.step === 'error') {
                <div class="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  <svg lucideAlertCircle class="w-3.5 h-3.5 text-red-500 shrink-0"></svg>
                  <p class="text-xs text-red-700">{{ task.error ?? 'Error durante el proceso.' }}</p>
                </div>
              }

            </div>
          }
        </div>
      </div>
    }
  `,
})
export class UploadPipelinePanelComponent {
  readonly tasks      = input.required<UploadTask[]>();
  readonly clearDone  = output<void>();
  readonly clearAll   = output<void>();

  readonly pendingCount = computed(() =>
    this.tasks().filter((t) => t.step !== 'done' && t.step !== 'error').length,
  );
  readonly doneCount = computed(() =>
    this.tasks().filter((t) => t.step === 'done' || t.step === 'error').length,
  );
  readonly progressPercent = computed(() => {
    const total = this.tasks().length;
    return total === 0 ? 100 : Math.round((this.doneCount() / total) * 100);
  });

  buildSteps(task: UploadTask): StepVm[] { return buildStepVms(task); }
  getLabel(task: UploadTask): string      { return currentLabel(task); }
  formatSize(b: number): string           { return formatSize(b); }

  onClearDone(): void { this.clearDone.emit(); }
  onClearAll(): void  { this.clearAll.emit(); }
}
