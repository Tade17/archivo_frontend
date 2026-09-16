import { Routes } from '@angular/router';
export const PRESTAMOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/prestamo-list/prestamo-list.component').then((m) => m.PrestamoListComponent),
    title: 'Préstamos',
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/prestamo-form/prestamo-form.component').then((m) => m.PrestamoFormComponent),
    title: 'Registrar préstamo',
  },
];
