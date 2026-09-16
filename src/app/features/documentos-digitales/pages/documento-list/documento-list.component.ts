import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { DocumentoDigital } from '../../../../shared/models/documento-digital.model';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { DocumentoDigitalService } from '../../documento-digital.service';

@Component({
  selector: 'app-documento-list',
  imports: [RouterLink, PageHeaderComponent, EmptyStateComponent, FileSizePipe],
  template: `
    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <app-page-header
        title="Documentos digitales"
        description="Consulta los archivos y su estado de procesamiento."
      />
      <a class="app-button shrink-0" routerLink="/digitalizar">Cargar documento</a>
    </div>
    @if (error()) {
      <p class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error() }}</p>
    } @else if (!loading() && !items().length) {
      <app-empty-state
        title="Aún no hay documentos"
        description="Los documentos cargados aparecerán aquí con su estado de OCR."
      />
    } @else {
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (item of items(); track item.id) {
          <a
            class="app-card block transition hover:-translate-y-0.5 hover:border-brand-300"
            [routerLink]="[item.id]"
          >
            <div class="flex items-start justify-between gap-3">
              <span
                class="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"
                >{{ item.mimeType }}</span
              >
              <span class="text-xs font-medium text-brand-700">{{ item.estadoProcesamiento }}</span>
            </div>
            <h2 class="mt-5 truncate font-semibold text-slate-950">
              {{ item.titulo || item.nombre }}
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              {{ item.numeroPaginas ?? '—' }} página(s) · {{ item.tamanoBytes | fileSize }}
            </p>
          </a>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentoListComponent implements OnInit {
  private readonly service = inject(DocumentoDigitalService);
  protected readonly items = signal<DocumentoDigital[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.service
      .listar()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => this.items.set(page.contenido),
        error: () => this.error.set('No fue posible cargar los documentos.'),
      });
  }
}
