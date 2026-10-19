import { inject, Injectable, signal } from '@angular/core';
import { ArchiveApi } from './archive-api.service';
import { AuthService } from './auth.service';
import { ResumenPrestamos } from '../models/archive.model';

@Injectable({ providedIn: 'root' })
export class AlertasService {
  private api = inject(ArchiveApi);
  private auth = inject(AuthService);
  resumen = signal<ResumenPrestamos | null>(null);

  refrescar() {
    if (!this.auth.can('GESTOR_DOCUMENTAL')) {
      this.resumen.set(null);
      return;
    }
    this.api.prestamosResumen().subscribe({
      next: (r) => this.resumen.set(r),
      error: () => this.resumen.set(null),
    });
  }
}
