import { inject } from '@angular/core';
import { Routes, Router, CanActivateFn } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { authGuard } from './core/guards/auth.guard';
const roles =
  (...allowed: string[]): CanActivateFn =>
  () =>
    inject(AuthService).can(...allowed) || inject(Router).createUrlTree(['/buscar']);
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () =>
      import('./shared/components/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'buscar' },
      {
        path: 'buscar',
        loadComponent: () =>
          import('./features/busqueda/pages/buscador/buscador.component').then(
            (m) => m.BuscadorComponent,
          ),
      },
      { path: 'expedientes', pathMatch: 'full', redirectTo: 'buscar' },
      {
        path: 'expedientes/nuevo',
        canActivate: [roles('GESTOR_DOCUMENTAL')],
        loadComponent: () =>
          import('./features/expedientes/pages/expediente-form/expediente-form.component').then(
            (m) => m.ExpedienteFormComponent,
          ),
      },
      {
        path: 'expedientes/:id/editar',
        canActivate: [roles('GESTOR_DOCUMENTAL')],
        loadComponent: () =>
          import('./features/expedientes/pages/expediente-form/expediente-form.component').then(
            (m) => m.ExpedienteFormComponent,
          ),
      },
      {
        path: 'expedientes/:id',
        loadComponent: () =>
          import('./features/expedientes/pages/expediente-detail.component').then(
            (m) => m.ExpedienteDetailComponent,
          ),
      },
      {
        path: 'digitalizar',
        canActivate: [roles('GESTOR_DOCUMENTAL')],
        loadComponent: () =>
          import('./features/digitalizacion/pages/carga-documentos/carga-documentos.component').then(
            (m) => m.CargaDocumentosComponent,
          ),
      },
      { path: 'documentos', pathMatch: 'full', redirectTo: 'buscar' },
      {
        path: 'documentos/:id',
        loadComponent: () =>
          import('./features/documentos-digitales/pages/documento-detalle/documento-detalle.component').then(
            (m) => m.DocumentoDetalleComponent,
          ),
      },
      {
        path: 'usuarios',
        canActivate: [roles()],
        loadComponent: () =>
          import('./features/usuarios/pages/usuario-list/usuario-list.component').then(
            (m) => m.UsuarioListComponent,
          ),
      },
      {
        path: 'usuarios/nuevo',
        canActivate: [roles()],
        loadComponent: () =>
          import('./features/usuarios/pages/usuario-form/usuario-form.component').then(
            (m) => m.UsuarioFormComponent,
          ),
      },
      {
        path: 'catalogos',
        canActivate: [roles()],
        loadComponent: () =>
          import('./features/catalogos/pages/catalogo-list/catalogo-list.component').then(
            (m) => m.CatalogoListComponent,
          ),
      },
      {
        path: 'auditoria',
        canActivate: [roles()],
        loadComponent: () =>
          import('./features/auditoria/pages/auditoria-list/auditoria-list.component').then(
            (m) => m.AuditoriaListComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'buscar' },
];
