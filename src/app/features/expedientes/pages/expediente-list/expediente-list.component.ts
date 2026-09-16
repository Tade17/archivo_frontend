import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Expediente } from '../../../../shared/models/expediente.model';
import { ExpedienteService } from '../../expediente.service';

@Component({
  selector: 'app-expediente-list',
  imports: [RouterLink, PageHeaderComponent, EmptyStateComponent],
  template: `
    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <app-page-header
        title="Expedientes"
        description="Organiza y consulta las unidades documentales del archivo."
      />
      <a class="app-button shrink-0" routerLink="nuevo">Nuevo expediente</a>
    </div>

    @if (error()) {
      <p class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error() }}</p>
    } @else if (!loading() && !items().length) {
      <app-empty-state
        title="Aún no hay expedientes"
        description="Crea el primer expediente para asociar documentos."
      />
    } @else {
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Código</th>
                <th class="px-4 py-3">Asunto</th>
                <th class="px-4 py-3">Área</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Documentos</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (item of items(); track item.id) {
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-3 font-semibold text-brand-700">{{ item.codigo }}</td>
                  <td class="px-4 py-3 text-slate-800">{{ item.asunto }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ item.areaNombre || item.areaId }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ item.estado }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ item.cantidadDocumentos ?? 0 }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpedienteListComponent implements OnInit {
  private readonly service = inject(ExpedienteService);
  protected readonly items = signal<Expediente[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.service
      .listar()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => this.items.set(page.contenido),
        error: () => this.error.set('No fue posible cargar los expedientes.'),
      });
  }
}
