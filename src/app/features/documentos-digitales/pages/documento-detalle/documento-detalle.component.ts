import { Component, inject, signal, viewChild, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { DigitalFile } from '../../../../core/models/archive.model';
import { DocumentPreviewComponent } from '../../../../shared/components/document-preview.component';
import { DocumentSearchComponent } from '../../../../shared/components/document-search.component';
import { Subscription } from 'rxjs';
import { saveBlob } from '../../../../shared/utils/save-blob';
@Component({
  selector: 'app-documento-detalle',
  imports: [RouterLink, DocumentPreviewComponent, DocumentSearchComponent],
  template: `
    <div class="page-heading">
      <div>
        <h1>Documento <strong>digitalizado</strong></h1>
        <p>Selecciona, copia y busca texto en el PDF. El texto reconocido no se puede editar.</p>
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
          <div class="overflow-hidden rounded-[6px] border border-[var(--line)] bg-white">
            <app-document-preview
              [id]="d.id"
              [name]="displayName(d)"
              [revision]="d.ocrActualizadoEn"
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
            <p
              class="text-xs leading-6 text-[var(--muted)] mt-3"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {{ statusMessage(d) }}
            </p>
            @if (!processing(d) && d.ocrConfianza !== null) {
              <p class="text-xs text-[var(--muted)] mt-2">
                Confianza estimada: {{ confidencePercent(d) }}%
              </p>
            }
            @if (d.pdfDisponible) {
              <button class="btn w-full mt-5" [disabled]="busy()" (click)="downloadPdf()">
                Descargar PDF con texto
              </button>
            }
            @if (auth.can('GESTOR_DOCUMENTAL') && !d.pdfDisponible && !processing(d)) {
              <button class="btn secondary w-full mt-4" [disabled]="busy()" (click)="retryOcr()">
                {{ busy() ? 'Preparando…' : 'Generar PDF con OCR' }}
              </button>
            }
            <p class="text-[11px] leading-5 text-[var(--muted)] mt-4">
              El PDF conserva la apariencia exacta del escaneo. El texto reconocido es de solo
              lectura: no se puede corregir ni editar, para preservar el documento tal como fue
              digitalizado.
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
          @if (auth.can('ADMIN')) {
            <button class="btn secondary w-full" (click)="removeDocument(d)">
              Eliminar archivo
            </button>
          }
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
  router = inject(Router);
  viewer = viewChild(DocumentPreviewComponent);
  doc = signal<DigitalFile | null>(null);
  busy = signal(false);
  private documentId = this.route.snapshot.paramMap.get('id')!;
  private destroyed = false;
  private subscriptions = new Subscription();
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  ngOnInit() {
    this.loadDocument();
  }
  ngOnDestroy() {
    this.destroyed = true;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = null;
    this.subscriptions.unsubscribe();
  }
  private loadDocument() {
    if (this.destroyed) return;
    this.subscriptions.add(
      this.api.document(this.documentId).subscribe({
        next: (document) => {
          if (this.destroyed) return;
          this.doc.set(document);
          if (this.pollTimer) clearTimeout(this.pollTimer);
          this.pollTimer = null;
          if (this.processing(document))
            this.pollTimer = setTimeout(() => this.loadDocument(), 2500);
        },
        error: (error) => {
          if (!this.destroyed) this.dialog.error(error);
        },
      }),
    );
  }
  async removeDocument(d: DigitalFile) {
    if (
      !(await this.dialog.ask(
        'Eliminar archivo',
        'Se eliminará «' +
          d.nombreArchivo +
          '» de forma definitiva. La acción queda registrada en Actividad.',
      ))
    )
      return;
    this.api.deleteDocument(d.id).subscribe({
      next: () => this.router.navigate(['/expedientes', d.expedienteId]),
      error: (e) => this.dialog.error(e),
    });
  }
  processing(d: DigitalFile) {
    return ['PENDIENTE', 'PROCESANDO'].includes(d.ocrEstado);
  }
  displayName(d: DigitalFile) {
    return d.pdfDisponible ? d.nombreArchivo.replace(/\.[^.]+$/, '') + '.pdf' : d.nombreArchivo;
  }
  statusLabel(d: DigitalFile) {
    if (this.processing(d)) {
      if (d.ocrFase === 'QUEUED') return 'En cola';
      if (d.ocrFase === 'EXPORTING' || d.ocrFase === 'COMPLETED') return 'Generando PDF';
      if (d.ocrFase === 'RETRY_WAIT') return 'Reintento programado';
    }
    return {
      PENDIENTE: 'En cola',
      PROCESANDO: 'Reconociendo texto',
      COMPLETADO: 'Disponible',
      REQUIERE_REVISION: 'Disponible · baja confianza',
      ERROR: 'Error de procesamiento',
    }[d.ocrEstado];
  }
  statusMessage(d: DigitalFile) {
    const progress = this.pageProgress(d);
    if (this.processing(d)) {
      let message = 'El PDF se genera automáticamente. Puedes seguir trabajando.';
      if (d.ocrFase === 'QUEUED')
        message = 'El documento está en cola. El reconocimiento comenzará automáticamente.';
      if (d.ocrFase === 'EXPORTING' || d.ocrFase === 'COMPLETED')
        message = 'Se está generando el PDF con texto. Puedes seguir trabajando.';
      if (d.ocrFase === 'RETRY_WAIT')
        message =
          'Hubo una interrupción temporal. El sistema reintentará el mismo trabajo automáticamente.';
      return progress ? progress + ' ' + message : message;
    }
    if (d.ocrEstado === 'ERROR')
      return (
        (progress ? progress + ' ' : '') +
        (d.ocrError || 'No se pudo generar el PDF. Puedes reintentarlo.')
      );
    if (!d.pdfDisponible)
      return 'Este archivo aún no tiene PDF con texto. Puedes generarlo sin volver a subirlo.';
    if (d.ocrEstado === 'REQUIERE_REVISION')
      return (
        (progress ? progress + ' ' : '') +
        'El reconocimiento tuvo baja confianza. Puedes consultar el PDF igualmente.'
      );
    return (
      (progress ? progress + ' ' : '') +
      'El contenido ya está disponible para selección, copia y búsqueda.'
    );
  }
  private pageProgress(d: DigitalFile) {
    const confirmed = d.ocrPaginasProcesadas;
    const total = d.ocrPaginasTotales;
    if (confirmed == null || !Number.isInteger(confirmed) || confirmed < 0 || confirmed > 100)
      return '';
    if (total == null)
      return confirmed > 0
        ? `${confirmed} ${confirmed === 1 ? 'página reconocida' : 'páginas reconocidas'}; total aún no disponible.`
        : '';
    if (!Number.isInteger(total) || total < 1 || total > 100 || confirmed > total) return '';
    return `${confirmed} de ${total} ${total === 1 ? 'página reconocida' : 'páginas reconocidas'}.`;
  }
  confidencePercent(d: DigitalFile) {
    return Math.round((d.ocrConfianza ?? 0) * 100);
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
    const current = this.doc();
    if (this.destroyed || this.busy() || !current || this.processing(current)) return;
    this.busy.set(true);
    this.subscriptions.add(
      this.api.retryOcr(this.documentId).subscribe({
        next: () => {
          if (this.destroyed) return;
          this.busy.set(false);
          this.loadDocument();
        },
        error: (e) => {
          if (this.destroyed) return;
          this.busy.set(false);
          this.dialog.error(e);
        },
      }),
    );
  }
}
