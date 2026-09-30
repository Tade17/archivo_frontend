import {
  Component,
  inject,
  signal,
  viewChild,
  OnDestroy,
  OnInit,
  HostListener,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { DigitalFile, OcrLayout, OcrPage, OcrBlock } from '../../../../core/models/archive.model';
import { DocumentPreviewComponent } from '../../../../shared/components/document-preview.component';
import { DocumentSearchComponent } from '../../../../shared/components/document-search.component';
import { saveBlob } from '../../../../shared/utils/save-blob';
@Component({
  selector: 'app-documento-detalle',
  imports: [RouterLink, DocumentPreviewComponent, DocumentSearchComponent],
  template: `
    <div class="page-heading">
      <div>
        <h1>Documento <strong>digitalizado</strong></h1>
        <p>Selecciona, copia y busca texto en el PDF. Corrige un fragmento cuando lo necesites.</p>
      </div>
      @if (doc(); as d) {
        <a class="btn secondary" [routerLink]="['/expedientes', d.expedienteId]"
          >Volver al expediente</a
        >
      }
    </div>
    @if (doc(); as d) {
      <div class="workspace grid xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <section class="min-w-0">
          @if (correcting()) {
            <div class="bg-[#EAF3F9] px-5 py-4 text-sm text-[var(--deep)] mb-4" role="status">
              Selecciona un recuadro sobre la página para corregir su texto. La revisión es
              opcional.
            </div>
          }
          <div class="overflow-hidden rounded-[6px] border border-[var(--line)] bg-white">
            <app-document-preview
              [id]="d.id"
              [name]="displayName(d)"
              [revision]="d.ocrActualizadoEn"
              [layout]="draft()"
              [correcting]="correcting()"
              [selectedBlock]="selectedId()"
              [selectedPage]="selectedPage"
              [editingDisabled]="busy()"
              (blockChosen)="chooseBlock($event)"
              (blockEdited)="editBlock($event)"
            />
          </div>
        </section>
        <aside class="min-w-0 xl:sticky xl:top-5 space-y-5">
          <section class="panel">
            <h2 class="!text-[18px]">
              {{ d.pdfDisponible ? 'PDF con texto' : 'Generación del PDF' }}
            </h2>
            <span
              class="badge mt-3"
              [class.warning]="['REQUIERE_REVISION', 'ERROR'].includes(d.ocrEstado)"
              [class.neutral]="processing(d)"
              >{{ statusLabel(d) }}</span
            >
            <p class="text-xs leading-6 text-[var(--muted)] mt-3" aria-live="polite">
              {{ statusMessage(d) }}
            </p>
            @if (d.ocrConfianza !== null) {
              <p class="text-xs text-[var(--muted)] mt-2">
                Confianza estimada: {{ confidencePercent(d) }}%
              </p>
            }
            @if (d.pdfDisponible) {
              <button
                class="btn w-full mt-5"
                [disabled]="busy() || dirty()"
                (click)="downloadPdf()"
              >
                Descargar PDF con texto
              </button>
            }
            @if (auth.can('GESTOR_DOCUMENTAL') && d.pdfDisponible && draft().length) {
              <button
                class="btn secondary w-full mt-3"
                [disabled]="busy()"
                (click)="toggleCorrection()"
              >
                {{ correcting() ? 'Cerrar corrección' : 'Corregir texto en la página' }}
              </button>
              @if (correcting()) {
                <p class="text-xs leading-5 mt-4" aria-live="polite">
                  {{
                    dirty() ? 'Hay cambios sin guardar.' : 'Selecciona un fragmento del documento.'
                  }}
                </p>
                <button
                  class="btn w-full mt-3"
                  [disabled]="busy() || !dirty()"
                  (click)="saveCorrections()"
                >
                  {{ busy() ? 'Actualizando PDF…' : 'Guardar PDF y búsqueda' }}
                </button>
                <button
                  class="btn secondary w-full mt-3"
                  [disabled]="busy() || !dirty()"
                  (click)="resetCorrections()"
                >
                  Deshacer cambios
                </button>
              }
            }
            @if (
              auth.can('GESTOR_DOCUMENTAL') && !d.pdfDisponible && !processing(d) && !d.ocrRevisado
            ) {
              <button class="btn secondary w-full mt-4" [disabled]="busy()" (click)="retryOcr()">
                {{ busy() ? 'Preparando…' : 'Generar PDF con OCR' }}
              </button>
            }
            <p class="text-[11px] leading-5 text-[var(--muted)] mt-4">
              El PDF conserva la apariencia del escaneo. Las correcciones actualizan su texto
              seleccionable y el buscador.
            </p>
          </section>
          @if (viewer(); as v) {
            @if (v.pages()) {
              <app-document-search [viewer]="v" />
            }
          }
          <details class="panel">
            <summary class="cursor-pointer font-semibold">Transcripción y archivo original</summary>
            <p class="mt-4 text-xs leading-6 whitespace-pre-wrap max-h-[360px] overflow-auto">
              {{ d.ocrTexto || 'El texto estará disponible cuando termine el OCR.' }}
            </p>
            <button class="btn secondary w-full mt-4" (click)="downloadOriginal()">
              Descargar original
            </button>
            <p class="mt-3 text-[10px] break-all text-[var(--muted)]">
              SHA-256: {{ d.hashSha256 }}
            </p>
          </details>
        </aside>
      </div>
    } @else {
      <div class="empty">Abriendo documento…</div>
    }
  `,
})
export class DocumentoDetalleComponent implements OnInit, OnDestroy {
  api = inject(ArchiveApi);
  auth = inject(AuthService);
  dialog = inject(DialogService);
  route = inject(ActivatedRoute);
  viewer = viewChild(DocumentPreviewComponent);
  doc = signal<DigitalFile | null>(null);
  draft = signal<OcrPage[]>([]);
  busy = signal(false);
  dirty = signal(false);
  correcting = signal(false);
  selectedId = signal<string | null>(null);
  selectedPage = -1;
  private savedLayout: OcrLayout | null = null;
  private documentId = this.route.snapshot.paramMap.get('id')!;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  ngOnInit() {
    this.loadDocument();
  }
  ngOnDestroy() {
    if (this.pollTimer) clearTimeout(this.pollTimer);
  }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent) {
    if (this.dirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
  hasUnsavedChanges() {
    return this.dirty();
  }
  private loadDocument() {
    this.api.document(this.documentId).subscribe({
      next: (document) => {
        this.doc.set(document);
        if (document.pdfDisponible && !this.dirty()) this.loadLayout();
        if (this.pollTimer) clearTimeout(this.pollTimer);
        if (this.processing(document)) this.pollTimer = setTimeout(() => this.loadDocument(), 2500);
      },
      error: (error) => this.dialog.error(error),
    });
  }
  private loadLayout() {
    this.api.ocrLayout(this.documentId).subscribe({
      next: (value) => {
        this.savedLayout = value;
        this.draft.set(structuredClone(value.layout));
      },
      error: (error) => this.dialog.error(error),
    });
  }
  processing(d: DigitalFile) {
    return ['PENDIENTE', 'PROCESANDO'].includes(d.ocrEstado);
  }
  displayName(d: DigitalFile) {
    return d.pdfDisponible ? d.nombreArchivo.replace(/\.[^.]+$/, '') + '.pdf' : d.nombreArchivo;
  }
  statusLabel(d: DigitalFile) {
    return {
      PENDIENTE: 'En cola',
      PROCESANDO: 'Reconociendo texto',
      COMPLETADO: d.ocrRevisado ? 'Texto corregido' : 'Disponible',
      REQUIERE_REVISION: 'Disponible · baja confianza',
      ERROR: 'Error de procesamiento',
    }[d.ocrEstado];
  }
  statusMessage(d: DigitalFile) {
    if (this.processing(d)) return 'El PDF se genera automáticamente. Puedes seguir trabajando.';
    if (d.ocrEstado === 'ERROR')
      return d.ocrError || 'No se pudo generar el PDF. Puedes reintentarlo.';
    if (!d.pdfDisponible && d.ocrRevisado)
      return 'La transcripción anterior corregida se conserva. Su conversión a PDF necesita vincular esas correcciones con los fragmentos de la página; no se reprocesa para evitar perderlas.';
    if (!d.pdfDisponible)
      return 'Este archivo aún no tiene PDF con texto. Puedes generarlo sin volver a subirlo.';
    if (d.ocrEstado === 'REQUIERE_REVISION')
      return 'Puedes consultar el PDF. Corrige los fragmentos que encuentres incorrectos; la revisión es opcional.';
    return 'El contenido ya está disponible para selección, copia y búsqueda.';
  }
  confidencePercent(d: DigitalFile) {
    return Math.round((d.ocrConfianza ?? 0) * 100);
  }
  chooseBlock(value: { page: number; block: OcrBlock }) {
    this.selectedPage = value.page;
    this.selectedId.set(value.block.id);
  }
  editBlock(text: string) {
    if (this.busy()) return;
    this.draft.update((pages) =>
      pages.map((page, i) =>
        i !== this.selectedPage
          ? page
          : {
              ...page,
              blocks: page.blocks.map((block) =>
                block.id === this.selectedId() ? { ...block, text } : block,
              ),
            },
      ),
    );
    this.dirty.set(JSON.stringify(this.draft()) !== JSON.stringify(this.savedLayout?.layout));
  }
  toggleCorrection() {
    if (this.dirty()) {
      this.dialog.info(
        'Cambios pendientes',
        'Guarda o deshaz los cambios antes de cerrar la corrección.',
      );
      return;
    }
    this.correcting.update((v) => !v);
    this.selectedId.set(null);
  }
  resetCorrections() {
    this.draft.set(structuredClone(this.savedLayout?.layout ?? []));
    this.dirty.set(false);
    this.selectedId.set(null);
  }
  saveCorrections() {
    if (this.busy() || !this.dirty() || !this.savedLayout) return;
    this.busy.set(true);
    this.api
      .saveLayout(this.documentId, { layout: this.draft(), version: this.savedLayout.version })
      .subscribe({
        next: (document) => {
          this.busy.set(false);
          this.dirty.set(false);
          this.correcting.set(false);
          this.selectedId.set(null);
          this.doc.set(document);
          this.loadLayout();
          this.dialog.info(
            'PDF actualizado',
            'El texto corregido ya está disponible en el PDF y en el buscador.',
          );
        },
        error: (error) => {
          this.busy.set(false);
          this.dialog.error(error);
        },
      });
  }
  downloadPdf() {
    this.api.pdf(this.documentId).subscribe({
      next: (blob) => saveBlob(blob, this.displayName(this.doc()!)),
      error: (e) => this.dialog.error(e),
    });
  }
  downloadOriginal() {
    this.api.binary(this.documentId, true).subscribe({
      next: (blob) => saveBlob(blob, this.doc()!.nombreArchivo),
      error: (e) => this.dialog.error(e),
    });
  }
  retryOcr() {
    if (this.busy()) return;
    this.busy.set(true);
    this.api.retryOcr(this.documentId).subscribe({
      next: () => {
        this.busy.set(false);
        this.loadDocument();
      },
      error: (e) => {
        this.busy.set(false);
        this.dialog.error(e);
      },
    });
  }
}
