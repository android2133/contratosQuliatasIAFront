import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  LucideRefreshCw, LucideFolderPlus, LucideTrash2, LucideDatabaseZap, LucideSearch, LucideTags,
} from '@lucide/angular';
import { VectorAdminService } from '../../../core/services/vector-admin.service';
import { CollectionsService } from '../../../core/services/collections.service';
import { BitacoraService } from '../../../core/services/bitacora.service';
import { ActionState, ResultBoxComponent } from '../../../shared/result-box.component';

const IDLE: ActionState = { status: 'idle', message: '', raw: '' };
const PANTALLA = 'Administración Vectorial';

@Component({
  selector: 'app-vector-admin',
  imports: [
    FormsModule, ResultBoxComponent,
    LucideRefreshCw, LucideFolderPlus, LucideTrash2, LucideDatabaseZap, LucideSearch, LucideTags,
  ],
  template: `
    <div class="h-full overflow-y-auto" style="background: var(--color-bg)">
      <div class="inbox-page">

        <!-- ── Encabezado ── -->
        <div class="inbox-page__header">
          <div>
            <h1 class="inbox-page__title">Administración vectorial</h1>            
          </div>
          <button (click)="listarColecciones()" [disabled]="listar.status === 'loading'" class="btn-clear">
            <svg lucideRefreshCw class="w-4 h-4" [class.animate-spin]="listar.status === 'loading'"></svg>
            Refrescar colecciones
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <!-- ══════════════════════════════════════════════
               Colecciones
          ══════════════════════════════════════════════ -->
          <div class="card" style="display: flex; flex-direction: column; gap: 1rem">
            <div class="flex items-center gap-2">
              <svg lucideDatabaseZap class="w-4 h-4" style="color: var(--color-primary)"></svg>
              <h3 style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-primary)">
                Colecciones
              </h3>
            </div>

            <!-- Listado -->
            <div>
              @if (listar.status === 'loading') {
                <p style="font-size: var(--font-size-xs); color: var(--color-text-muted)">Consultando…</p>
              }
              @if (listar.status !== 'loading' && coleccionesDetectadas().length > 0) {
                <div class="flex flex-wrap gap-2">
                  @for (nombre of coleccionesDetectadas(); track nombre) {
                    <button type="button" class="det-badge det-badge--primary" style="cursor: pointer; border: none"
                      (click)="usarColeccion(nombre)" title="Usar esta colección en los formularios de abajo">
                      <span class="det-badge__dot"></span>
                      {{ nombre }}
                    </button>
                  }
                </div>
              }
              @if (listar.status === 'idle' && coleccionesDetectadas().length === 0) {
                <p style="font-size: var(--font-size-xs); color: var(--color-text-muted)">Aún no se ha consultado el backend.</p>
              }
              @if (listar.status === 'ok' && coleccionesDetectadas().length === 0) {
                <p style="font-size: var(--font-size-xs); color: var(--color-text-muted)">Respuesta OK, pero sin colecciones detectadas — revisa el JSON crudo.</p>
              }
              <!-- <app-result-box [state]="listar" /> -->
            </div>

            <div style="border-top: 1px solid var(--color-border)"></div>

            <!-- Crear -->
            <div class="flex flex-col gap-2">
              <label style="font-size: .72rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .04em">
                Crear colección
              </label>
              <div class="flex gap-2">
                <input class="input-base" style="flex: 1" type="text" placeholder="Nombre de la colección"
                  [(ngModel)]="crearForm.nombre" (keydown.enter)="crearColeccion()" />
                <button (click)="crearColeccion()" [disabled]="!crearForm.nombre.trim() || crear.status === 'loading'" class="btn-primary" style="padding: 0 1rem; min-height: 40px">
                  <svg lucideFolderPlus class="w-4 h-4"></svg>
                </button>
              </div>
              <app-result-box [state]="crear" />
            </div>

            <div style="border-top: 1px solid var(--color-border)"></div>

            <!-- Borrar -->
            <div class="flex flex-col gap-2">
              <label style="font-size: .72rem; font-weight: 700; color: var(--color-danger); text-transform: uppercase; letter-spacing: .04em">
                Destructivo — borrar colección
              </label>
              <div class="flex gap-2">
                <input class="input-base" style="flex: 1" type="text" placeholder="Nombre de la colección"
                  [(ngModel)]="borrarColForm.nombre" />
                @if (!borrarColConfirm()) {
                  <button (click)="borrarColConfirm.set(true)" [disabled]="!borrarColForm.nombre.trim()" class="btn-clear" style="white-space: nowrap">
                    <svg lucideTrash2 class="w-4 h-4"></svg>
                    Borrar
                  </button>
                } @else {
                  <button (click)="borrarColeccion()" [disabled]="borrarCol.status === 'loading'"
                    class="inline-flex items-center gap-2 font-semibold text-sm text-white shrink-0"
                    style="height: 40px; padding: 0 1rem; border-radius: var(--radius-md); border: none; background: var(--color-danger); cursor: pointer">
                    Confirmar
                  </button>
                  <button (click)="borrarColConfirm.set(false)" class="secondary-button">Cancelar</button>
                }
              </div>
              <app-result-box [state]="borrarCol" />
            </div>
          </div>

          <!-- ══════════════════════════════════════════════
               Insertar documento
          ══════════════════════════════════════════════ -->
          <div class="card" style="display: flex; flex-direction: column; gap: .75rem">
            <div class="flex items-center gap-2">
              <svg lucideDatabaseZap class="w-4 h-4" style="color: var(--color-primary)"></svg>
              <h3 style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-primary)">
                Insertar documento / sitio web
              </h3>
            </div>

            <div class="flex gap-2">
              <button type="button" (click)="insertarForm.web = false"
                [class.secondary-button]="insertarForm.web" [class.btn-primary]="!insertarForm.web"
                style="flex: 1; min-height: 36px; font-size: var(--font-size-xs)">
                Documento (files URI)
              </button>
              <button type="button" (click)="insertarForm.web = true"
                [class.secondary-button]="!insertarForm.web" [class.btn-primary]="insertarForm.web"
                style="flex: 1; min-height: 36px; font-size: var(--font-size-xs)">
                Sitio web
              </button>
            </div>

            <div class="flex flex-col gap-2">
              <input class="input-base" type="text" [placeholder]="insertarForm.web ? 'https://example.com' : 'files://<id-del-archivo>'"
                [(ngModel)]="insertarForm.uri" />
              <div class="grid grid-cols-2 gap-2">
                <input class="input-base" type="text" placeholder="mimetype (ej. application/pdf)" [(ngModel)]="insertarForm.mimetype" />
                <input class="input-base" type="text" placeholder="Nombre del archivo / sitio" [(ngModel)]="insertarForm.nombreArchivo" />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input class="input-base" type="text" placeholder="Colección" [(ngModel)]="insertarForm.coleccion" />
                <input class="input-base" type="text" placeholder="Expediente" [(ngModel)]="insertarForm.expediente" />
              </div>
              <input class="input-base" type="text" placeholder="ID del documento" [(ngModel)]="insertarForm.id" />
              <button (click)="insertarDocumento()"
                [disabled]="insertar.status === 'loading' || !insertarForm.uri.trim() || !insertarForm.coleccion.trim()"
                class="btn-primary" style="width: 100%">
                Insertar
              </button>
            </div>
            <app-result-box [state]="insertar" />
          </div>

          <!-- ══════════════════════════════════════════════
               Buscar documento
          ══════════════════════════════════════════════ -->
          <div class="card" style="display: flex; flex-direction: column; gap: .75rem">
            <div class="flex items-center gap-2">
              <svg lucideSearch class="w-4 h-4" style="color: var(--color-primary)"></svg>
              <h3 style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-primary)">
                Buscar documento vectorial
              </h3>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <input class="input-base" type="text" placeholder="ID del documento" [(ngModel)]="obtenerForm.id" />
              <input class="input-base" type="text" placeholder="Colección" [(ngModel)]="obtenerForm.coleccion" />
            </div>
            <button (click)="obtenerDocumento()" [disabled]="obtener.status === 'loading' || !obtenerForm.id.trim() || !obtenerForm.coleccion.trim()"
              class="btn-primary" style="width: 100%">
              Buscar
            </button>
            <app-result-box [state]="obtener" />
          </div>

          <!-- ══════════════════════════════════════════════
               Eliminar documento
          ══════════════════════════════════════════════ -->
          <div class="card" style="display: flex; flex-direction: column; gap: .75rem">
            <div class="flex items-center gap-2">
              <svg lucideTrash2 class="w-4 h-4" style="color: var(--color-danger)"></svg>
              <h3 style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-danger)">
                Destructivo — borrar documento vectorial
              </h3>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <input class="input-base" type="text" placeholder="ID del documento" [(ngModel)]="borrarDocForm.id" />
              <input class="input-base" type="text" placeholder="Colección" [(ngModel)]="borrarDocForm.coleccion" />
            </div>
            @if (!borrarDocConfirm()) {
              <button (click)="borrarDocConfirm.set(true)" [disabled]="!borrarDocForm.id.trim() || !borrarDocForm.coleccion.trim()"
                class="btn-clear" style="width: 100%">
                <svg lucideTrash2 class="w-4 h-4"></svg>
                Borrar documento
              </button>
            } @else {
              <div class="flex gap-2">
                <button (click)="borrarDocumento()" [disabled]="borrarDoc.status === 'loading'"
                  class="inline-flex items-center justify-center gap-2 font-semibold text-sm text-white"
                  style="flex: 1; height: 40px; border-radius: var(--radius-md); border: none; background: var(--color-danger); cursor: pointer">
                  Confirmar borrado
                </button>
                <button (click)="borrarDocConfirm.set(false)" class="secondary-button">Cancelar</button>
              </div>
            }
            <app-result-box [state]="borrarDoc" />
          </div>

          <!-- ══════════════════════════════════════════════
               Reclasificar archivo existente
          ══════════════════════════════════════════════ -->
          <div class="card" style="display: flex; flex-direction: column; gap: .75rem">
            <div class="flex items-center gap-2">
              <svg lucideTags class="w-4 h-4" style="color: var(--color-primary)"></svg>
              <h3 style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-primary)">
                Reclasificar archivo existente
              </h3>
            </div>
            <p style="font-size: var(--font-size-xs); color: var(--color-text-muted)">
              Para archivos subidos antes de que la carga guardara coleccion/expediente — no requiere volver a subir el archivo (PUT /archivos/{{ '{' }}id{{ '}' }}).
            </p>
            <input class="input-base" type="text" placeholder="ID del archivo" [(ngModel)]="reclasificarForm.id" />
            <div class="grid grid-cols-2 gap-2">
              <input class="input-base" type="text" placeholder="Colección" [(ngModel)]="reclasificarForm.coleccion" />
              <input class="input-base" type="text" placeholder="Expediente" [(ngModel)]="reclasificarForm.expediente" />
            </div>
            <button (click)="reclasificar()"
              [disabled]="reclasificarState.status === 'loading' || !reclasificarForm.id.trim() || !reclasificarForm.coleccion.trim() || !reclasificarForm.expediente.trim()"
              class="btn-primary" style="width: 100%">
              Reclasificar
            </button>
            <app-result-box [state]="reclasificarState" />
          </div>

        </div>
      </div>
    </div>
  `,
})
export class VectorAdminComponent implements OnInit {
  private readonly svc = inject(VectorAdminService);
  private readonly collectionsSvc = inject(CollectionsService);
  private readonly bitacoraSvc = inject(BitacoraService);

