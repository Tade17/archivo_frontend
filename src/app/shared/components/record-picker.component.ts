import { Component, inject, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArchiveApi } from '../../core/services/archive-api.service';
import { DialogService } from '../../core/services/dialog.service';
import { Page, RecordFile } from '../../core/models/archive.model';
import { PagerComponent } from './pager.component';

const STATUS_COLORS: Record<string, string> = {
  Activo: '#237A57',
  'En trámite': '#B7791F',
  Registrado: '#194F9A',
  Archivado: '#667482',
};

@Component({
  selector: 'app-record-picker',
  imports: [FormsModule, PagerComponent],
  template: `
    <form class="flex gap-2" (ngSubmit)="search(0)">
      <div class="relative flex-1">
        <svg
          class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand)] pointer-events-none"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          aria-label="Localizar expediente"
          placeholder="Código, asunto o remitente…"
          [(ngModel)]="text"
          name="text"
          class="!pl-11"
        />
      </div>
      <button type="submit" class="btn secondary" [disabled]="busy()">
        {{ busy() ? 'Buscando…' : 'Localizar' }}
      </button>
    </form>
    @if (result(); as p) {
      <div class="mt-4 border border-[var(--line)] rounded-[8px] overflow-hidden">
        @for (r of p.contenido; track r.id) {
          <button
            type="button"
            class="block text-left w-full px-4 py-3 border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--soft)]"
            (click)="chosen.emit(r); result.set(null)"
          >
            <span class="flex items-center justify-between gap-2 text-[10px] text-[var(--muted)]">
              <strong class="text-[var(--deep)]">{{ r.codigoUnico }}</strong>
              <span class="inline-flex items-center gap-1" [style.color]="statusColor(r.estadoNombre)"
                ><span
                  class="w-1.5 h-1.5 rounded-full"
                  [style.background]="statusColor(r.estadoNombre)"
                ></span
                >{{ r.estadoNombre }}</span
              >
            </span>
            <span class="block text-xs text-[var(--ink)] mt-1.5">{{ r.asunto }}</span>
            <span class="block text-[10px] text-[var(--muted)] mt-1"
              >{{ r.areaDestinoNombre }} · {{ r.tipoNombre }}</span
            >
          </button>
        } @empty {
          <p class="p-4 text-xs text-[var(--muted)]">
            Sin coincidencias. Prueba con el código, el asunto o el remitente.
          </p>
        }
      </div>
      @if (p.totalElementos > p.tamano) {
        <div class="px-1">
          <app-pager [page]="p.pagina" [total]="p.totalElementos" [size]="p.tamano" (changed)="search($event)" />
        </div>
      }
    }
  `,
})
export class RecordPickerComponent {
  api = inject(ArchiveApi);
  dialog = inject(DialogService);
  chosen = output<RecordFile>();
  text = '';
  busy = signal(false);
  result = signal<Page<RecordFile> | null>(null);
  statusColor(estado: string): string {
    return STATUS_COLORS[estado] ?? '#667482';
  }
  search(page: number) {
    this.busy.set(true);
    this.api.search({ texto: this.text }, page).subscribe({
      next: (p) => {
        this.busy.set(false);
        this.result.set(p);
      },
      error: (e) => {
        this.busy.set(false);
        this.dialog.error(e);
      },
    });
  }
}
