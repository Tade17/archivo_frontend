import { Routes } from '@angular/router';

export const DOCUMENTOS_DIGITALES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/documento-list/documento-list.component').then(
        (m) => m.DocumentoListComponent,
      ),
    title: 'Documentos digitales',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/documento-detalle/documento-detalle.component').then(
        (m) => m.DocumentoDetalleComponent,
      ),
    title: 'Detalle del documento',
  },
];