  crearForm = { nombre: '' };
  borrarColForm = { nombre: '' };
  insertarForm = { web: false, uri: '', mimetype: 'application/pdf', nombreArchivo: '', coleccion: '', id: '', expediente: '' };
  obtenerForm = { id: '', coleccion: '' };
  borrarDocForm = { id: '', coleccion: '' };
  reclasificarForm = { id: '', coleccion: '', expediente: '' };

  readonly borrarColConfirm = signal(false);
  readonly borrarDocConfirm = signal(false);

  listar: ActionState = { ...IDLE };
  crear: ActionState = { ...IDLE };
  borrarCol: ActionState = { ...IDLE };
  insertar: ActionState = { ...IDLE };
  obtener: ActionState = { ...IDLE };
  borrarDoc: ActionState = { ...IDLE };
  reclasificarState: ActionState = { ...IDLE };

  readonly coleccionesDetectadas = signal<string[]>([]);

  ngOnInit(): void {
    this.listarColecciones();
  }

  usarColeccion(nombre: string): void {
    this.borrarColForm.nombre = nombre;
    this.insertarForm.coleccion = nombre;
    this.obtenerForm.coleccion = nombre;
    this.borrarDocForm.coleccion = nombre;
  }

  listarColecciones(): void {
    this.listar = { status: 'loading', message: '', raw: '' };
    this.svc.listarColecciones().subscribe({
      next: (res) => {
        this.listar = { status: 'ok', message: 'OK', raw: this.pretty(res) };
        this.coleccionesDetectadas.set(this.extraerColecciones(res));
      },
      error: (err: HttpErrorResponse) => (this.listar = this.errorState(err)),
    });
  }

