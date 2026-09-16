import { Routes } from '@angular/router';
export const CATALOGOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/catalogo-list/catalogo-list.component').then((m) => m.CatalogoListComponent),
    title: 'Catálogos',
  },
];
