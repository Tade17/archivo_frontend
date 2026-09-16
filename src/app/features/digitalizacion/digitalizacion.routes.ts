import { Routes } from '@angular/router';

export const DIGITALIZACION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/carga-documentos/carga-documentos.component').then(
        (m) => m.CargaDocumentosComponent,
      ),
    title: 'Digitalizar documentos',
  },
];