  crearColeccion(): void {
    const nombre = this.crearForm.nombre.trim();
    if (!nombre) return;
    this.crear = { status: 'loading', message: '', raw: '' };
    this.svc.crearColeccion(nombre).subscribe({
      next: (res) => {
        this.crear = { status: 'ok', message: `Colección "${nombre}" creada`, raw: this.pretty(res) };
        this.crearForm.nombre = '';
        this.listarColecciones();
        this.registrarBitacora('CREAR', nombre, nombre, true);
      },
      error: (err: HttpErrorResponse) => {
        this.crear = this.errorState(err);
        this.registrarBitacora('CREAR', nombre, nombre, false);
      },
    });
  }

  borrarColeccion(): void {
    const nombre = this.borrarColForm.nombre.trim();
    if (!nombre) return;
    this.borrarCol = { status: 'loading', message: '', raw: '' };
    this.svc.borrarColeccion(nombre).subscribe({
      next: (res) => {
        this.borrarCol = { status: 'ok', message: `Colección "${nombre}" borrada`, raw: this.pretty(res) };
        this.borrarColConfirm.set(false);
        this.borrarColForm.nombre = '';
        this.listarColecciones();
        this.registrarBitacora('ELIMINAR', nombre, nombre, true);
      },
      error: (err: HttpErrorResponse) => {
        this.borrarCol = this.errorState(err);
        this.borrarColConfirm.set(false);
        this.registrarBitacora('ELIMINAR', nombre, nombre, false);
      },
    });
  }

