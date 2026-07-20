import { Component, inject, input, output, computed, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  LucideFileText, LucideExternalLink, LucideX, LucideFileWarning,
} from '@lucide/angular';

export interface DocumentoVisor {
  name: string;
  url: string;
  type: string;
}

type Categoria = 'pdf' | 'imagen' | 'office' | 'texto' | 'desconocido';

const EXT_IMAGEN = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
const EXT_OFFICE = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
const EXT_TEXTO = ['txt', 'csv'];

@Component({
  selector: 'app-document-viewer-modal',
  imports: [LucideFileText, LucideExternalLink, LucideX, LucideFileWarning],
  template: `
    @if (documento(); as doc) {
      <div class="fixed inset-0 z-50 flex items-center justify-center"
        style="background: rgba(82,85,99,.5); backdrop-filter: blur(10px)"
        (click)="onCerrar()">
        <div class="w-full mx-4 flex flex-col overflow-hidden"
          style="max-width: 960px; height: 85vh; background: var(--color-surface); border-radius: 20px;
                 box-shadow: 0 32px 80px rgba(17,24,39,.28); border: 1px solid rgba(148,27,128,.08)"
          (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between px-5 py-4 shrink-0" style="border-bottom: 1px solid var(--color-border)">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style="background: var(--color-primary-subtle); border: 1px solid var(--color-primary-light)">
                <svg lucideFileText class="w-4 h-4" style="color: var(--color-primary)"></svg>
              </div>
              <h2 class="text-sm font-semibold truncate" style="color: var(--color-text-primary)">{{ doc.name }}</h2>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <a [href]="doc.url" target="_blank" rel="noopener" class="icon-button" title="Abrir en pestaña nueva">
                <svg lucideExternalLink class="w-4 h-4"></svg>
              </a>
              <button (click)="onCerrar()" class="icon-button" title="Cerrar" type="button">
                <svg lucideX class="w-4 h-4"></svg>
              </button>
            </div>
          </div>

          <div class="flex-1 min-h-0" style="background: var(--color-bg)">
            @switch (categoria()) {
              @case ('pdf') {
                <iframe [src]="recursoUrl()" class="w-full h-full" style="border: none" title="Vista previa PDF"></iframe>
              }
              @case ('imagen') {
                <div class="w-full h-full flex items-center justify-center overflow-auto p-4">
                  <img [src]="doc.url" [alt]="doc.name" class="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                </div>
              }
              @case ('office') {
                <div class="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-8">
                  <svg lucideFileWarning class="w-8 h-8" style="color: var(--color-text-muted)"></svg>
                  <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); max-width: 34ch">
                    Este formato no se puede previsualizar dentro de la app sin enviarlo a un visor externo.
                    Por seguridad, ábrelo directamente.
                  </p>
                  <a [href]="doc.url" target="_blank" rel="noopener" class="secondary-button">
                    <svg lucideExternalLink class="w-3.5 h-3.5"></svg>
                    Abrir en pestaña nueva
                  </a>
                </div>
              }
              @case ('texto') {
                <div class="w-full h-full overflow-auto p-5">
                  @if (textoCargando()) {
                    <div class="flex items-center justify-center h-full" style="color: var(--color-text-muted)">
                      Cargando vista previa…
                    </div>
                  } @else if (textoError()) {
                    <div class="flex flex-col items-center justify-center h-full gap-3 text-center">
                      <svg lucideFileWarning class="w-7 h-7" style="color: var(--color-text-muted)"></svg>
                      <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm)">{{ textoError() }}</p>
                      <a [href]="doc.url" target="_blank" rel="noopener" class="secondary-button">
                        <svg lucideExternalLink class="w-3.5 h-3.5"></svg>
                        Abrir en pestaña nueva
                      </a>
                    </div>
                  } @else {
                    <pre style="white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .8rem; color: var(--color-text-primary); line-height: 1.6; margin: 0">{{ textoContenido() }}</pre>
                  }
                </div>
              }
              @default {
                <div class="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-8">
                  <svg lucideFileWarning class="w-8 h-8" style="color: var(--color-text-muted)"></svg>
                  <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm)">
                    Vista previa no disponible para este tipo de archivo
                  </p>
                  <a [href]="doc.url" target="_blank" rel="noopener" class="secondary-button">
                    <svg lucideExternalLink class="w-3.5 h-3.5"></svg>
                    Abrir en pestaña nueva
                  </a>
                </div>
              }
            }
          </div>

        </div>
      </div>
    }
  `,
})
export class DocumentViewerModalComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly http = inject(HttpClient);

  readonly documento = input<DocumentoVisor | null>(null);
  readonly cerrar = output<void>();

  readonly textoContenido = signal('');
  readonly textoCargando = signal(false);
  readonly textoError = signal('');

  readonly categoria = computed<Categoria>(() => this.categorizar(this.documento()?.type ?? ''));

  readonly recursoUrl = computed<SafeResourceUrl | null>(() => {
    const doc = this.documento();
    if (!doc || this.categoria() !== 'pdf') return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(doc.url);
  });

  constructor() {
    effect(() => {
      const doc = this.documento();
      if (doc && this.categorizar(doc.type) === 'texto') {
        this.cargarTexto(doc.url);
      } else {
        this.textoContenido.set('');
        this.textoError.set('');
      }
    });
  }

  onCerrar(): void {
    this.cerrar.emit();
  }

  private categorizar(tipo: string): Categoria {
    const ext = tipo.toLowerCase().replace('.', '');
    if (ext === 'pdf') return 'pdf';
    if (EXT_IMAGEN.includes(ext)) return 'imagen';
    if (EXT_OFFICE.includes(ext)) return 'office';
    if (EXT_TEXTO.includes(ext)) return 'texto';
    return 'desconocido';
  }

  private cargarTexto(url: string): void {
    this.textoCargando.set(true);
    this.textoError.set('');
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (texto) => {
        this.textoContenido.set(texto);
        this.textoCargando.set(false);
      },
      error: () => {
        this.textoError.set('No se pudo cargar la vista previa de este archivo.');
        this.textoCargando.set(false);
      },
    });
  }
}
