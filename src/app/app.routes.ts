import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
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
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        canActivate: [roleGuard(['admin'])],
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
            path: 'administracion-vectorial',
            loadComponent: () =>
              import('./features/admin/vector-admin/vector-admin.component').then(
                (m) => m.VectorAdminComponent
              ),
          },
          { path: '', redirectTo: 'knowledge-base', pathMatch: 'full' },
        ],
      },
      {
        path: 'operator',
        canActivate: [roleGuard(['operador'])],
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
  { path: '**', redirectTo: 'login' },
];
