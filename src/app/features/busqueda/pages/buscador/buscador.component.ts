import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { Catalogs, Page, RecordFile } from '../../../../core/models/archive.model';
import { DocumentPreviewComponent } from '../../../../shared/components/document-preview.component';
import { PagerComponent } from '../../../../shared/components/pager.component';
import { saveBlob } from '../../../../shared/utils/save-blob';

interface SearchFilters {
  texto: string;
  anio: string;
  areaDestinoId: string;
  tipoId: string;
}

@Component({
  selector: 'app-buscador',
  imports: [FormsModule, RouterLink, DatePipe, PagerComponent, DocumentPreviewComponent],
  template: ` <section
      class="relative bg-white overflow-hidden border-b border-[var(--line)] px-6 lg:px-16 py-8"
    >
      <img
        src="/design/YKw7T.png"
        alt=""
        class="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
      />
      <div class="relative">
        <div class="flex justify-between items-center gap-3">
          <h1 class="font-light text-[38px] text-[var(--deep)] tracking-[-1.5px]">
            Explora <strong class="font-extrabold">el archivo</strong>
          </h1>
          @if (auth.can('GESTOR_DOCUMENTAL')) {
            <a class="btn secondary" routerLink="/expedientes/nuevo">+ Nuevo expediente</a>
          }
        </div>
        <p class="text-xs text-[var(--muted)] mt-1">
          Encuentra, verifica y abre expedientes municipales desde un mismo lugar.
        </p>
        <form (ngSubmit)="search(0)" class="flex gap-2 max-w-[790px] mt-6">
          <div class="relative flex-1">
            <svg
              class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
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
              aria-label="Buscar en el archivo"
              name="texto"
              [(ngModel)]="filters.texto"
              placeholder="Licencia de construcción…"
              class="!border-[var(--brand)] !pl-11"
            />
          </div>
          <button class="btn w-36" [disabled]="busy()">Buscar →</button>
        </form>
        <div class="flex flex-wrap gap-3 mt-3 items-center max-w-[790px]">
          <select
            aria-label="Año"
            class="!w-24 !p-1 !text-[10px]"
            [(ngModel)]="filters.anio"
            (change)="search(0)"
          >
            <option value="">Año</option>
            @for (y of years; track y) {
              <option>{{ y }}</option>
            }
          </select>
          <select
            aria-label="Área de destino"
            class="!w-36 !p-1 !text-[10px]"
            [(ngModel)]="filters.areaDestinoId"
            (change)="search(0)"
          >
            <option value="">Todas las áreas</option>
            @for (a of catalogs()?.areas; track a.id) {
              <option [value]="a.id">{{ a.nombre }}</option>
            }
          </select>
          <select
            aria-label="Tipo documental"
            class="!w-32 !p-1 !text-[10px]"
            [(ngModel)]="filters.tipoId"
            (change)="search(0)"
          >
            <option value="">Todos los tipos</option>
            @for (t of catalogs()?.tipos; track t.id) {
              <option [value]="t.id">{{ t.nombre }}</option>
            }
          </select>
          <button type="button" class="text-button ml-auto" (click)="clear()">
            Limpiar filtros
          </button>
        </div>
      </div>
    </section>
    <div
      class="workspace grid lg:grid-cols-[minmax(240px,.85fr)_minmax(340px,1.65fr)_minmax(210px,.8fr)] gap-6 items-start"
    >
      <section>
        <div class="flex items-end justify-between mb-5">
          <div class="flex items-end gap-2 text-[var(--brand)]">
            <span class="font-light text-4xl leading-none">{{ result()?.totalElementos ?? 0 }}</span>
            <span class="leading-4"
              ><strong class="block text-xs">expedientes</strong
              ><small class="text-[var(--muted)]">ordenados por fecha</small></span
            >
          </div>
          <small class="text-[var(--muted)]">Recientes ↓</small>
        </div>
        @if (busy()) {
          <p class="empty" aria-live="polite">Consultando archivo…</p>
        }
        @for (r of result()?.contenido; track r.id; let i = $index) {
          <button
            class="flex gap-3 w-full text-left py-5 px-3 border-b border-[var(--line)]"
            [class]="selected()?.id === r.id ? 'bg-white rounded-[5px] shadow-sm' : ''"
            (click)="selected.set(r)"
          >
            <span
              class="w-8 h-8 shrink-0 rounded-[4px] flex items-center justify-center"
              [class]="
                selected()?.id === r.id
                  ? 'bg-[#DDECF5] text-[var(--deep)] font-extrabold text-xs'
                  : 'text-[var(--muted)] font-light text-base'
              "
              >{{ position(i) }}</span
            >
            <span class="min-w-0 flex-1">
              <span
                class="flex items-center justify-between gap-2 text-[9px] text-[var(--muted)]"
              >
                <span>{{ r.codigoUnico }}</span>
                <span class="inline-flex items-center gap-1" [style.color]="statusColor(r.estadoNombre)"
                  ><span
                    class="w-1.5 h-1.5 rounded-full"
                    [style.background]="statusColor(r.estadoNombre)"
                  ></span
                  >{{ r.estadoNombre }}</span
                >
              </span>
              <h3 class="!text-xs text-[var(--deep)] mt-2 leading-5">{{ r.asunto }}</h3>
              <p class="text-[10px] text-[var(--muted)] mt-2">{{ r.areaDestinoNombre }}</p>
            </span>
          </button>
        }
        @if (!busy() && !result()?.contenido?.length) {
          <div class="empty">
            <h2>Sin coincidencias</h2>
            <p>Prueba otros términos o registra el primer expediente.</p>
          </div>
        }
        <app-pager
          [page]="result()?.pagina ?? 0"
          [size]="4"
          [total]="result()?.totalElementos ?? 0"
          [busy]="busy()"
          (changed)="search($event)"
        />
      </section>
      <section class="min-w-0">
        @if (selected(); as r) {
          <div
            class="bg-white px-5 py-4 border-b border-[var(--line)] flex flex-wrap items-start justify-between gap-3"
          >
            <div class="min-w-0">
              <p class="eyebrow flex items-center gap-2">
                {{ r.codigoUnico }}
                <span class="inline-block w-4 h-0.5 bg-[var(--yellow)]"></span>
                <span class="uppercase">{{ r.tipoNombre }}</span>
              </p>
              <h2 class="mt-2 text-[var(--deep)]">{{ r.asunto }}</h2>
            </div>
            <div class="flex items-center gap-4 text-xs shrink-0">
              <span class="inline-flex items-center gap-1.5" [style.color]="statusColor(r.estadoNombre)"
                ><span
                  class="w-1.5 h-1.5 rounded-full"
                  [style.background]="statusColor(r.estadoNombre)"
                ></span
                >{{ r.estadoNombre }}</span
              >
              @if (r.documentoId) {
                <button class="text-button" (click)="download(r)">↓ Descargar</button>
              }
            </div>
          </div>
          <app-document-preview [id]="r.documentoId" [name]="r.documentoNombre" />
        } @else {
          <div class="empty bg-[var(--soft)] min-h-[500px] flex flex-col justify-center">
            <h2>El archivo, a tu alcance</h2>
            <p>Selecciona un resultado para ver su documento.</p>
          </div>
        }
      </section>
      <aside class="bg-white px-5 py-6">
        @if (selected(); as r) {
          <div class="flex items-center justify-between gap-2">
            <p class="eyebrow">FICHA RÁPIDA</p>
            <small class="text-[var(--muted)]"
              >Registrado · {{ r.fechaRegistro | date: 'dd/MM/yyyy' }}</small
            >
          </div>
          <dl class="data-list mt-4">
            <div>
              <dt>Área de destino</dt>
              <dd>{{ r.areaDestinoNombre }}</dd>
            </div>
            <div>
              <dt>Tipo documental</dt>
              <dd>{{ r.tipoNombre }}</dd>
            </div>
            <div>
              <dt>Remitente</dt>
              <dd>{{ r.remitente }}</dd>
            </div>
            <div>
              <dt>Archivo digital</dt>
              <dd>
                @if (r.documentoNombre) {
                  <span class="text-[var(--brand)] font-semibold">{{ r.documentoNombre }}</span>
                  @if (r.totalDocumentos > 1) {
                    <span class="text-[var(--muted)]"> · +{{ r.totalDocumentos - 1 }} más</span>
                  }
                } @else {
                  Sin documentos
                }
              </dd>
            </div>
            <div>
              <dt>Fecha del documento</dt>
              <dd>{{ r.fechaDocumento | date: 'dd/MM/yyyy' }}</dd>
            </div>
          </dl>
          <div class="flex items-center gap-4 mt-7">
            @if (r.documentoId) {
              <a class="btn" [routerLink]="['/documentos', r.documentoId]">Abrir documento ↗</a>
            }
            <a class="text-button" [routerLink]="['/expedientes', r.id]">Ficha completa →</a>
          </div>
        } @else {
          <p class="text-xs text-[var(--muted)]">Los datos del expediente aparecerán aquí.</p>
        }
      </aside>
    </div>`,
})
export class BuscadorComponent implements OnInit {
  api = inject(ArchiveApi);
  auth = inject(AuthService);
  dialog = inject(DialogService);
  catalogs = signal<Catalogs | null>(null);
  result = signal<Page<RecordFile> | null>(null);
  selected = signal<RecordFile | null>(null);
  busy = signal(false);
  filters: SearchFilters = {
    texto: '',
    anio: '',
    areaDestinoId: '',
    tipoId: '',
  };
  years = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i);
  private sequence = 0;
  ngOnInit() {
    this.api
      .catalogs()
      .subscribe({ next: (c) => this.catalogs.set(c), error: (e) => this.dialog.error(e) });
    this.search(0);
  }
  search(page: number) {
    const seq = ++this.sequence;
    this.busy.set(true);
    this.api.search(this.filters as unknown as Record<string, unknown>, page).subscribe({
      next: (p) => {
        if (seq !== this.sequence) return;
        this.result.set(p);
        this.selected.set(p.contenido[0] ?? null);
        this.busy.set(false);
      },
      error: (e) => {
        if (seq === this.sequence) {
          this.busy.set(false);
          this.dialog.error(e);
        }
      },
    });
  }
  clear() {
    this.filters = { texto: '', anio: '', areaDestinoId: '', tipoId: '' };
    this.search(0);
  }
  /** Número de orden del resultado dentro de toda la búsqueda (01, 02… continúa entre páginas). */
  position(index: number): string {
    const offset = (this.result()?.pagina ?? 0) * (this.result()?.tamano ?? 4);
    return String(offset + index + 1).padStart(2, '0');
  }
  statusColor(estado: string): string {
    const colors: Record<string, string> = {
      Activo: '#237A57',
      'En trámite': '#B7791F',
      Registrado: '#194F9A',
      Archivado: '#667482',
    };
    return colors[estado] ?? '#667482';
  }
  download(record: RecordFile) {
    if (!record.documentoId) return;
    this.api.binary(record.documentoId, true).subscribe({
      next: (blob) => saveBlob(blob, record.documentoNombre ?? 'documento'),
      error: (e) => this.dialog.error(e),
    });
  }
}
