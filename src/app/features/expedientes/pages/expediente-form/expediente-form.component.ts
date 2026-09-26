import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { Catalogs } from '../../../../core/models/archive.model';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
@Component({
  selector: 'app-expediente-form',
  imports: [FormsModule, RouterLink, FileSizePipe],
  template: ` <div class="page-heading">
      <div>
        <h1>{{ id ? 'Editar' : 'Nuevo' }} <strong>expediente</strong></h1>
        <p>
          {{
            id
              ? 'Actualiza la información del expediente.'
              : 'Completa los datos y adjunta sus documentos en un solo paso.'
          }}
        </p>
      </div>
      <a routerLink="/buscar" class="btn secondary">Volver a Explorar</a>
    </div>
    <div class="workspace grid lg:grid-cols-[240px_1fr] gap-8">
      <aside class="space-y-4">
        <section class="panel">
          <p class="eyebrow">RUTA DEL REGISTRO</p>
          <ol class="mt-5 space-y-5">
            @for (step of steps; track step.number) {
              <li class="flex items-start gap-3">
                <span
                  class="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold"
                  [class]="
                    step.number === '01'
                      ? 'bg-[var(--brand)] text-white'
                      : 'bg-[#DDECF5] text-[var(--deep)]'
                  "
                  >{{ step.number }}</span
                >
                <span>
                  <strong class="block text-xs text-[var(--deep)]">{{ step.title }}</strong>
                  <span class="block text-[10px] text-[var(--muted)] mt-1">{{ step.detail }}</span>
                </span>
              </li>
            }
          </ol>
        </section>
        <section class="panel !bg-[#E7F4ED] !border-[#BFE0CE]">
          <strong class="block text-xs text-[var(--green)]">Numeración automática</strong>
          <p class="mt-2 text-[11px] leading-5 text-[var(--muted)]">
            El sistema asigna el número de registro y el código del expediente al guardar. No hace
            falta buscar ni adivinar el siguiente correlativo.
          </p>
        </section>
        @if (auth.hasRole('ADMIN')) {
          <a class="text-button block" routerLink="/catalogos">Configurar áreas y tipos →</a>
        }
      </aside>
      <form #form="ngForm" class="panel !p-0 overflow-hidden" (ngSubmit)="submit()">
        <div class="bg-[var(--deep)] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-[9px] tracking-[.12em] text-[var(--yellow)]">
              {{ id ? 'EDICIÓN DE EXPEDIENTE' : 'NUEVO EXPEDIENTE DIGITAL' }}
            </p>
            <h2 class="!text-white !text-base mt-1">Ficha de recepción</h2>
          </div>
          <div class="text-right text-[10px]">
            <p class="tracking-[.1em] text-[#B9CDE6]">CÓDIGO ÚNICO</p>
            <p class="font-semibold mt-1">{{ id ? 'Ya asignado' : 'Se asignará al registrar' }}</p>
          </div>
        </div>
        <div class="p-6">
        <p class="eyebrow">01 CLASIFICACIÓN</p>
        <h2 class="mb-5">Describe el expediente</h2>
        <div class="field-grid">
          <label
            >Número de documento<input
              name="numeroDocumento"
              required
              maxlength="50"
              [(ngModel)]="data.numeroDocumento" /></label
          ><label
            >Remitente<input
              name="remitente"
              required
              maxlength="255"
              [(ngModel)]="data.remitente" /></label
          ><label
            >Área de destino<select name="areaDestinoId" required [(ngModel)]="data.areaDestinoId">
              <option value="">Seleccionar área</option>
              @for (a of catalogs()?.areas; track a.id) {
                <option [value]="a.id">{{ a.nombre }}</option>
              }
            </select></label
          ><label
            >Fecha del documento<input
              type="date"
              name="fechaDocumento"
              required
              [(ngModel)]="data.fechaDocumento" /></label
          ><label
            >Tipo documental<select name="tipoId" required [(ngModel)]="data.tipoId">
              <option value="">Seleccionar tipo</option>
              @for (t of catalogs()?.tipos; track t.id) {
                <option [value]="t.id">{{ t.nombre }}</option>
              }
            </select></label
          ><label
            >Asunto<input name="asunto" required maxlength="500" [(ngModel)]="data.asunto"
          /></label>
        </div>
        <label class="mt-5"
          >Glosa · resumen del contenido<textarea
            name="glosa"
            rows="4"
            [(ngModel)]="data.glosa"
          ></textarea>
        </label>
        @if (!id) {
          <div class="rule"></div>
          <section aria-labelledby="documentos-iniciales">
            <p class="eyebrow">02 DOCUMENTO DIGITAL</p>
            <h2 id="documentos-iniciales" class="mt-1">Adjunta los archivos</h2>
            <p class="text-xs text-[var(--muted)] leading-6 mt-2">
              Puedes adjuntar uno o varios archivos ahora. También podrás hacerlo después desde la
              ficha del expediente.
            </p>
            <label class="btn secondary cursor-pointer mt-4">
              Seleccionar archivos
              <input
                class="sr-only"
                type="file"
                multiple
                accept=".pdf,.tiff,.tif,.jpg,.jpeg,.png"
                [disabled]="busy()"
                (change)="selectFiles($event)"
              />
            </label>
            <p class="text-[10px] text-[var(--muted)] mt-2">
              PDF, TIFF, JPG o PNG. Máximo 20 MB por archivo y 150 MB en total.
            </p>
            @if (files().length) {
              <ul class="mt-4 border-t border-[var(--line)]" aria-label="Archivos seleccionados">
                @for (file of files(); track file.name + file.size) {
                  <li
                    class="flex items-center justify-between gap-4 py-3 border-b border-[var(--line)]"
                  >
                    <span class="min-w-0 text-xs break-all">{{ file.name }}</span>
                    <span class="flex items-center gap-4 shrink-0">
                      <span class="text-[10px] text-[var(--muted)]">{{
                        file.size | fileSize
                      }}</span>
                      <button
                        type="button"
                        class="text-button"
                        [disabled]="busy()"
                        (click)="removeFile(file)"
                      >
                        Quitar
                      </button>
                    </span>
                  </li>
                }
              </ul>
            }
          </section>
        }
        </div>
        <div
          class="bg-[#F4F8FB] border-t border-[var(--line)] px-6 py-4 flex flex-wrap items-center justify-between gap-3"
        >
          <span class="text-[10px] text-[var(--muted)]">Los campos con datos son obligatorios.</span>
          <button class="btn" [disabled]="!form.valid || busy()">
            {{ busyLabel() || (id ? 'Guardar cambios' : 'Crear expediente') }}
          </button>
        </div>
      </form>
    </div>`,
})
export class ExpedienteFormComponent implements OnInit {
  api = inject(ArchiveApi);
  auth = inject(AuthService);
  dialog = inject(DialogService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  steps = [
    { number: '01', title: 'Clasificar expediente', detail: 'Área, tipo y asunto' },
    { number: '02', title: 'Adjuntar documento', detail: 'PDF, TIFF, JPG o PNG' },
    { number: '03', title: 'Registro automático', detail: 'Número y código asignados' },
  ];
  catalogs = signal<Catalogs | null>(null);
  id = this.route.snapshot.paramMap.get('id');
  busy = signal(false);
  busyLabel = signal('');
  files = signal<File[]>([]);
  data = {
    numeroDocumento: '',
    remitente: '',
    areaDestinoId: '',
    tipoId: '',
    fechaDocumento: new Date().toLocaleDateString('en-CA'),
    asunto: '',
    glosa: '',
  };
  ngOnInit() {
    this.api
      .catalogs()
      .subscribe({ next: (c) => this.catalogs.set(c), error: (e) => this.dialog.error(e) });
    if (this.id)
      this.api.record(this.id).subscribe({
        next: (r) =>
          (this.data = { ...this.data, ...r, fechaDocumento: r.fechaDocumento.slice(0, 10) }),
        error: (e) => this.dialog.error(e),
      });
  }
  selectFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    const next = [...this.files()];
    const rejected: string[] = [];
    const allowed = ['application/pdf', 'image/tiff', 'image/jpeg', 'image/png'];
    for (const file of Array.from(input.files ?? [])) {
      if (!allowed.includes(file.type) || !file.size || file.size > 20 * 1024 * 1024) {
        rejected.push(file.name);
        continue;
      }
      if (!next.some((item) => item.name === file.name && item.size === file.size)) next.push(file);
    }
    if (next.reduce((total, file) => total + file.size, 0) > 150 * 1024 * 1024) {
      this.dialog.info('Demasiados archivos', 'Selecciona como máximo 150 MB en total.');
    } else {
      this.files.set(next);
    }
    input.value = '';
    if (rejected.length) {
      this.dialog.info(
        'Algunos archivos no se añadieron',
        'Revisa el formato y el límite de 20 MB: ' + rejected.join(', '),
      );
    }
  }
  removeFile(file: File) {
    this.files.update((files) => files.filter((item) => item !== file));
  }
  async submit() {
    if (this.busy()) return;
    this.busy.set(true);
    this.busyLabel.set(this.id ? 'Guardando cambios…' : 'Creando expediente…');
    if (
      !(await this.dialog.ask(
        this.id ? 'Guardar cambios' : 'Registrar expediente',
        'Confirma que los datos del expediente digital son correctos.',
      ))
    ) {
      this.busy.set(false);
      this.busyLabel.set('');
      return;
    }
    const request = this.id ? this.api.edit(this.id, this.data) : this.api.receive(this.data);
    request.subscribe({
      next: (r) => {
        const recordId = this.id ?? (r as { id: string }).id;
        if (!this.id && this.files().length) {
          this.uploadInitialFiles(recordId);
          return;
        }
        this.finish(recordId);
      },
      error: (e) => {
        this.busy.set(false);
        this.busyLabel.set('');
        this.dialog.error(e);
      },
    });
  }
  private uploadInitialFiles(recordId: string) {
    this.busyLabel.set('Cargando documentos…');
    const body = new FormData();
    body.append('expedienteId', recordId);
    body.append('tecnicoResponsableId', this.auth.usuario()!.usuarioId);
    body.append('resolucionDpi', '300');
    for (const file of this.files()) body.append('archivos', file);
    this.api.upload(body).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.Response) this.finish(recordId);
      },
      error: () => {
        this.busy.set(false);
        this.busyLabel.set('');
        this.dialog.info(
          'Expediente creado sin documentos',
          'La ficha se guardó correctamente, pero los archivos no pudieron cargarse. Puedes intentarlo nuevamente desde la ficha del expediente.',
        );
        void this.router.navigate(['/expedientes', recordId]);
      },
    });
  }
  private finish(recordId: string) {
    this.busy.set(false);
    this.busyLabel.set('');
    void this.router.navigate(['/expedientes', recordId]);
  }
}