  insertarDocumento(): void {
    const f = this.insertarForm;
    if (!f.uri.trim() || !f.coleccion.trim()) return;

    this.insertar = { status: 'loading', message: '', raw: '' };
    const id = f.id.trim() || crypto.randomUUID();
    const nombreArchivo = f.nombreArchivo.trim() || f.uri.trim();
    const expediente = f.expediente.trim() || f.coleccion.trim();
    this.svc.insertarDocumento({
      uri: f.uri.trim(),
      mimetype: f.mimetype.trim() || 'application/octet-stream',
      nombreArchivo,
      coleccion: f.coleccion.trim(),
      web: f.web,
      id,
      expediente: f.expediente.trim(),
    }).subscribe({
      next: (res) => {
        this.insertar = { status: 'ok', message: 'Documento insertado', raw: this.pretty(res) };
        this.registrarBitacora('VECTORIZAR', id, nombreArchivo, true, expediente);
      },
      error: (err: HttpErrorResponse) => {
        this.insertar = this.errorState(err);
        this.registrarBitacora('VECTORIZAR', id, nombreArchivo, false, expediente);
      },
    });
  }

  obtenerDocumento(): void {
    const { id, coleccion } = this.obtenerForm;
    if (!id.trim() || !coleccion.trim()) return;

    this.obtener = { status: 'loading', message: '', raw: '' };
    this.svc.obtenerDocumento({ id: id.trim(), coleccion: coleccion.trim() }).subscribe({
      next: (res) => (this.obtener = { status: 'ok', message: 'OK', raw: this.pretty(res) }),
      error: (err: HttpErrorResponse) => (this.obtener = this.errorState(err)),
    });
  }

