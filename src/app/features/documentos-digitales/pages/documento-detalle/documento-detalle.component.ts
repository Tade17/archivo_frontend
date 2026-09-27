import { Component, inject, signal, viewChild, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { DigitalFile, RecordFile } from '../../../../core/models/archive.model';
import { DocumentPreviewComponent } from '../../../../shared/components/document-preview.component';
import { DocumentSearchComponent } from '../../../../shared/components/document-search.component';
import { saveBlob } from '../../../../shared/utils/save-blob';
@Component({
  selector: 'app-documento-detalle',
  imports: [FormsModule, RouterLink, DocumentPreviewComponent, DocumentSearchComponent],
  template: ` <div class="page-heading">
      <div>
        <h1>Documento <strong>digital</strong></h1>
        <p>Consulta el archivo y su texto reconocido automáticamente.</p>
      </div>
      @if (doc(); as d) {
        <div class="rounded-[5px] bg-[var(--soft)] border border-[#cfe0ec] px-4 py-3 max-w-[340px]">
          <p class="eyebrow !text-[9px]">{{ d.expedienteCodigoUnico }} · DOCUMENTO</p>
          <p class="text-xs font-bold text-[var(--deep)] mt-1 break-words">
            {{ d.nombreArchivo }}@if (viewer()?.pages()) {
              · {{ viewer()?.pages() }} {{ viewer()?.pages() === 1 ? 'página' : 'páginas' }}
            }
          </p>
        </div>
      }
    </div>
    @if (doc(); as d) {
      <div class="workspace grid lg:grid-cols-[220px_minmax(300px,1fr)_320px] gap-6 items-start">
        <aside class="panel">
          <p class="eyebrow">CONTENIDO DEL EXPEDIENTE</p>
          <h3 class="mt-5 break-words">{{ d.nombreArchivo }}</h3>
          <dl class="data-list mt-4">
            <div>
              <dt>Tipo documental</dt>
              <dd>{{ record()?.tipoNombre }}</dd>
            </div>
            <div>
              <dt>Área de destino</dt>
              <dd>{{ record()?.areaDestinoNombre }}</dd>
            </div>
            <div>
              <dt>Formato de archivo</dt>
              <dd>{{ d.tipoMime }}</dd>
            </div>
            <div>
              <dt>Hash SHA-256 registrado</dt>
              <dd class="!text-[9px]">{{ d.hashSha256 }}</dd>
            </div>
          </dl>
          <a class="text-button block mt-6" [routerLink]="['/expedientes', d.expedienteId]"
            >← Ficha completa</a
          >
        </aside>
        <section class="min-w-0">
          <app-document-preview [id]="d.id" [name]="d.nombreArchivo" />
        </section>
        <aside class="min-w-0">
          @if (viewer(); as v) {
            <app-document-search [viewer]="v" />
          }
          <div class="panel mt-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h3>Texto reconocido</h3>
            <span
              class="badge"
              [class.neutral]="['PENDIENTE', 'PROCESANDO'].includes(d.ocrEstado)"
              [class.warning]="['REQUIERE_REVISION', 'ERROR'].includes(d.ocrEstado)"
              >{{ statusLabel(d) }}</span
            >
          </div>
          <p class="text-xs text-[var(--muted)] leading-6 mt-3" aria-live="polite">
            {{ statusMessage(d) }}
          </p>
          @if (d.ocrConfianza !== null) {
            <p class="text-[10px] text-[var(--muted)] mt-2">
              Confianza estimada: {{ confidencePercent(d) }}% · {{ d.ocrPaginas ?? 1 }} página(s)
            </p>
          }
          @if (!['PENDIENTE', 'PROCESANDO'].includes(d.ocrEstado)) {
            @if (editing()) {
              <label class="mt-5"
                >Corregir texto reconocido<textarea
                  rows="16"
                  maxlength="2000000"
                  [(ngModel)]="text"
                ></textarea>
              </label>
              <div class="flex flex-wrap gap-3 mt-4">
                <button class="btn" [disabled]="busy() || !text.trim()" (click)="saveText()">
                  {{ busy() ? 'Guardando…' : 'Guardar corrección' }}
                </button>
                <button class="btn secondary" [disabled]="busy()" (click)="cancelEdit()">
                  Cancelar
                </button>
              </div>
            } @else {
              <p
                class="mt-5 max-h-[520px] overflow-auto text-xs whitespace-pre-wrap break-words leading-6"
              >
                {{ d.ocrTexto || 'No se detectó texto en este documento.' }}
              </p>
              @if (auth.can('GESTOR_DOCUMENTAL')) {
                <div class="flex flex-wrap gap-3 mt-5">
                  <button class="btn secondary" (click)="startEdit()">Corregir texto</button>
                  @if (d.ocrEstado === 'ERROR') {
                    <button class="btn" [disabled]="busy()" (click)="retryOcr()">
                      {{ busy() ? 'Reintentando…' : 'Reintentar OCR' }}
                    </button>
                  }
                </div>
              }
            }
          }
          <p class="mt-6 text-[10px] leading-5 text-[var(--muted)]">
            El texto se incorpora automáticamente a la búsqueda. Las consultas y descargas quedan
            registradas en la bitácora.
          </p>
          </div>
          <button class="btn w-full mt-4" (click)="download()">↓ Descargar copia</button>
        </aside>
      </div>
    } @else {
      <div class="empty">Abriendo documento…</div>
    }`,
})
export class DocumentoDetalleComponent implements OnInit, OnDestroy {
  api = inject(ArchiveApi);
  auth = inject(AuthService);
  dialog = inject(DialogService);
  route = inject(ActivatedRoute);
  viewer = viewChild(DocumentPreviewComponent);
  doc = signal<DigitalFile | null>(null);
  record = signal<RecordFile | null>(null);
  busy = signal(false);
  editing = signal(false);
  text = '';
  private documentId = this.route.snapshot.paramMap.get('id')!;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.loadDocument(true, true);
  }

  ngOnDestroy() {
    if (this.pollTimer) clearTimeout(this.pollTimer);
  }

  private loadDocument(showError: boolean, loadRecord: boolean) {
    this.api.document(this.documentId).subscribe({
      next: (document) => {
        this.doc.set(document);
        if (!this.editing()) this.text = document.ocrTexto ?? '';
        if (loadRecord) {
          this.api.record(document.expedienteId).subscribe({
            next: (record) => this.record.set(record),
            error: (error) => this.dialog.error(error),
          });
        }
        this.schedulePoll(document);
      },
      error: (error) => {
        if (showError) this.dialog.error(error);
      },
    });
  }

  private schedulePoll(document: DigitalFile) {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (!['PENDIENTE', 'PROCESANDO'].includes(document.ocrEstado)) return;
    this.pollTimer = setTimeout(() => this.loadDocument(false, false), 2500);
  }

  statusLabel(document: DigitalFile) {
    return {
      PENDIENTE: 'OCR pendiente',
      PROCESANDO: 'Reconociendo texto',
      COMPLETADO: document.ocrRevisado ? 'Texto revisado' : 'OCR listo',
      REQUIERE_REVISION: 'Revisión recomendada',
      ERROR: 'No se pudo procesar',
    }[document.ocrEstado];
  }

  statusMessage(document: DigitalFile) {
    return {
      PENDIENTE: 'El documento está en cola. Puedes seguir trabajando mientras se procesa.',
      PROCESANDO:
        'El sistema está leyendo el documento. Esta vista se actualizará automáticamente.',
      COMPLETADO: document.ocrRevisado
        ? 'Una persona revisó el texto y guardó sus correcciones.'
        : 'El texto está disponible para consulta y búsqueda.',
      REQUIERE_REVISION:
        'El resultado tiene baja confianza o no contiene texto suficiente. Conviene revisarlo.',
      ERROR:
        document.ocrError || 'El servicio OCR no pudo procesar el archivo. Puedes reintentarlo.',
    }[document.ocrEstado];
  }

  confidencePercent(document: DigitalFile) {
    return Math.round((document.ocrConfianza ?? 0) * 100);
  }

  startEdit() {
    this.text = this.doc()?.ocrTexto ?? '';
    this.editing.set(true);
  }

  cancelEdit() {
    this.text = this.doc()?.ocrTexto ?? '';
    this.editing.set(false);
  }

  download() {
    const d = this.doc()!;
    this.api.binary(d.id, true).subscribe({
      next: (blob) => saveBlob(blob, d.nombreArchivo),
      error: (e) => this.dialog.error(e),
    });
  }

  retryOcr() {
    if (this.busy()) return;
    this.busy.set(true);
    this.api.retryOcr(this.documentId).subscribe({
      next: () => {
        this.busy.set(false);
        this.doc.update((document) =>
          document ? { ...document, ocrEstado: 'PENDIENTE', ocrError: null } : document,
        );
        this.loadDocument(false, false);
      },
      error: (error) => {
        this.busy.set(false);
        this.dialog.error(error);
      },
    });
  }

  async saveText() {
    if (this.busy() || !this.text.trim()) return;
    this.busy.set(true);
    if (
      !(await this.dialog.ask(
        'Guardar corrección',
        'El texto corregido reemplazará el resultado automático y se actualizará en la búsqueda.',
      ))
    ) {
      this.busy.set(false);
      return;
    }
    this.api.saveText(this.doc()!, this.text.trim(), this.auth.usuario()!.usuarioId).subscribe({
      next: (document) => {
        this.busy.set(false);
        this.editing.set(false);
        this.doc.set(document);
        this.text = document.ocrTexto ?? '';
        this.dialog.info(
          'Corrección guardada',
          'El texto actualizado ya está disponible para búsqueda.',
        );
      },
      error: (error) => {
        this.busy.set(false);
        this.dialog.error(error);
      },
    });
  }
}
