import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideFolderOpen, LucideFolder, LucideFolderPlus, LucidePlus,
  LucideCloudUpload, LucideTrash2, LucideX, LucideLoader2,
  LucideZap, LucideDatabase, LucideAlertCircle,
} from '@lucide/angular';
import { CollectionsService } from '../../../core/services/collections.service';
import { Collection, UploadTask } from '../../../core/models/collection.model';
import { KnowledgeBaseConfig } from '../../../core/models/document.model';
import { UploadTaskComponent } from './upload-task.component';

@Component({
  selector: 'app-collection-manager',
  standalone: true,
  imports: [
    FormsModule,
    UploadTaskComponent,
    LucideFolderOpen, LucideFolder, LucideFolderPlus, LucidePlus,
    LucideCloudUpload, LucideTrash2, LucideX, LucideLoader2,
    LucideZap, LucideDatabase, LucideAlertCircle,
  ],
  styles: [`
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.08), 0 0 60px rgba(16,185,129,0.04); }
      50%       { box-shadow: 0 0 40px rgba(16,185,129,0.18), 0 0 80px rgba(16,185,129,0.08); }
    }
    .drop-glow        { animation: glowPulse 3s ease-in-out infinite; }

    @keyframes glowActive {
      0%, 100% { box-shadow: 0 0 50px rgba(16,185,129,0.3), 0 0 100px rgba(16,185,129,0.15); }
      50%       { box-shadow: 0 0 70px rgba(16,185,129,0.4), 0 0 140px rgba(16,185,129,0.2); }
    }
    .drop-glow-active { animation: glowActive 1.2s ease-in-out infinite; }

    .collection-selected {
      box-shadow: 0 0 0 1px rgba(16,185,129,0.45), 0 0 18px rgba(16,185,129,0.1);
    }

    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .task-enter { animation: slideInRight 0.35s cubic-bezier(0.16,1,0.3,1); }

    @keyframes shimmerDark {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }
    .sk {
      background: linear-gradient(90deg, #18181b 25%, #27272a 50%, #18181b 75%);
      background-size: 200% 100%;
      animation: shimmerDark 1.8s infinite;
      border-radius: 0.5rem;
    }
  `],
  template: `
    <div class="h-full flex flex-col bg-zinc-950 overflow-hidden">

      <!-- Top bar -->
      <header class="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <svg lucideDatabase class="w-3.5 h-3.5 text-white"></svg>
          </div>
          <span class="text-sm font-semibold text-zinc-200">Colecciones IA</span>
          <div class="h-4 w-px bg-zinc-800"></div>
          <div class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span class="text-xs text-zinc-500">{{ collections().length }} colecciones activas</span>
          </div>
        </div>
      </header>

      <!-- Split layout -->
      <div class="flex-1 flex overflow-hidden">

        <!-- ═══ PANEL IZQUIERDO — Colecciones (1/3) ═══════════════════ -->
        <aside class="w-80 shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col overflow-hidden">

          <!-- Panel header -->
          <div class="px-5 py-5 border-b border-zinc-800">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-sm font-semibold text-zinc-100">Mis Colecciones</h2>
                <p class="text-xs text-zinc-500 mt-0.5">Organiza el conocimiento</p>
              </div>
              <button (click)="showCreateForm.set(!showCreateForm())"
                class="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700
                       flex items-center justify-center transition-all duration-200 text-zinc-400 hover:text-zinc-200">
                @if (showCreateForm()) {
                  <svg lucideX class="w-3.5 h-3.5"></svg>
                }
                @if (!showCreateForm()) {
                  <svg lucidePlus class="w-3.5 h-3.5"></svg>
                }
              </button>
            </div>

            <!-- Create form -->
            @if (showCreateForm()) {
              <div class="rounded-xl border border-zinc-700 bg-zinc-800 p-3 space-y-2.5">
                <div class="flex items-center gap-2">
                  <svg lucideFolderPlus class="w-4 h-4 text-emerald-500 shrink-0"></svg>
                  <span class="text-xs font-semibold text-zinc-300">Nueva Colección</span>
                </div>
                <input [(ngModel)]="newCollectionName" type="text"
                  placeholder="Nombre de la colección..."
                  (keydown.enter)="createCollection()"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200
                         placeholder-zinc-600 focus:outline-none focus:border-emerald-600
                         focus:ring-1 focus:ring-emerald-600/30 transition-all duration-200" />
                <div class="flex gap-2">
                  <button (click)="createCollection()"
                    [disabled]="!newCollectionName.trim() || creatingCollection()"
                    class="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500
                           text-white text-xs font-semibold py-2 rounded-lg transition-all duration-200
                           disabled:opacity-40 disabled:cursor-not-allowed">
                    @if (creatingCollection()) {
                      <svg lucideLoader2 class="w-3.5 h-3.5 animate-spin"></svg>
                    }
                    @if (!creatingCollection()) {
                      <svg lucidePlus class="w-3.5 h-3.5"></svg>
                    }
                    Crear
                  </button>
                  <button (click)="showCreateForm.set(false)"
                    class="px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-all">
                    Cancelar
                  </button>
                </div>
                @if (createError()) {
                  <p class="text-xs text-red-400 flex items-center gap-1">
                    <svg lucideAlertCircle class="w-3.5 h-3.5 shrink-0"></svg>
                    {{ createError() }}
                  </p>
                }
              </div>
            }
          </div>

          <!-- Collections list -->
          <div class="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
            @if (collections().length === 0) {
              <div class="flex flex-col items-center gap-3 py-12 text-center px-4">
                <div class="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <svg lucideDatabase class="w-6 h-6 text-zinc-600"></svg>
                </div>
                <p class="text-sm font-medium text-zinc-400">Sin colecciones</p>
                <p class="text-xs text-zinc-600">Crea tu primera colección</p>
              </div>
            }

            @for (col of collections(); track col.id) {
              <div (click)="selectCollection(col)"
                class="group relative rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden bg-zinc-800"
                [class.border-emerald-600]="isSelected(col)"
                [class.collection-selected]="isSelected(col)"
                [class.border-zinc-700]="!isSelected(col)"
                [class.hover:border-zinc-600]="!isSelected(col)">

                <!-- Accent bar -->
                <div class="absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200"
                  [class.bg-emerald-500]="isSelected(col)"
                  [class.bg-transparent]="!isSelected(col)"></div>

                <div class="flex items-center gap-3 px-4 py-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
                    [class.bg-emerald-900]="isSelected(col)"
                    [class.bg-zinc-700]="!isSelected(col)">
                    @if (isSelected(col)) {
                      <svg lucideFolderOpen class="w-4 h-4 text-emerald-400"></svg>
                    }
                    @if (!isSelected(col)) {
                      <svg lucideFolder class="w-4 h-4 text-zinc-400"></svg>
                    }
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate transition-colors"
                      [class.text-emerald-300]="isSelected(col)"
                      [class.text-zinc-200]="!isSelected(col)">
                      {{ col.name }}
                    </p>
                    <p class="text-xs text-zinc-500 mt-0.5">
                      {{ col.documentCount }} {{ col.documentCount === 1 ? 'doc' : 'docs' }}
                    </p>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <button (click)="deleteCollection($event, col.id)"
                      class="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-600
                             hover:text-red-400 hover:bg-zinc-700 transition-all duration-200">
                      <svg lucideTrash2 class="w-3.5 h-3.5"></svg>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Panel footer -->
          <div class="px-4 py-3 border-t border-zinc-800">
            <div class="flex items-center gap-2 text-xs text-zinc-600">
              <svg lucideZap class="w-3.5 h-3.5 text-emerald-700"></svg>
              <span>Selecciona una colección para indexar</span>
            </div>
          </div>
        </aside>

        <!-- ═══ PANEL DERECHO — Workspace (2/3) ═══════════════════════ -->
        <main class="flex-1 flex flex-col overflow-hidden bg-zinc-950">

          <!-- Workspace header -->
          <div class="px-8 py-5 border-b border-zinc-800 shrink-0">
            <h2 class="text-sm font-semibold text-zinc-200">Workspace de Indexación</h2>
            @if (selectedCollection()) {
              <p class="text-xs text-zinc-500 mt-0.5">
                Indexando en
                <span class="text-emerald-400 font-medium">{{ selectedCollection()!.name }}</span>
              </p>
            }
            @if (!selectedCollection()) {
              <p class="text-xs text-zinc-500 mt-0.5">Selecciona una colección en el panel izquierdo</p>
            }
          </div>

          <div class="flex-1 overflow-y-auto p-8 space-y-6">

            <!-- Drop Zone -->
            <div class="relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center
                        min-h-64 cursor-pointer transition-all duration-300 overflow-hidden"
              [class.border-emerald-600]="isDragging() || hasCollection()"
              [class.border-zinc-700]="!isDragging() && !hasCollection()"
              [class.bg-zinc-900]="!isDragging()"
              [class.bg-emerald-950]="isDragging()"
              [class.drop-glow]="hasCollection() && !isDragging()"
              [class.drop-glow-active]="isDragging()"
              [class.opacity-40]="!hasCollection()"
              [class.pointer-events-none]="!hasCollection()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave()"
              (drop)="onDrop($event)"
              (click)="hasCollection() && fileInput.click()">

              <!-- Dot grid overlay on drag -->
              <div class="absolute inset-0 transition-opacity duration-300 pointer-events-none
                          bg-[radial-gradient(rgba(16,185,129,0.06)_1px,transparent_1px)] bg-[size:24px_24px]"
                [class.opacity-100]="isDragging()"
                [class.opacity-0]="!isDragging()"></div>

              <div class="relative flex flex-col items-center gap-4 text-center px-8 py-10">
                <div class="w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-300"
                  [class.bg-emerald-900]="isDragging() || hasCollection()"
                  [class.border-emerald-700]="isDragging() || hasCollection()"
                  [class.bg-zinc-800]="!isDragging() && !hasCollection()"
                  [class.border-zinc-700]="!isDragging() && !hasCollection()">
                  @if (isDragging()) {
                    <svg lucideCloudUpload class="w-8 h-8 text-emerald-400 animate-bounce"></svg>
                  }
                  @if (!isDragging()) {
                    <svg lucideCloudUpload class="w-8 h-8"
                      [class.text-emerald-500]="hasCollection()"
                      [class.text-zinc-600]="!hasCollection()"></svg>
                  }
                </div>

                @if (isDragging()) {
                  <div>
                    <p class="text-lg font-semibold text-emerald-300">Suelta el archivo aquí</p>
                    <p class="text-sm text-emerald-500 mt-1">en {{ selectedCollection()!.name }}</p>
                  </div>
                }
                @if (!isDragging() && hasCollection()) {
                  <div>
                    <p class="text-base font-semibold text-zinc-200">Arrastra documentos aquí</p>
                    <p class="text-sm text-zinc-500 mt-1">o <span class="text-emerald-400 underline underline-offset-2">selecciona archivos</span></p>
                    <p class="text-xs text-zinc-600 mt-3">PDF, DOCX, TXT — Flujo completo de vectorización</p>
                  </div>
                }
                @if (!isDragging() && !hasCollection()) {
                  <div>
                    <p class="text-base font-semibold text-zinc-500">Selecciona una colección</p>
                    <p class="text-sm text-zinc-600 mt-1">Para activar el workspace de indexación</p>
                  </div>
                }
              </div>

              <input #fileInput type="file" multiple accept=".pdf,.docx,.txt,.xlsx,.csv"
                class="hidden" (change)="onFileSelected($event)" />
            </div>

            <!-- Pipeline de tareas -->
            @if (uploadTasks().length > 0) {
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <svg lucideZap class="w-4 h-4 text-emerald-500"></svg>
                  <h3 class="text-sm font-semibold text-zinc-200">Pipeline de Vectorización</h3>
                  <span class="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full">
                    {{ uploadTasks().length }}
                  </span>
                </div>

                @for (task of uploadTasks(); track task.id) {
                  <div class="task-enter">
                    <app-upload-task [task]="task" />
                  </div>
                }
              </div>
            }

            <!-- Skeleton placeholder -->
            @if (uploadTasks().length === 0 && hasCollection()) {
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <svg lucideZap class="w-4 h-4 text-zinc-700"></svg>
                  <span class="text-xs text-zinc-700 font-medium">El pipeline aparecerá aquí al subir archivos</span>
                </div>
                <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <div class="flex items-center gap-3">
                    <div class="sk w-8 h-8 shrink-0"></div>
                    <div class="flex-1 space-y-2">
                      <div class="sk h-3 w-48"></div>
                      <div class="sk h-2 w-24"></div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 pt-1">
                    <div class="sk flex-1 h-7 rounded-full"></div>
                    <div class="sk w-8 h-px"></div>
                    <div class="sk flex-1 h-7 rounded-full"></div>
                    <div class="sk w-8 h-px"></div>
                    <div class="sk flex-1 h-7 rounded-full"></div>
                    <div class="sk w-8 h-px"></div>
                    <div class="sk flex-1 h-7 rounded-full"></div>
                  </div>
                </div>
              </div>
            }

          </div>
        </main>
      </div>
    </div>
  `,
})
export class CollectionManagerComponent {
  private readonly svc = inject(CollectionsService);

