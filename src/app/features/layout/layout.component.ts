import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import {
  LucideDatabase, LucideMessageSquare,
  LucideMenu, LucideX,
  LucideBookOpen, LucideScale, LucideLayoutTemplate, LucideCircleQuestionMark,
  LucideActivity, LucideDatabaseZap, LucideChartColumn,
} from '@lucide/angular';

const PAGE_LABELS: Record<string, string> = {
  '/admin/knowledge-base': 'Base de Conocimientos',
  '/admin/politicas-normativas': 'Políticas y Normativas',
  '/admin/politicas-reglas': 'Reglas y Procedimientos',
  '/admin/plantillas': 'Plantillas',
  '/admin/estado-servicios': 'Estado de Servicios',
  '/admin/administracion-vectorial': 'Administración Vectorial',
  '/admin/metricas': 'Métricas',
  '/operator/chat': 'Chat Agente',
  '/operator/faq': 'Preguntas Frecuentes',
};

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    LucideDatabase, LucideMessageSquare,
    LucideMenu, LucideX,
    LucideBookOpen, LucideScale, LucideLayoutTemplate, LucideCircleQuestionMark,
    LucideActivity, LucideDatabaseZap, LucideChartColumn,
  ],
  template: `
    <div class="flex h-screen overflow-hidden" style="background: var(--color-bg)">

      <!-- Mobile overlay -->
      @if (sidebarOpen()) {
        <div
          class="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          (click)="sidebarOpen.set(false)"
        ></div>
      }

      <!-- ── Sidebar ── -->
      <aside
        class="fixed inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0"
        style="width: var(--sidebar-width); background: var(--color-surface); border-right: 1px solid var(--color-border)"
        [class.translate-x-0]="sidebarOpen()"
        [class.-translate-x-full]="!sidebarOpen()"
      >
        <!-- Logo -->
        

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p class="px-3 mb-2" style="font-size: var(--font-size-xs); font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--color-text-muted)">
            Administración
          </p>
          <a routerLink="/admin/knowledge-base" routerLinkActive="nav-item-active" class="nav-item">
            <svg lucideDatabase class="w-4 h-4 shrink-0"></svg>
            <span>Base de Conocimientos</span>
          </a>
          <a routerLink="/admin/politicas-normativas" routerLinkActive="nav-item-active" class="nav-item">
            <svg lucideBookOpen class="w-4 h-4 shrink-0"></svg>
            <span>Políticas y Normativas</span>
          </a>
          <a routerLink="/admin/politicas-reglas" routerLinkActive="nav-item-active" class="nav-item">
            <svg lucideScale class="w-4 h-4 shrink-0"></svg>
            <span>Reglas y Procedimientos</span>
          </a>
          <a routerLink="/admin/plantillas" routerLinkActive="nav-item-active" class="nav-item">
            <svg lucideLayoutTemplate class="w-4 h-4 shrink-0"></svg>
            <span>Plantillas</span>
          </a>
          <a routerLink="/admin/administracion-vectorial" routerLinkActive="nav-item-active" class="nav-item">
            <svg lucideDatabaseZap class="w-4 h-4 shrink-0"></svg>
            <span>Administración Vectorial</span>
          </a>
          <a routerLink="/admin/estado-servicios" routerLinkActive="nav-item-active" class="nav-item">
            <svg lucideActivity class="w-4 h-4 shrink-0"></svg>
            <span>Estado de Servicios</span>
          </a>
          <a routerLink="/admin/metricas" routerLinkActive="nav-item-active" class="nav-item">
            <svg lucideChartColumn class="w-4 h-4 shrink-0"></svg>
            <span>Métricas</span>
          </a>

          <p class="px-3 mt-4 mb-2" style="font-size: var(--font-size-xs); font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--color-text-muted)">
            Herramientas
          </p>
          <a routerLink="/operator/chat" routerLinkActive="nav-item-active" class="nav-item">
            <svg lucideMessageSquare class="w-4 h-4 shrink-0"></svg>
            <span>Chat Agente</span>
          </a>
          <a routerLink="/operator/faq" routerLinkActive="nav-item-active" class="nav-item">
            <svg lucideCircleQuestionMark class="w-4 h-4 shrink-0"></svg>
            <span>Preguntas frecuentes</span>
          </a>
        </nav>
      </aside>

      <!-- ── Columna principal ── -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

        <!-- Topbar -->
        <header class="topbar" role="banner">
          <div class="topbar__left">

            <!-- Hamburger (solo mobile) -->
            <button
              class="topbar__back-btn lg:hidden"
              type="button"
              [attr.aria-label]="sidebarOpen() ? 'Cerrar menú' : 'Abrir menú'"
              (click)="sidebarOpen.set(!sidebarOpen())"
            >
              @if (sidebarOpen()) {
                <svg lucideX class="w-5 h-5"></svg>
              } @else {
                <svg lucideMenu class="w-5 h-5"></svg>
              }
            </button>

            <!-- Logo -->
            <img
              class="topbar__logo hidden sm:block"
              src="/logo-qu.png"
              alt="Contratos IA"
            >

            <!-- Breadcrumb -->
            <nav class="topbar__breadcrumb" aria-label="Ruta de navegación">
              <span class="topbar__breadcrumb-item hidden sm:inline">CONTRATOS</span>
              @if (currentPageLabel()) {
                <span class="topbar__breadcrumb-sep hidden sm:inline" aria-hidden="true">/</span>
                <span class="topbar__breadcrumb-item topbar__breadcrumb-item--active">
                  {{ currentPageLabel() }}
                </span>
              }
            </nav>
          </div>

        </header>

        <!-- Contenido -->
        <main class="flex-1 overflow-hidden">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class LayoutComponent {
  private readonly router = inject(Router);

  readonly sidebarOpen = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly currentPageLabel = computed<string>(() => {
    const url = this.currentUrl();
    for (const [path, label] of Object.entries(PAGE_LABELS)) {
      if (url.startsWith(path)) return label;
    }
    return '';
  });
}
