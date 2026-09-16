import { Routes } from '@angular/router';

export const BUSQUEDA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/buscador/buscador.component').then((m) => m.BuscadorComponent),
    title: 'Buscar documentos',
  },
];