  borrarDocumento(): void {
    const { id, coleccion } = this.borrarDocForm;
    if (!id.trim() || !coleccion.trim()) return;

    this.borrarDoc = { status: 'loading', message: '', raw: '' };
    this.svc.borrarDocumento({ id: id.trim(), coleccion: coleccion.trim() }).subscribe({
      next: (res) => {
        this.borrarDoc = { status: 'ok', message: 'Documento borrado', raw: this.pretty(res) };
        this.borrarDocConfirm.set(false);
        this.registrarBitacora('ELIMINAR', id.trim(), id.trim(), true, coleccion.trim());
      },
      error: (err: HttpErrorResponse) => {
        this.borrarDoc = this.errorState(err);
        this.borrarDocConfirm.set(false);
        this.registrarBitacora('ELIMINAR', id.trim(), id.trim(), false, coleccion.trim());
      },
    });
  }

  reclasificar(): void {
    const { id, coleccion, expediente } = this.reclasificarForm;
    if (!id.trim() || !coleccion.trim() || !expediente.trim()) return;

    this.reclasificarState = { status: 'loading', message: '', raw: '' };
    this.collectionsSvc.reclassify(id.trim(), coleccion.trim(), expediente.trim()).subscribe({
      next: () => {
        this.reclasificarState = {
          status: 'ok',
          message: `Archivo ${id} reclasificado a "${coleccion}" / "${expediente}"`,
          raw: '',
        };
        this.registrarBitacora('ACTUALIZAR', id.trim(), id.trim(), true, expediente.trim());
      },
      error: (err: HttpErrorResponse) => {
        this.reclasificarState = this.errorState(err);
        this.registrarBitacora('ACTUALIZAR', id.trim(), id.trim(), false, expediente.trim());
      },
    });
  }

  private registrarBitacora(accion: string, documentoId: string, documentoNombre: string, exitoso: boolean, expediente = ''): void {
    this.bitacoraSvc.registrar({
      expediente,
      pantalla: PANTALLA,
      documento_id: documentoId,
      documento_nombre: documentoNombre,
      accion,
      exitoso,
    }).subscribe();
  }

  private errorState(err: HttpErrorResponse): ActionState {
    const isLikelyCors = err.status === 0;
    return {
      status: 'error',
      message: isLikelyCors
        ? 'Sin respuesta (status 0) — probable CORS, servidor caído o URL incorrecta.'
        : `Error ${err.status}: ${err.statusText || 'desconocido'}`,
      raw: this.pretty(err.error ?? err.message),
    };
  }

  private extraerColecciones(raw: unknown): string[] {
    if (Array.isArray(raw)) return raw.map((v) => String(v));
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      const candidate = obj['colecciones'] ?? obj['data'] ?? obj['items'] ?? obj['collections'];
      if (Array.isArray(candidate)) return candidate.map((v) => (typeof v === 'string' ? v : String((v as Record<string, unknown>)?.['nombre'] ?? (v as Record<string, unknown>)?.['coleccion'] ?? JSON.stringify(v))));
    }
    return [];
  }

  private pretty(value: unknown): string {
    try {
      return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
}
