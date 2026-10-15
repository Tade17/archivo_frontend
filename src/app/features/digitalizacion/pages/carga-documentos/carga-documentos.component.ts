import { Component, computed, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { DigitalFile, RecordFile } from '../../../../core/models/archive.model';
import { RecordPickerComponent } from '../../../../shared/components/record-picker.component';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';

@Component({
  selector: 'app-carga-documentos',
  imports: [RouterLink, RecordPickerComponent, FileSizePipe],
  template: `
    <div class="page-heading">
      <div>
        <h1>Añadir <strong>documentos</strong></h1>
        <p>
          Selecciona tus archivos. El sistema reconocerá el texto automáticamente después de
          guardarlos.
        </p>
      </div>
    </div>
    <div class="workspace">
      <section class="panel destination" aria-label="Expediente de destino">
        @if (record(); as r) {
          <div class="destination-copy">
            <p class="destination-label">Expediente de destino</p>
            <strong>{{ r.codigoUnico }}</strong>
            <p class="record-subject">{{ r.asunto }}</p>
          </div>
          <div class="destination-actions">
            <a [routerLink]="['/expedientes', r.id]" class="text-button">Ver expediente</a>
            <button class="text-button" [disabled]="busy()" (click)="changeRecord()">
              Cambiar
            </button>
          </div>
        } @else {
          <div class="w-full">
            <h2 class="mb-4">Selecciona el expediente de destino</h2>
            <app-record-picker (chosen)="chooseRecord($event)" />
          </div>
        }
      </section>

      @if (savedDocuments().length) {
        <section class="panel saved-results" aria-labelledby="saved-title">
          <h2 id="saved-title" role="status">Documentos guardados</h2>
          <p class="support-copy mt-2">
            El OCR se ejecuta automáticamente en segundo plano. Guardado no significa que el
            reconocimiento haya terminado: abre cada documento para consultar su avance.
          </p>
          <ul class="saved-list">
            @for (document of savedDocuments(); track document.id) {
              <li>
                <span class="file-name">{{ document.nombreArchivo }}</span>
                <a [routerLink]="['/documentos', document.id]" class="text-button"
                  >Ver procesamiento</a
                >
              </li>
            }
          </ul>
          <p class="support-copy">Puedes continuar trabajando mientras se reconoce el texto.</p>
        </section>
      }

      <div class="intake-layout">
        <section class="panel files-panel" aria-labelledby="files-title" [attr.aria-busy]="busy()">
          <div class="files-heading">
            <div>
              <h2 id="files-title">Archivos para añadir</h2>
              <p class="support-copy mt-2">PDF, TIFF, JPG o PNG. Los originales se conservan.</p>
            </div>
            <button class="btn secondary" [disabled]="busy()" (click)="fileInput.click()">
              Seleccionar archivos
            </button>
            <input
              #fileInput
              class="sr-only"
              tabindex="-1"
              aria-label="Seleccionar archivos para el expediente"
              type="file"
              multiple
              accept=".pdf,.tiff,.tif,.jpg,.jpeg,.png"
              [disabled]="busy()"
              (change)="select($event)"
            />
          </div>
          <details class="limits">
            <summary>Formatos y límites de carga</summary>
            <p class="support-copy mt-2">
              Hasta 100 archivos, 20 MB por archivo y 150 MB por lote. Las imágenes juntas no pueden
              superar 20 MB; el PDF combinado admite hasta 100 páginas. Cada TIFF conserva el orden
              interno de sus páginas.
            </p>
          </details>

          @if (files().length) {
            <div class="queue-heading">
              <p>{{ files().length }} archivo(s) seleccionado(s)</p>
              <span>{{ summary().bytes | fileSize }} en total</span>
            </div>
            <ol class="file-list" aria-label="Archivos en orden de carga">
              @for (row of files(); track row.file; let i = $index) {
                <li>
                  <span class="file-order" aria-label="Posición">{{ i + 1 }}</span>
                  <div class="file-copy">
                    <p class="file-name">{{ row.file.name }}</p>
                    <p class="support-copy">
                      {{
                        row.file.type === 'application/pdf'
                          ? 'PDF separado'
                          : 'Imagen para el PDF combinado'
                      }}
                      · {{ row.file.size | fileSize }}
                    </p>
                  </div>
                  <div class="file-actions">
                    <button
                      class="text-button"
                      (click)="preview(row.file)"
                      [disabled]="busy()"
                      [attr.aria-label]="'Vista previa de ' + row.file.name + ' (nueva pestaña)'"
                    >
                      Vista previa
                    </button>
                    <button
                      class="text-button"
                      (click)="move(i, -1)"
                      [disabled]="busy() || i === 0"
                      [attr.aria-label]="'Mover ' + row.file.name + ' arriba'"
                    >
                      Subir
                    </button>
                    <button
                      class="text-button"
                      (click)="move(i, 1)"
                      [disabled]="busy() || i === files().length - 1"
                      [attr.aria-label]="'Mover ' + row.file.name + ' abajo'"
                    >
                      Bajar
                    </button>
                    <button
                      class="text-button"
                      (click)="remove(i)"
                      [disabled]="busy()"
                      [attr.aria-label]="'Quitar ' + row.file.name"
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              }
            </ol>
            <p class="quality-note support-copy">
              Comprueba que los archivos se lean bien y que las imágenes estén en el orden correcto.
              No necesitas transcribir el contenido: el OCR reconocerá el texto.
            </p>
          } @else {
            <div class="empty file-empty">
              <h3>Añade un PDF o tus imágenes</h3>
              <p>Las imágenes se unirán en un PDF; los PDF adjuntos quedarán separados.</p>
            </div>
          }
        </section>

        <aside class="panel result-panel" aria-labelledby="result-title">
          <h2 id="result-title">Qué se guardará</h2>
          <div class="output-summary" role="status" aria-live="polite" aria-atomic="true">
            @if (summary().documents) {
              <p class="result-count">{{ summary().documents }} documento(s)</p>
              <ul>
                @if (summary().images) {
                  <li>
                    <strong>1 PDF combinado</strong
                    ><span>{{ summary().images }} archivo(s) de imagen, en el orden elegido</span>
                  </li>
                }
                @if (summary().pdfs) {
                  <li>
                    <strong>{{ summary().pdfs }} PDF(s) separado(s)</strong
                    ><span>Se conserva cada documento por separado</span>
                  </li>
                }
              </ul>
            } @else {
              <p class="support-copy">
                Selecciona archivos para ver los documentos que se crearán.
              </p>
            }
          </div>
          <div class="automatic-copy">
            <h3>OCR automático</h3>
            <p class="support-copy mt-2">
              Después de guardar, el sistema reconocerá el texto para que puedas buscarlo y
              seleccionarlo. Podrás consultar el avance desde cada documento.
            </p>
          </div>
          <button class="btn w-full" [disabled]="!ready() || busy()" (click)="upload()">
            {{ busy() ? 'Guardando archivos…' : 'Guardar documentos' }}
          </button>
          <p class="save-hint support-copy" role="status" aria-live="polite">
            @if (busy()) {
              Espera a que se guarden los archivos. El OCR comenzará después.
            } @else if (!record()) {
              Selecciona un expediente para guardar.
            } @else if (!files().length) {
              Añade al menos un archivo para guardar.
            } @else {
              El reconocimiento de texto no bloquea tu trabajo.
            }
          </p>
          @if (saveError()) {
            <p class="save-error" role="alert">{{ saveError() }}</p>
          }
        </aside>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .destination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      padding: 18px 24px;
      margin-bottom: 24px;
    }
    .destination-copy {
      min-width: 0;
    }
    .destination-label {
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 5px;
    }
    .destination strong {
      color: var(--deep);
    }
    .record-subject {
      margin-top: 4px;
      overflow-wrap: anywhere;
    }
    .destination-actions,
    .files-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .destination-actions {
      flex-shrink: 0;
    }
    .intake-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 330px;
      gap: 24px;
      align-items: start;
    }
    .files-panel,
    .result-panel {
      min-width: 0;
    }
    .files-heading .btn {
      flex-shrink: 0;
    }
    .support-copy {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.7;
    }
    .limits {
      margin-top: 20px;
      font-size: 12px;
      color: var(--muted);
    }
    .limits summary {
      cursor: pointer;
      color: var(--brand);
    }
    .queue-heading {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px;
      padding: 20px 0 12px;
      font-size: 12px;
    }
    .queue-heading span {
      color: var(--muted);
    }
    .file-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .file-list li {
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr);
      column-gap: 12px;
      padding: 16px 0;
      border-top: 1px solid var(--line);
    }
    .file-order {
      color: var(--muted);
      font-size: 12px;
      padding-top: 2px;
    }
    .file-name {
      overflow-wrap: anywhere;
      font-weight: 600;
    }
    .file-actions {
      grid-column: 2;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
      margin-top: 8px;
    }
    .file-actions button {
      min-height: 32px;
    }
    .file-actions button:disabled {
      color: var(--muted);
    }
    .quality-note {
      padding-top: 16px;
      border-top: 1px solid var(--line);
    }
    .file-empty {
      padding: 48px 12px;
      margin-top: 20px;
      border-top: 1px solid var(--line);
    }
    .file-empty h3 {
      margin-bottom: 8px;
      color: var(--ink);
    }
    .file-empty p {
      font-size: 12px;
      line-height: 1.7;
    }
    .output-summary {
      margin-top: 20px;
    }
    .result-count {
      font-weight: 700;
      color: var(--deep);
    }
    .output-summary ul {
      list-style: none;
      margin: 16px 0 0;
      padding: 0;
    }
    .output-summary li + li {
      margin-top: 16px;
    }
    .output-summary li span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.7;
      margin-top: 4px;
    }
    .automatic-copy {
      padding-top: 20px;
      margin-top: 24px;
      margin-bottom: 24px;
      border-top: 1px solid var(--line);
    }
    .save-hint {
      margin-top: 12px;
    }
    .save-error {
      color: var(--error);
      font-size: 12px;
      line-height: 1.7;
      margin-top: 12px;
    }
    .saved-results {
      margin-bottom: 24px;
    }
    .saved-list {
      list-style: none;
      padding: 0;
      margin: 16px 0;
    }
    .saved-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--line);
    }
    .saved-list a {
      flex-shrink: 0;
    }
    @media (max-width: 1023px) {
      .intake-layout {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    @media (max-width: 599px) {
      .destination,
      .files-heading {
        align-items: flex-start;
        flex-direction: column;
        gap: 16px;
      }
      .destination-actions {
        flex-wrap: wrap;
        gap: 20px;
      }
      .saved-list li {
        align-items: flex-start;
        flex-direction: column;
        gap: 8px;
      }
      .files-heading .btn {
        width: 100%;
      }
    }
  `,
})
export class CargaDocumentosComponent implements OnInit {
  api = inject(ArchiveApi);
  auth = inject(AuthService);
  dialog = inject(DialogService);
  route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  record = signal<RecordFile | null>(null);
  files = signal<{ file: File }[]>([]);
  busy = signal(false);
  savedDocuments = signal<DigitalFile[]>([]);
  saveError = signal('');
  summary = computed(() => {
    const rows = this.files();
    const pdfs = rows.filter((row) => row.file.type === 'application/pdf').length;
    const images = rows.length - pdfs;
    return {
      images,
      pdfs,
      documents: pdfs + (images ? 1 : 0),
      bytes: rows.reduce((total, row) => total + row.file.size, 0),
    };
  });

  ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('expedienteId');
    if (id)
      this.api
        .record(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (record) => this.chooseRecord(record),
          error: (error) => this.dialog.error(error),
        });
  }

  chooseRecord(record: RecordFile) {
    if (this.busy()) return;
    if (this.record()?.id !== record.id) {
      this.savedDocuments.set([]);
      this.saveError.set('');
    }
    this.record.set(record);
  }

  changeRecord() {
    if (this.busy()) return;
    this.record.set(null);
    this.savedDocuments.set([]);
    this.saveError.set('');
  }

  select(event: Event) {
    if (this.busy()) return;
    const input = event.target as HTMLInputElement;
    const rows = [...this.files()];
    const rejected: string[] = [];
    for (const file of Array.from(input.files ?? [])) {
      if (
        !['application/pdf', 'image/tiff', 'image/jpeg', 'image/png'].includes(file.type) ||
        !file.size ||
        file.size > 20 * 1024 * 1024
      ) {
        rejected.push(file.name);
        continue;
      }
      if (!rows.some((row) => row.file.name === file.name && row.file.size === file.size))
        rows.push({ file });
    }
    if (rows.length > 100) {
      this.dialog.info('Demasiados archivos', 'Selecciona como máximo 100 archivos por carga.');
    } else if (
      rows
        .filter((row) => row.file.type !== 'application/pdf')
        .reduce((total, row) => total + row.file.size, 0) >
      20 * 1024 * 1024
    ) {
      this.dialog.info(
        'Demasiadas imágenes',
        'Las imágenes juntas no pueden superar 20 MB. Reduce el lote antes de cargarlo.',
      );
    } else if (rows.reduce((sum, row) => sum + row.file.size, 0) > 150 * 1024 * 1024) {
      this.dialog.info('Lote demasiado grande', 'Selecciona como máximo 150 MB por lote.');
    } else {
      this.files.set(rows);
      this.saveError.set('');
    }
    input.value = '';
    if (rejected.length)
      this.dialog.info(
        'Archivos no admitidos',
        'Revisa el formato y el límite de 20 MB: ' + rejected.join(', '),
      );
  }

  ready() {
    return !!this.record() && this.files().length > 0;
  }

  remove(index: number) {
    if (this.busy()) return;
    this.files.update((rows) => rows.filter((_, current) => current !== index));
  }

  move(index: number, direction: number) {
    if (
      this.busy() ||
      index < 0 ||
      index >= this.files().length ||
      index + direction < 0 ||
      index + direction >= this.files().length
    )
      return;
    this.files.update((rows) => {
      const next = [...rows];
      [next[index], next[index + direction]] = [next[index + direction], next[index]];
      return next;
    });
  }

  preview(file: File) {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  upload() {
    const record = this.record();
    if (!record || !this.ready() || this.busy()) return;
    this.busy.set(true);
    this.saveError.set('');
    const body = new FormData();
    body.append('expedienteId', record.id);
    body.append('tecnicoResponsableId', this.auth.usuario()!.usuarioId);
    for (const row of this.files()) body.append('archivos', row.file);
    this.api
      .upload(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.Response) {
            this.busy.set(false);
            if (!event.body?.length) {
              this.saveError.set(
                'No se pudo confirmar el resultado. Conservamos tu selección; consulta el expediente antes de volver a guardar.',
              );
              return;
            }
            this.savedDocuments.update((documents) => [...documents, ...event.body!]);
            this.files.set([]);
          }
        },
        error: (error) => {
          this.busy.set(false);
          this.saveError.set(
            'No se pudo guardar el lote. Tus archivos seleccionados se conservan para que puedas intentarlo de nuevo.',
          );
          this.dialog.error(error);
        },
      });
  }
}
