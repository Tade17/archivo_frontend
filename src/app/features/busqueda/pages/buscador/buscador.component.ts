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
          <input
            aria-label="Buscar en el archivo"
            name="texto"
            [(ngModel)]="filters.texto"
            placeholder="Licencia de construcción…"
            class="!border-[var(--brand)]"
          /><button class="btn w-36" [disabled]="busy()">Buscar →</button>
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
        <div class="flex items-baseline justify-between mb-5">
          <h2 class="text-[var(--brand)]">
            <span class="font-light text-3xl">{{ result()?.totalElementos ?? 0 }}</span>
            <span class="text-xs">expedientes</span>
          </h2>
          <small class="text-[var(--muted)]">Recientes ↓</small>
        </div>
        @if (busy()) {
          <p class="empty" aria-live="polite">Consultando archivo…</p>
        }
        @for (r of result()?.contenido; track r.id) {
          <button
            class="block w-full text-left py-5 px-3 border-b border-[var(--line)] border-l-2"
            [class]="
              selected()?.id === r.id ? 'bg-white border-l-[var(--brand)]' : 'border-l-transparent'
            "
            (click)="selected.set(r)"
          >
            <div class="text-[9px] text-[var(--muted)]">
              <span>{{ r.codigoUnico }}</span>
            </div>
            <h3 class="!text-xs text-[var(--deep)] mt-2 leading-5">{{ r.asunto }}</h3>
            <p class="text-[10px] text-[var(--muted)] mt-2">{{ r.areaDestinoNombre }}</p>
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
          <div class="bg-white px-5 py-4 border-b border-[var(--line)]">
            <p class="eyebrow">{{ r.codigoUnico }}</p>
            <h2 class="mt-2 text-[var(--deep)]">{{ r.asunto }}</h2>
          </div>
          <app-document-preview [id]="r.documentoId" />
        } @else {
          <div class="empty bg-[var(--soft)] min-h-[500px] flex flex-col justify-center">
            <h2>El archivo, a tu alcance</h2>
            <p>Selecciona un resultado para ver su documento.</p>
          </div>
        }
      </section>
      <aside class="bg-white px-5 py-6">
        @if (selected(); as r) {
          <p class="eyebrow">FICHA RÁPIDA</p>
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
              <dt>Archivo digital</dt>
              <dd>{{ r.totalDocumentos }} documento(s)</dd>
            </div>
            <div>
              <dt>Fecha del documento</dt>
              <dd>{{ r.fechaDocumento | date: 'dd/MM/yyyy' }}</dd>
            </div>
          </dl>
          @if (r.documentoId) {
            <a class="btn w-full mt-7" [routerLink]="['/documentos', r.documentoId]"
              >Abrir documento ↗</a
            >
          }
          <a class="btn secondary w-full mt-3" [routerLink]="['/expedientes', r.id]"
            >Ficha completa →</a
          >
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
}
