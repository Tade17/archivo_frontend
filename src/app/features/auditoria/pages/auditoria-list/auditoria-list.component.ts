import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { AuditEvent, Page } from '../../../../core/models/archive.model';
import { PagerComponent } from '../../../../shared/components/pager.component';
@Component({
  selector: 'app-auditoria-list',
  imports: [FormsModule, DatePipe, PagerComponent],
  template: ` <div class="page-heading">
      <div>
        <h1>Auditoría y <strong>seguridad</strong></h1>
        <p>Historial de creación, modificación, consulta y descarga.</p>
      </div>
      <button class="btn secondary" [disabled]="exporting()" (click)="exportLog()">
        {{ exporting() ? 'Exportando…' : 'Exportar bitácora ↓' }}
      </button>
    </div>
    <div class="workspace">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        @for (s of stats; track s.key) {
          <div
            class="bg-white border border-[var(--line)] rounded-[6px] px-5 py-4 flex items-baseline gap-3"
          >
            <strong
              class="font-light text-[28px] leading-none tabular-nums"
              [style.color]="s.color"
              >{{ count(s.key) }}</strong
            ><span class="text-[11px] text-[var(--muted)]">{{ s.label }}</span>
          </div>
        }
      </div>
      <form
        class="panel grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 items-end"
        (ngSubmit)="load(0)"
      >
        <label
          >Usuario<input name="usuario" [(ngModel)]="filters.usuario" placeholder="Todos" /></label
        ><label
          >Acción<select name="accion" [(ngModel)]="filters.accion">
            <option value="">Todas</option>
            @for (a of actions; track a) {
              <option>{{ a }}</option>
            }
          </select></label
        ><label
          >Módulo<select name="modulo" [(ngModel)]="filters.modulo">
            <option value="">Todos</option>
            @for (m of modules; track m) {
              <option>{{ m }}</option>
            }
          </select></label
        ><label>Desde<input type="date" name="desde" [(ngModel)]="filters.desde" /></label
        ><label>Hasta<input type="date" name="hasta" [(ngModel)]="filters.hasta" /></label
        ><button class="btn">Aplicar filtros</button>
      </form>
      <div class="grid xl:grid-cols-[1fr_300px] gap-6">
        <section class="panel min-w-0">
          <h2 class="mb-5">Actividad registrada</h2>
          <div class="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>FECHA Y HORA</th>
                  <th>USUARIO</th>
                  <th>ACCIÓN</th>
                  <th>MÓDULO</th>
                </tr>
              </thead>
              <tbody>
                @for (e of result()?.contenido; track e.id) {
                  <tr [class.selected]="selected()?.id === e.id">
                    <td>
                      <button class="text-button" (click)="selected.set(e)">
                        {{ e.fecha | date: 'dd/MM/yyyy HH:mm:ss' }}
                      </button>
                    </td>
                    <td>{{ e.usuario }}</td>
                    <td>
                      <span
                        class="inline-flex items-center gap-2 font-semibold"
                        [style.color]="actionColor(e.accion)"
                        ><span
                          class="w-2 h-2 rounded-full"
                          [style.background]="actionColor(e.accion)"
                        ></span
                        >{{ actionLabel(e.accion) }}</span
                      >
                    </td>
                    <td>{{ e.modulo }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="empty">No hay eventos con estos filtros.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pager
            [page]="result()?.pagina ?? 0"
            [size]="10"
            [total]="result()?.totalElementos ?? 0"
            (changed)="load($event)"
          />
        </section>
        <aside class="panel">
          @if (selected(); as e) {
            <p class="eyebrow">EVENTO SELECCIONADO</p>
            <h2 class="mt-4" [style.color]="actionColor(e.accion)">{{ actionLabel(e.accion) }}</h2>
            <dl class="data-list mt-5">
              <div>
                <dt>ID</dt>
                <dd>{{ e.id }}</dd>
              </div>
              <div>
                <dt>Usuario</dt>
                <dd>{{ e.usuario }}</dd>
              </div>
              <div>
                <dt>Fecha y hora</dt>
                <dd>{{ e.fecha | date: 'dd/MM/yyyy HH:mm:ss' }}</dd>
              </div>
              <div>
                <dt>Recurso</dt>
                <dd>{{ e.recurso }}</dd>
              </div>
              <div>
                <dt>Módulo</dt>
                <dd>{{ e.modulo }}</dd>
              </div>
            </dl>
          } @else {
            <p class="empty">Selecciona un evento.</p>
          }
        </aside>
      </div>
    </div>`,
})
export class AuditoriaListComponent implements OnInit {
  api = inject(ArchiveApi);
  dialog = inject(DialogService);
  result = signal<Page<AuditEvent> | null>(null);
  selected = signal<AuditEvent | null>(null);
  summary = signal<Record<string, number>>({});
  exporting = signal(false);
  filters = { usuario: '', accion: '', modulo: '', desde: '', hasta: '' };
  actions = ['CREAR', 'MODIFICAR', 'CONSULTAR', 'DESCARGAR', 'ELIMINAR'];
  modules = ['Expediente', 'DocumentoDigital', 'Usuario'];
  stats = [
    { key: 'eventos', label: 'eventos hoy', color: '#194F9A' },
    { key: 'descargas', label: 'descargas hoy', color: '#3399CC' },
    { key: 'eliminaciones', label: 'eliminaciones hoy', color: '#A2372E' },
    { key: 'consultas', label: 'consultas hoy', color: '#194F9A' },
  ];
  private readonly actionStyles: Record<string, { label: string; color: string }> = {
    CREAR: { label: 'Creó', color: '#237A57' },
    MODIFICAR: { label: 'Modificó', color: '#B7791F' },
    CONSULTAR: { label: 'Consultó', color: '#194F9A' },
    DESCARGAR: { label: 'Descargó', color: '#3399CC' },
    ELIMINAR: { label: 'Eliminó', color: '#A2372E' },
  };
  actionLabel(action: string): string {
    return this.actionStyles[action]?.label ?? action;
  }
  actionColor(action: string): string {
    return this.actionStyles[action]?.color ?? '#667482';
  }
  /** Cifras de dos dígitos como en el diseño (03, 00, 12). */
  count(key: string): string {
    return String(this.summary()[key] ?? 0).padStart(2, '0');
  }
  ngOnInit() {
    this.load(0);
    this.api
      .auditSummary()
      .subscribe({ next: (s) => this.summary.set(s), error: (e) => this.dialog.error(e) });
  }
  load(p: number) {
    this.api.audit(this.filters, p).subscribe({
      next: (r) => {
        this.result.set(r);
        this.selected.set(r.contenido[0] ?? null);
      },
      error: (e) => this.dialog.error(e),
    });
  }
  async exportLog() {
    this.exporting.set(true);
    try {
      const rows: AuditEvent[] = [];
      let page = 0;
      while (true) {
        const p = await firstValueFrom(this.api.audit(this.filters, page, 100));
        rows.push(...p.contenido);
        if (++page >= p.totalPaginas) break;
      }
      const cell = (v: string) => '"' + (/^[=+@-]/.test(v) ? "'" + v : v).replace(/"/g, '""') + '"';
      const csv = [
        'Fecha,Usuario,Accion,Modulo,Recurso',
        ...rows.map((r) => [r.fecha, r.usuario, r.accion, r.modulo, r.recurso].map(cell).join(',')),
      ].join('\r\n');
      const url = URL.createObjectURL(
        new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bitacora.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      this.dialog.error(e);
    } finally {
      this.exporting.set(false);
    }
  }
}
