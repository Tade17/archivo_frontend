import { Routes } from '@angular/router';
export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/usuario-list/usuario-list.component').then((m) => m.UsuarioListComponent),
    title: 'Usuarios',
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/usuario-form/usuario-form.component').then((m) => m.UsuarioFormComponent),
    title: 'Nuevo usuario',
  },
];
