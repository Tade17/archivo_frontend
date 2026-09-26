import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ArchiveApi } from '../../../core/services/archive-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { RecordFile, DigitalFile, Page } from '../../../core/models/archive.model';
import { PagerComponent } from '../../../shared/components/pager.component';

type StageTone = 'done' | 'pending' | 'current';

interface Stage {
  number: string;
  label: string;
  detail: string;
  tone: StageTone;
}

const TONE_CLASSES: Record<StageTone, string> = {
  done: 'border-[#7CC4A0] bg-[#E7F4ED] text-[var(--green)]',
  pending: 'border-[var(--line)] bg-white text-[var(--muted)]',
  current: 'border-[var(--brand)] bg-[#DDECF5] text-[var(--deep)]',
};

@Component({
  selector: 'app-expediente-detail',
  imports: [RouterLink, DatePipe, PagerComponent],
  template: ` <div class="page-heading">
      <div>
        <h1>Expediente <strong>en control</strong></h1>
        <p>Consulta sus metadatos y documentos digitales desde una sola ficha.</p>
      </div>
      @if (record(); as r) {
        <div class="flex gap-3">
          @for (s of stages(r); track s.number) {
            <div
              class="min-w-[112px] rounded-[6px] border px-4 py-3"
              [class]="toneClass(s.tone)"
            >
              <p class="text-[10px]">{{ s.number }}</p>
              <p class="text-xs font-bold mt-1">{{ s.label }}</p>
            </div>
          }
        </div>
      }
    </div>
    @if (record(); as r) {
      <div class="workspace grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        <section class="panel">
          <div
            class="rounded-[6px] bg-[#DDECF5] px-5 py-4 flex flex-wrap items-start justify-between gap-4"
          >
            <div class="min-w-0">
              <p class="eyebrow">EXPEDIENTE · {{ r.estadoNombre.toUpperCase() }}</p>
              <h2 class="mt-2 text-[var(--deep)]">{{ r.asunto }}</h2>
            </div>
            <div class="text-right shrink-0">
              <p class="text-[9px] tracking-[.1em] text-[var(--muted)]">CÓDIGO ÚNICO</p>
              <p class="font-extrabold text-sm text-[var(--deep)] mt-1">{{ r.codigoUnico }}</p>
            </div>
          </div>
          <dl class="data-list grid sm:grid-cols-2 gap-x-7 mt-4">
            <div>
              <dt>Número de documento</dt>
              <dd>{{ r.numeroDocumento }}</dd>
            </div>
            <div>
              <dt>Número de registro</dt>
              <dd>{{ r.numeroTramite }}</dd>
            </div>
            <div>
              <dt>Remitente</dt>
              <dd>{{ r.remitente }}</dd>
            </div>
            <div>
              <dt>Área de destino</dt>
              <dd>{{ r.areaDestinoNombre }}</dd>
            </div>
            <div>
              <dt>Tipo documental</dt>
              <dd>{{ r.tipoNombre }}</dd>
            </div>
            <div>
              <dt>Fecha del documento</dt>
              <dd>{{ r.fechaDocumento | date: 'dd/MM/yyyy' }}</dd>
            </div>
          </dl>
          <p class="eyebrow mt-7 mb-3">GLOSA</p>
          <p class="text-sm leading-7 whitespace-pre-wrap">
            {{ r.glosa || 'Sin glosa registrada.' }}
          </p>
          <div class="rule"></div>
          <p class="eyebrow">CICLO DOCUMENTAL</p>
          <h3 class="mt-1">Etapas y evidencia</h3>
          <div class="grid sm:grid-cols-3 gap-3 mt-4">
            @for (s of stages(r); track s.number) {
              <div class="rounded-[6px] border px-4 py-3" [class]="toneClass(s.tone)">
                <p class="text-[10px]">{{ s.label }}</p>
                <p class="text-xs font-bold mt-1">{{ s.detail }}</p>
              </div>
            }
          </div>
          <div
            class="mt-4 rounded-[6px] border border-[var(--yellow)] bg-[#FFFBEA] px-4 py-3 text-xs flex items-center gap-2"
          >
            <span class="w-2 h-2 rounded-full bg-[var(--green)]"></span>
            {{ nextAction(r) }}
          </div>
          <div class="rule"></div>
          <h3>Documentos del expediente</h3>
          @for (d of docs()?.contenido; track d.id) {
            <a
              class="flex justify-between py-4 border-b border-[var(--line)]"
              [routerLink]="['/documentos', d.id]"
              ><span>{{ d.nombreArchivo }}</span
              ><span>Ver →</span></a
            >
          }
          @if (!docs()?.totalElementos) {
            <p class="text-xs text-[var(--muted)] mt-4">Todavía no se han cargado documentos.</p>
          }
          <app-pager
            [page]="docs()?.pagina ?? 0"
            [size]="20"
            [total]="docs()?.totalElementos ?? 0"
            (changed)="loadDocs($event)"
          />
        </section>
        <aside class="space-y-5">
          <section class="panel !bg-[#EAF3F9]">
            <h3>Estado del expediente</h3>
            <ul class="mt-4 space-y-3 text-xs">
              @for (check of checklist(r); track check.text) {
                <li class="flex items-center gap-3">
                  <span
                    class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
                    [class]="check.ok ? 'bg-[var(--green)]' : 'bg-[#B8C6D2]'"
                    >{{ check.ok ? '✓' : '·' }}</span
                  >{{ check.text }}
                </li>
              }
            </ul>
          </section>
          <section class="panel">
            <h3>Datos del expediente digital</h3>
            <dl class="data-list mt-3">
              <div>
                <dt>Documento principal</dt>
                <dd>{{ r.documentoNombre || 'Sin documentos' }}</dd>
              </div>
              <div>
                <dt>Volumen</dt>
                <dd>{{ r.totalDocumentos }} documento(s)</dd>
              </div>
              <div>
                <dt>Registro</dt>
                <dd>{{ r.fechaRegistro | date: 'dd/MM/yyyy HH:mm' }}</dd>
              </div>
            </dl>
          </section>
          <div class="space-y-3">
            @if (docs()?.contenido?.[0]; as first) {
              <a class="btn w-full" [routerLink]="['/documentos', first.id]"
                >Abrir expediente digital</a
              >
            }
            @if (auth.can('GESTOR_DOCUMENTAL')) {
              <div class="grid grid-cols-2 gap-3">
                <a class="btn secondary" [routerLink]="['/expedientes', r.id, 'editar']"
                  >Editar ficha</a
                >
                <a
                  class="btn secondary"
                  routerLink="/digitalizar"
                  [queryParams]="{ expedienteId: r.id }"
                  >Añadir documentos</a
                >
              </div>
            }
            <p class="text-[10px] text-[var(--muted)] text-center">
              Todas las acciones quedan registradas en auditoría.
            </p>
            <a class="text-button block text-center" routerLink="/buscar">← Volver a Explorar</a>
          </div>
        </aside>
      </div>
    } @else {
      <div class="empty">Cargando expediente…</div>
    }`,
})
export class ExpedienteDetailComponent implements OnInit {
  api = inject(ArchiveApi);
  auth = inject(AuthService);
  dialog = inject(DialogService);
  route = inject(ActivatedRoute);
  record = signal<RecordFile | null>(null);
  docs = signal<Page<DigitalFile> | null>(null);
  id = this.route.snapshot.paramMap.get('id')!;
  ngOnInit() {
    this.api.record(this.id).subscribe({
      next: (r) => this.record.set(r),
      error: (e) => this.dialog.error(e),
    });
    this.loadDocs(0);
  }
  loadDocs(page: number) {
    this.api
      .documents(this.id, page)
      .subscribe({ next: (r) => this.docs.set(r), error: (e) => this.dialog.error(e) });
  }
  /** dd/MM a partir de una fecha ISO, sin depender de datos de idioma. */
  private shortDate(iso: string): string {
    const date = new Date(iso);
    return String(date.getDate()).padStart(2, '0') + '/' + String(date.getMonth() + 1).padStart(2, '0');
  }
  toneClass(tone: StageTone): string {
    return TONE_CLASSES[tone];
  }
  /** Etapas del recorrido de un expediente digital: registro, documentos y estado actual. */
  stages(r: RecordFile): Stage[] {
    const hasDocs = r.totalDocumentos > 0;
    return [
      {
        number: '01',
        label: 'Recepción',
        detail: this.shortDate(r.fechaRegistro) + ' · Registrado',
        tone: 'done',
      },
      {
        number: '02',
        label: 'Digitalización',
        detail: hasDocs ? `${r.totalDocumentos} documento(s) cargados` : 'Pendiente de cargar',
        tone: hasDocs ? 'done' : 'pending',
      },
      { number: '03', label: r.estadoNombre, detail: 'Estado actual', tone: 'current' },
    ];
  }
  checklist(r: RecordFile): { text: string; ok: boolean }[] {
    return [
      { text: 'Metadatos registrados', ok: true },
      { text: 'Número asignado: ' + r.numeroTramite, ok: !!r.numeroTramite },
      { text: 'Documento digital disponible', ok: r.totalDocumentos > 0 },
    ];
  }
  nextAction(r: RecordFile): string {
    return r.totalDocumentos > 0
      ? 'Siguiente acción disponible: abrir el expediente digital o añadir más documentos.'
      : 'Siguiente acción: adjuntar el documento digital de este expediente.';
  }
}
