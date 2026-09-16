import { Routes } from '@angular/router';

export const EXPEDIENTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/expediente-list/expediente-list.component').then(
        (m) => m.ExpedienteListComponent,
      ),
    title: 'Expedientes',
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/expediente-form/expediente-form.component').then(
        (m) => m.ExpedienteFormComponent,
      ),
    title: 'Nuevo expediente',
  },
];
