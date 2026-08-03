import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  LucideRefreshCw, LucideSearch, LucideCircleAlert, LucideFileUp,
  LucideCloudUpload, LucideDownload, LucideTriangleAlert,
  LucideChevronLeft, LucideChevronRight, LucideChevronsLeft, LucideChevronsRight,
  LucideX,
  LucideTrash2, LucideEye,
} from '@lucide/angular';
import { KnowledgeDocument, DocumentStatus, KnowledgeBaseConfig } from '../../../core/models/document.model';
import { UploadTask } from '../../../core/models/collection.model';
import { CollectionsService } from '../../../core/services/collections.service';
import { BitacoraService } from '../../../core/services/bitacora.service';
import { UploadPipelinePanelComponent } from '../../../shared/upload-pipeline-panel.component';
import { DocumentViewerModalComponent, DocumentoVisor } from '../../../shared/document-viewer-modal.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-knowledge-base',
  imports: [
    UploadPipelinePanelComponent, DocumentViewerModalComponent,
    LucideRefreshCw, LucideSearch, LucideCircleAlert, LucideFileUp,
    LucideCloudUpload, LucideDownload, LucideTriangleAlert,
    LucideChevronLeft, LucideChevronRight, LucideChevronsLeft, LucideChevronsRight,
    LucideX, LucideTrash2, LucideEye,
  ],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="inbox-page">

        <!-- ── Encabezado ── -->
        <div class="inbox-page__header">
          <div>
            <h1 class="inbox-page__title">{{ config.title }}</h1>
            <p class="inbox-page__subtitle">
              @if (loading()) { Cargando documentos… }
              @if (!loading()) { {{ apiDocuments().length }} documentos indexados }
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="refresh()" [disabled]="loading()" class="btn-clear">
              <svg lucideRefreshCw class="w-4 h-4" [class.animate-spin]="loading()"></svg>
              Refrescar
            </button>
            <button (click)="openUploadModal()" class="btn-upload"
              style="letter-spacing: .04em; text-transform: uppercase; font-size: var(--font-size-xs)">
              <svg lucideFileUp class="w-4 h-4"></svg>
              Cargar documentación
            </button>
          </div>
        </div>

        <!-- ── Error de carga ── -->
        @if (loadError()) {
          <div class="flex items-start gap-3 rounded-xl px-4 py-3"
            style="background: var(--color-danger-light); border: 1px solid rgba(239,68,68,.3)">
            <svg lucideCircleAlert class="w-5 h-5 shrink-0 mt-0.5" style="color: var(--color-danger)"></svg>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium" style="color: #991b1b">Error al cargar documentos</p>
              <p class="text-xs mt-0.5" style="color: #991b1b">{{ loadError() }}</p>
            </div>
            <button (click)="refresh()" class="text-xs font-medium shrink-0" style="color: #991b1b">
              Reintentar
            </button>
          </div>
        }

        <!-- ── Filtros ── -->
        <section class="filter-card">
          <p class="filter-card__label">Filtros</p>
          <div class="flex gap-3 flex-wrap">
            <div class="filter-search-field" style="flex: 1; min-width: 200px">
              <svg lucideSearch class="filter-search-field__icon w-4 h-4"></svg>
              <input class="filter-input" type="text" placeholder="Buscar por nombre…"
                [value]="searchQuery()" (input)="onSearch($event)" />
            </div>
            @if (searchQuery()) {
              <button class="btn-clear" (click)="clearFilters()">
                <svg lucideX class="w-4 h-4"></svg>
                Limpiar
              </button>
            }

          </div>
        </section>

        <!-- ── Tabla ── -->
        <div class="table-card">
          <div class="table-card__scroll">
            <table class="inbox-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Formato</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th class="inbox-table__actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (i of [1,2,3,4,5]; track i) {
                    <tr>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-3/5"></div></td>
                      <td><div class="h-5 w-12 bg-slate-100 rounded-full animate-pulse"></div></td>
                      <td><div class="h-3 bg-slate-100 rounded-full animate-pulse w-24"></div></td>
                      <td><div class="h-5 w-20 bg-slate-100 rounded-full animate-pulse"></div></td>
                      <td class="inbox-table__actions"><div class="h-6 w-6 bg-slate-100 rounded animate-pulse mx-auto"></div></td>
                    </tr>
                  }
                }

                @if (!loading() && paginatedDocuments().length === 0) {
                  <tr>
                    <td colspan="5" class="inbox-table__state">
                      @if (searchQuery()) {
                        Sin resultados para los filtros aplicados
                      } @else {
                        No hay documentos indexados aún
                      }
                    </td>
                  </tr>
                }

                @for (doc of paginatedDocuments(); track doc.id) {
                  <tr>
                    <td>
                      <span class="font-medium">
                        {{ doc.name }}
                      </span>
                    </td>
                    <td>
                      <span class="det-badge det-badge--neutral">
                        <span class="det-badge__dot"></span>
                        {{ doc.type.toUpperCase() }}
                      </span>
                    </td>
                    <td style="color: var(--color-text-secondary); white-space: nowrap">
                      {{ formatDate(doc.uploadedAt) }}
                    </td>
                    <td>
                      <span class="det-badge det-badge--neutral">
                        <span class="det-badge__dot"></span>
                        {{ getStatusLabel(doc.status) }}
                      </span>
                    </td>
                    <td class="inbox-table__actions">
                      <div class="flex items-center justify-center gap-1">
                        @if (doc.url) {
                          <button (click)="verDocumento(doc)" type="button"
                            class="btn-actions-menu" title="Ver documento">
                            <svg lucideEye class="w-4 h-4"></svg>
                          </button>
                          <a [href]="doc.downloadUrl" rel="noopener"
                            (click)="registrarDescarga(doc); $event.stopPropagation()"
                            class="btn-actions-menu" title="Descargar documento">
                            <svg lucideDownload class="w-4 h-4"></svg>
                          </a>
                        }
                        <button (click)="deleteDocument(doc.id, $event)"
                          class="btn-actions-menu" title="Eliminar documento"
                          style="color: var(--color-danger)">
                          <svg lucideTrash2 class="w-4 h-4"></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (!loading() && filteredDocuments().length > 0) {
            <div class="pagination">
              <span class="pagination__info">
                Mostrando {{ pageStart() }}–{{ pageEnd() }} de {{ filteredDocuments().length }}
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
    </div>

    <!-- ══════════════════════════════════════════════════════
         Modal — Cargar documentación
    ══════════════════════════════════════════════════════ -->
    @if (uploadModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center"
        style="background: rgba(82,85,99,.45); backdrop-filter: blur(10px)"
        (click)="closeUploadModal()">

        <div class="w-full max-w-lg mx-4 flex flex-col overflow-hidden"
          style="background: var(--color-surface); border-radius: 24px;
                 box-shadow: 0 32px 80px rgba(17,24,39,.24);
                 border: 1px solid rgba(148,27,128,.08);
                 max-height: 90vh;"
          (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                style="background: var(--color-primary-subtle); border: 1px solid var(--color-primary-light)">
                <svg lucideFileUp class="w-5 h-5" style="color: var(--color-primary)"></svg>
              </div>
              <div>
                <h2 class="text-base font-semibold" style="color: var(--color-text-primary)">
                  Cargar documentación
                </h2>                
              </div>
            </div>
            <button (click)="closeUploadModal()" class="icon-button" title="Cerrar">
              <svg lucideX class="w-4 h-4"></svg>
            </button>
          </div>

          <div style="border-top: 1px solid var(--color-border)"></div>          

          <!-- Cuerpo con scroll -->
          <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

            <input #fileInput type="file" multiple accept=".pdf,.docx,.txt,.xlsx,.csv"
              class="hidden" (change)="onFileSelected($event)" />

            <!-- Dropzone -->
            <div
              class="document-dropzone"
              [class.document-dropzone--dragging]="isDragging()"
              tabindex="0"
              role="button"
              aria-label="Zona de carga de archivos"
              (click)="fileInput.click()"
              (keydown.enter)="fileInput.click()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave()"
              (drop)="onDrop($event)"
            >
              <div class="document-dropzone__icon" aria-hidden="true">
                <svg lucideCloudUpload style="width: 40px; height: 40px"></svg>
              </div>
              <strong>
                {{ isDragging() ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí' }}
              </strong>
              <span style="color: var(--color-text-secondary); font-size: var(--font-size-sm)">
                O haz clic para seleccionar manualmente desde tu dispositivo
              </span>
              <small style="letter-spacing: .06em; text-transform: uppercase">
                Formato aceptado: PDF · DOCX · TXT · XLSX · CSV
              </small>
            </div>

            <!-- Pipeline -->
            @if (uploadTasks().length > 0) {
              <div>
                <p class="text-xs font-bold uppercase mb-2"
                  style="color: var(--color-text-secondary); letter-spacing: .08em">
                  Archivos listos para procesar
                  <span class="ml-2 font-normal" style="color: var(--color-text-muted)">
                    {{ uploadTasks().length }} en espera
                  </span>
                </p>
                <app-upload-pipeline-panel
                  [tasks]="uploadTasks()"
                  (clearDone)="onClearDone()"
                  (clearAll)="onClearAll()" />
              </div>
            }            

          </div>

          <!-- Footer -->
          <div class="flex gap-3 px-6 py-4 shrink-0" style="border-top: 1px solid var(--color-border)">
            <button (click)="closeUploadModal()" class="secondary-button flex-1">
              Cancelar
            </button>
            <button (click)="closeUploadModal()" class="primary-button flex-1"
              [style.opacity]="hasActiveTasks() ? '0.55' : '1'">
              {{ hasActiveTasks() ? 'Procesando…' : 'Cerrar' }}
            </button>
          </div>

        </div>
      </div>
    }

    <!-- ── Modal confirmación borrado ── -->
    @if (confirmDoc()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center"
        style="background: rgba(82,85,99,.42); backdrop-filter: blur(9px)"
        (click)="cancelDelete()">
        <div class="w-full max-w-sm mx-4 overflow-hidden"
          style="background: var(--color-surface); border-radius: 28px;
                 box-shadow: 0 26px 70px rgba(17,24,39,.22);
                 border: 1px solid rgba(148,27,128,.08)"
          (click)="$event.stopPropagation()">

          <div class="px-6 pt-6 pb-4 flex flex-col items-center text-center gap-3">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center"
              style="background: var(--color-danger-light)">
              <svg lucideTriangleAlert class="w-6 h-6" style="color: var(--color-danger)"></svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold" style="color: var(--color-text-primary)">
                Eliminar documento
              </h3>
              <p class="text-xs mt-1 leading-relaxed" style="color: var(--color-text-secondary)">
                ¿Estás seguro de que deseas eliminar
                <span class="font-medium" style="color: var(--color-text-primary)">
                  {{ confirmDoc()!.name }}
                </span>?
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          <div class="flex gap-2 px-6 pb-6">
            <button (click)="cancelDelete()" class="secondary-button flex-1">
              Cancelar
            </button>
            <button (click)="confirmDelete()" [disabled]="deletingId() !== null"
              class="flex-1 inline-flex items-center justify-center gap-2 font-semibold text-sm text-white"
              style="height: 40px; border-radius: var(--radius-full); border: none; cursor: pointer;
                     background: var(--color-danger); transition: background var(--transition-fast)"
              [style.opacity]="deletingId() !== null ? '0.5' : '1'">
              @if (deletingId() !== null) {
                <svg lucideRefreshCw class="w-3.5 h-3.5 animate-spin"></svg>
                Eliminando…
              } @else {
                <svg lucideTrash2 class="w-3.5 h-3.5"></svg>
                Eliminar
              }
            </button>
          </div>

        </div>
      </div>
    }

    <app-document-viewer-modal [documento]="documentoAbierto()" (cerrar)="documentoAbierto.set(null)" />
  `,
})
export class KnowledgeBaseComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(CollectionsService);
  private readonly bitacoraSvc = inject(BitacoraService);

  config!: KnowledgeBaseConfig;

  readonly isDragging = signal(false);
  readonly searchQuery = signal('');
  readonly statusFilter = signal('');
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly uploadTasks = signal<UploadTask[]>([]);
  readonly apiDocuments = signal<KnowledgeDocument[]>([]);
  readonly deletingId = signal<string | null>(null);
  readonly confirmDoc = signal<KnowledgeDocument | null>(null);
  readonly uploadModalOpen = signal(false);
  readonly documentoAbierto = signal<DocumentoVisor | null>(null);

  readonly currentPage = signal(1);

  readonly filteredDocuments = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const st = this.statusFilter();
    return this.apiDocuments().filter((d) => {
      const matchQuery = !q || d.name.toLowerCase().includes(q);
      const matchStatus = !st || d.status === st;
      return matchQuery && matchStatus;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredDocuments().length / PAGE_SIZE))
  );

  readonly paginatedDocuments = computed(() =>
    this.filteredDocuments().slice(
      (this.currentPage() - 1) * PAGE_SIZE,
      this.currentPage() * PAGE_SIZE,
    )
  );

  readonly pageStart = computed(() =>
    this.filteredDocuments().length === 0
      ? 0
      : (this.currentPage() - 1) * PAGE_SIZE + 1
  );

  readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * PAGE_SIZE, this.filteredDocuments().length)
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
    this.config = this.route.snapshot.data['config'] as KnowledgeBaseConfig;
    this.loadDocuments();
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  openUploadModal(): void { this.uploadModalOpen.set(true); }
  closeUploadModal(): void { this.uploadModalOpen.set(false); }

  hasActiveTasks(): boolean {
    return this.uploadTasks().some(t => t.step !== 'done' && t.step !== 'error');
  }

  // ── Paginación ────────────────────────────────────────────────────────────
  goToPage(p: number): void { this.currentPage.set(p); }
  prevPage(): void { this.currentPage.update(p => Math.max(1, p - 1)); }
  nextPage(): void { this.currentPage.update(p => Math.min(this.totalPages(), p + 1)); }

  // ── Carga ─────────────────────────────────────────────────────────────────
  loadDocuments(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.svc.getDocuments(this.config.collection, this.config.expediente).subscribe({
      next: (items) => {
        this.apiDocuments.set(
          items.map((item) => ({
            id: item.id,
            name: item.nombre,
            size: item.size,
            type: this.extensionDe(item.nombre, item.content_type),
            status: 'indexed' as DocumentStatus,
            uploadedAt: new Date(item.created_at),
            url: this.svc.contentUrl(item.id),
            downloadUrl: this.svc.contentUrl(item.id, true),
          })),
        );
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err.message ?? 'Error desconocido al conectar con el servidor.');
        this.loading.set(false);
      },
    });
  }

  refresh(): void { this.loadDocuments(); }

  // ── Filtros ───────────────────────────────────────────────────────────────
  onSearch(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onStatusFilter(e: Event): void {
    this.statusFilter.set((e.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.currentPage.set(1);
  }

  // ── Visor ─────────────────────────────────────────────────────────────────
  verDocumento(doc: KnowledgeDocument): void {
    if (!doc.url) return;
    this.documentoAbierto.set({ name: doc.name, url: doc.url, type: doc.type });
  }

  registrarDescarga(doc: KnowledgeDocument): void {
    this.registrarBitacora('DESCARGAR', doc.id, doc.name, true);
  }

  // ── Borrar ────────────────────────────────────────────────────────────────
  deleteDocument(id: string, e: Event): void {
    e.stopPropagation();
    const doc = this.apiDocuments().find(d => d.id === id) ?? null;
    this.confirmDoc.set(doc);
  }

  cancelDelete(): void { this.confirmDoc.set(null); }

  confirmDelete(): void {
    const doc = this.confirmDoc();
    if (!doc) return;

    this.deletingId.set(doc.id);
    this.svc.deleteDocument(doc.id, this.config.collection).subscribe({
      next: () => {
        this.apiDocuments.update(docs => docs.filter(d => d.id !== doc.id));
        this.deletingId.set(null);
        this.confirmDoc.set(null);
        this.registrarBitacora('ELIMINAR', doc.id, doc.name, true);
      },
      error: () => {
        this.deletingId.set(null);
        this.confirmDoc.set(null);
        this.registrarBitacora('ELIMINAR', doc.id, doc.name, false);
      },
    });
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void { this.isDragging.set(false); }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    this.processFiles(Array.from(e.dataTransfer?.files ?? []));
  }

  onFileSelected(e: Event): void {
    this.processFiles(Array.from((e.target as HTMLInputElement).files ?? []));
    (e.target as HTMLInputElement).value = '';
  }

  // ── Pipeline ──────────────────────────────────────────────────────────────
  private processFiles(files: File[]): void {
    for (const file of files) {
      const task: UploadTask = {
        id: crypto.randomUUID(),
        fileName: file.name,
        fileSize: file.size,
        step: 'uploading',
      };

      this.uploadTasks.update((t) => [task, ...t]);

      this.svc.uploadAndIndex(file, this.config).subscribe({
        next: ({ step, archivo }) => {
          this.uploadTasks.update((tasks) =>
            tasks.map((t) => (t.id === task.id ? { ...t, step } : t)),
          );
          if (step === 'done') {
            setTimeout(() => this.loadDocuments(), 1200);
            this.registrarBitacora('CREAR', archivo?.id ?? '', archivo?.nombre ?? file.name, true);
          }
        },
        error: (err: Error) => {
          this.uploadTasks.update((tasks) =>
            tasks.map((t) =>
              t.id === task.id ? { ...t, step: 'error', error: err.message } : t,
            ),
          );
          this.registrarBitacora('CREAR', '', file.name, false);
        },
      });
    }
  }

  onClearDone(): void {
    this.uploadTasks.update((tasks) =>
      tasks.filter((t) => t.step !== 'done' && t.step !== 'error'),
    );
  }

  onClearAll(): void { this.uploadTasks.set([]); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getStatusLabel(status: DocumentStatus): string {
    return { indexed: 'Indexado', processing: 'Procesando', error: 'Error' }[status];
  }

  getStatusBadgeClass(status: DocumentStatus): string {
    if (status === 'indexed') return 'det-badge--success';
    if (status === 'processing') return 'det-badge--warning';
    if (status === 'error') return 'det-badge--danger';
    return 'det-badge--neutral';
  }

  getExtBadgeClass(ext: string): string {
    const e = ext?.toLowerCase() ?? '';
    if (e === 'pdf') return 'det-badge--danger';
    if (e === 'xlsx' || e === 'csv') return 'det-badge--success';
    if (e === 'docx' || e === 'doc') return 'det-badge--primary';
    return 'det-badge--neutral';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private extensionDe(nombre: string, contentType: string): string {
    const fromName = nombre.includes('.') ? nombre.split('.').pop() : undefined;
    if (fromName) return fromName.toLowerCase();
    return (contentType?.split('/').pop() ?? 'file').toLowerCase();
  }

  private registrarBitacora(accion: string, documentoId: string, documentoNombre: string, exitoso: boolean): void {
    this.bitacoraSvc.registrar({
      expediente: this.config.expediente,
      pantalla: this.config.title,
      documento_id: documentoId,
      documento_nombre: documentoNombre,
      accion,
      exitoso,
    }).subscribe();
  }
}
