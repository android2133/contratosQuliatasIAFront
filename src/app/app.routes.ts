import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin/knowledge-base',
    pathMatch: 'full',
  },
  // Ruta standalone para el Administrador de Colecciones (auth propia)
  {
    path: 'collections',
    loadComponent: () =>
      import('./features/admin/collections/collection-manager.component').then(
        (m) => m.CollectionManagerComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/layout/layout.component').then(
        (m) => m.LayoutComponent
      ),
    children: [
      {
        path: 'admin',
        children: [
          {
            path: 'knowledge-base',
            data: {
              config: {
                title: 'Base de Conocimientos',
                collection: 'CONTRATOS_QLT',
                expediente: 'BASE DE CONOCIMIENTO',
              },
            },
            loadComponent: () =>
              import(
                './features/admin/knowledge-base/knowledge-base.component'
              ).then((m) => m.KnowledgeBaseComponent),
          },
          {
            path: 'politicas-normativas',
            data: {
              config: {
                title: 'Políticas o Normativas a Considerar',
                collection: 'CONTRATOS_QLT',
                expediente: 'POLITICAS O NORMATIVAS',
              },
            },
            loadComponent: () =>
              import(
                './features/admin/knowledge-base/knowledge-base.component'
              ).then((m) => m.KnowledgeBaseComponent),
          },
          {
            path: 'politicas-reglas',
            data: {
              config: {
                title: 'Reglas y procedimientos para Tipo de Contrato',
                collection: 'CONTRATOS_QLT',
                expediente: 'REGLAS Y PROCEDIMIENTOS',
              },
            },
            loadComponent: () =>
              import(
                './features/admin/knowledge-base/knowledge-base.component'
              ).then((m) => m.KnowledgeBaseComponent),
          },
          {
            path: 'plantillas',
            data: {
              config: {
                title: 'Plantillas',
                collection: 'CONTRATOS_QLT',
                expediente: 'PLANTILLAS',
              },
            },
            loadComponent: () =>
              import(
                './features/admin/knowledge-base/knowledge-base.component'
              ).then((m) => m.KnowledgeBaseComponent),
          },
          {
            path: 'instrucciones-sistema',
            loadComponent: () =>
              import(
                './features/admin/instrucciones-sistema/instrucciones-sistema.component'
              ).then((m) => m.InstruccionesSistemaComponent),
          },
          {
            path: 'colecciones',
            loadComponent: () =>
              import('./features/admin/collections/collection-manager.component').then(
                (m) => m.CollectionManagerComponent
              ),
          },
          {
            path: 'estado-servicios',
            loadComponent: () =>
              import('./features/admin/health/health.component').then(
                (m) => m.HealthComponent
              ),
          },
          {
            path: 'metricas',
            loadComponent: () =>
              import('./features/admin/metrics/metrics.component').then(
                (m) => m.MetricsComponent
              ),
          },
          {
            path: 'administracion-vectorial',
            loadComponent: () =>
              import('./features/admin/vector-admin/vector-admin.component').then(
                (m) => m.VectorAdminComponent
              ),
          },
          {
            path: 'bitacora',
            loadComponent: () =>
              import('./features/admin/bitacora/bitacora.component').then(
                (m) => m.BitacoraComponent
              ),
          },
          { path: '', redirectTo: 'knowledge-base', pathMatch: 'full' },
        ],
      },
      {
        path: 'operator',
        children: [
          {
            path: 'chat',
            loadComponent: () =>
              import('./features/operator/chat/chat.component').then(
                (m) => m.ChatComponent
              ),
          },
          {
            path: 'faq',
            loadComponent: () =>
              import('./features/operator/faq/faq.component').then(
                (m) => m.FaqComponent
              ),
          },
          { path: '', redirectTo: 'chat', pathMatch: 'full' },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'admin/knowledge-base' },
];