  readonly showCreateForm = signal(false);
  newCollectionName = '';
  readonly creatingCollection = signal(false);
  readonly createError = signal('');
  readonly isDragging = signal(false);
  readonly selectedCollection = signal<Collection | null>(null);
  readonly uploadTasks = signal<UploadTask[]>([]);

  readonly collections = this.svc.collections;
  readonly hasCollection = computed(() => this.selectedCollection() !== null);

  selectCollection(col: Collection): void {
    this.selectedCollection.set(col);
  }

  isSelected(col: Collection): boolean {
    return this.selectedCollection()?.id === col.id;
  }

  createCollection(): void {
    const name = this.newCollectionName.trim();
    if (!name) return;

    this.creatingCollection.set(true);
    this.createError.set('');

    this.svc.createCollection(name).subscribe({
      next: () => {
        this.newCollectionName = '';
        this.showCreateForm.set(false);
        this.creatingCollection.set(false);
      },
      error: (err: Error) => {
        this.createError.set(err.message ?? 'Error al crear la colección.');
        this.creatingCollection.set(false);
      },
    });
  }

  deleteCollection(event: MouseEvent, id: string): void {
    event.stopPropagation();
    if (this.selectedCollection()?.id === id) this.selectedCollection.set(null);
    this.svc.deleteCollection(id).subscribe();
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    this.processFiles(Array.from(e.dataTransfer?.files ?? []));
  }

  onFileSelected(e: Event): void {
    this.processFiles(Array.from((e.target as HTMLInputElement).files ?? []));
    (e.target as HTMLInputElement).value = '';
  }

  private processFiles(files: File[]): void {
    const collection = this.selectedCollection();
    if (!collection) return;

    for (const file of files) {
      const task: UploadTask = {
        id: crypto.randomUUID(),
        fileName: file.name,
        fileSize: file.size,
        step: 'uploading',
      };

      this.uploadTasks.update((t) => [task, ...t]);

      const cfg: KnowledgeBaseConfig = {
        title: collection.name,
        collection: collection.name,
        expediente: collection.name,
      };
      this.svc.uploadAndIndex(file, cfg).subscribe({
        next: ({ step }) => {
          this.uploadTasks.update((tasks) =>
            tasks.map((t) => (t.id === task.id ? { ...t, step } : t)),
          );
        },
        error: (err: Error) => {
          this.uploadTasks.update((tasks) =>
            tasks.map((t) =>
              t.id === task.id ? { ...t, step: 'error', error: err.message } : t,
            ),
          );
        },
      });
    }
  }
}
