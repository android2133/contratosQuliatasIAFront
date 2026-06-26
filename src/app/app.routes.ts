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
                expedienteId: '019eefcc-31a5-732c-8f42-e7e633dad131',
                tipoDocumentalId: '019eefc9-fd20-761d-8ed5-aa8a02ea9c3a',
                folderId: '019cd4ec-9e79-7ae0-8d74-fc8612133702',
                rutaBase: 'webcontent/TEST1/019eefca-bc2d-75b9-a4cc-c319e7fa1064/019eefcc-31a5-732c-8f42-e7e633dad131/',
                collection: 'DEMO_CONTRATOS2',
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
                expedienteId: '019ef58d-f64a-7e6e-b21e-b02b1a5e0a5d',
                tipoDocumentalId: '019eefc9-fd20-761d-8ed5-aa8a02ea9c3a',
                folderId: '019cd4ec-9e79-7ae0-8d74-fc8612133702',
                rutaBase: 'webcontent/TEST1/019eefca-bc2d-75b9-a4cc-c319e7fa1064/019ef58d-f64a-7e6e-b21e-b02b1a5e0a5d/',
                collection: 'DEMO_CONTRATOS2',
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
                title: 'Políticas y Reglas para Tipo de Contrato',
                expedienteId: '019ef71d-49ce-74e4-b5d6-62cbb561a2df',
                tipoDocumentalId: '019eefc9-fd20-761d-8ed5-aa8a02ea9c3a',
                folderId: '019cd4ec-9e79-7ae0-8d74-fc8612133702',
                rutaBase: 'webcontent/TEST1/019eefca-bc2d-75b9-a4cc-c319e7fa1064/019ef71d-49ce-74e4-b5d6-62cbb561a2df/',
                collection: 'DEMO_CONTRATOS2',
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
                expedienteId: '019ef720-2605-7554-9c78-a5d686610e4f',
                tipoDocumentalId: '019eefc9-fd20-761d-8ed5-aa8a02ea9c3a',
                folderId: '019cd4ec-9e79-7ae0-8d74-fc8612133702',
                rutaBase: 'webcontent/TEST1/019eefca-bc2d-75b9-a4cc-c319e7fa1064/019ef720-2605-7554-9c78-a5d686610e4f/',
                collection: 'DEMO_CONTRATOS2',
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
          { path: '', redirectTo: 'chat', pathMatch: 'full' },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
