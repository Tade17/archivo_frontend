import { Routes } from '@angular/router';
export const AUDITORIA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/auditoria-list/auditoria-list.component').then(
        (m) => m.AuditoriaListComponent,
      ),
    title: 'Auditoría',
  },
];
