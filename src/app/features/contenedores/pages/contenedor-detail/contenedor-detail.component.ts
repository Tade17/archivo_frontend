import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { Contenedor, Page, RecordFile, TipoContenedor } from '../../../../core/models/archive.model';
import { PagerComponent } from '../../../../shared/components/pager.component';
import { UbicacionPickerComponent } from '../../../../shared/components/ubicacion-picker.component';

@Component({
  selector: 'app-contenedor-detail',
  imports: [FormsModule, DatePipe, RouterLink, PagerComponent, UbicacionPickerComponent],
  template: `
    <div class="page-heading">
      <div>
        <h1>{{ c()?.tipo === 'FOLDER' ? 'Folder' : 'Archivador' }} <strong>físico</strong></h1>
        <p>Registra aquí, uno por uno, los documentos que contiene.</p>
      </div>
      <a class="btn secondary" routerLink="/contenedores">Volver a contenedores</a>
    </div>
    @if (c(); as c) {
      <div class="workspace grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        <section class="space-y-6 min-w-0">
          <div class="panel">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="eyebrow">{{ c.tipo === 'FOLDER' ? 'FOLDER' : 'ARCHIVADOR' }}</p>
                <h2 class="mt-1 break-words">{{ c.descripcion }}</h2>
                <p class="text-sm mt-2">
                  Sección <strong>{{ c.seccion }}</strong> · Nivel <strong>{{ c.nivel }}</strong> ·
                  Área <strong>{{ c.area }}</strong>
                </p>
              </div>
              <span class="flex flex-col items-end gap-2">
                <span class="badge" [class.warning]="c.estado === 'PENDIENTE'">{{
                  c.estado === 'PENDIENTE' ? 'Pendiente' : 'Completado'
                }}</span>
                @if (c.prestado) {
                  <span class="badge warning">Prestado</span>
                }
              </span>
            </div>
            @if (puedeEditar() && c.totalDocumentos > 0) {
              <div class="mt-4">
                <a
                  class="text-button"
                  routerLink="/prestamos"
                  [queryParams]="{ contenedorId: c.id }"
                  >Prestar este {{ c.tipo === 'FOLDER' ? 'folder' : 'archivador' }} completo →</a
                >
              </div>
            }
            @if (editando()) {
              <form #f="ngForm" class="mt-6 border-t border-[var(--line)] pt-6" (ngSubmit)="guardar()">
                <app-ubicacion-picker [(areaId)]="form.cajaId" />
                <div class="grid gap-4 md:grid-cols-[200px_1fr] mt-4">
                  <label
                    >Tipo
                    <select name="tipo" [(ngModel)]="form.tipo">
                      <option value="ARCHIVADOR">Archivador</option>
                      <option value="FOLDER">Folder</option>
                    </select>
                  </label>
                  <label
                    >Descripción
                    <input name="descripcion" required maxlength="255" [(ngModel)]="form.descripcion" />
                  </label>
                </div>
                <div class="flex justify-end gap-3 mt-5">
                  <button type="button" class="btn secondary" (click)="editando.set(false)">
                    Cancelar
                  </button>
                  <button class="btn" [disabled]="!f.valid || !form.cajaId || busy()">
                    Guardar cambios
                  </button>
                </div>
              </form>
            }
          </div>
          <div class="panel">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2>Documentos registrados ({{ docs()?.totalElementos ?? 0 }})</h2>
              @if (puedeEditar() && c.estado === 'PENDIENTE') {
                <a
                  class="btn"
                  routerLink="/expedientes/nuevo"
                  [queryParams]="{ contenedorId: c.id }"
                  >+ Agregar documento</a
                >
              }
            </div>
            @if (c.estado === 'COMPLETADO' && puedeEditar()) {
              <p class="text-xs text-[var(--muted)] mt-3">
                Este contenedor está completado. Si falta un documento, reábrelo para agregarlo.
              </p>
            }
            <div class="overflow-x-auto mt-4">
              <table>
                <thead>
                  <tr>
                    <th>N° DOCUMENTO</th>
                    <th>ASUNTO</th>
                    <th>REMITENTE</th>
                    <th>FECHA</th>
                    <th>FOLIOS</th>
                    <th>ARCHIVOS</th>
                  </tr>
                </thead>
                <tbody>
                  @for (d of docs()?.contenido; track d.id) {
                    <tr class="selectable" (click)="abrir(d)">
                      <td>
                        <a [routerLink]="['/expedientes', d.id]" class="font-semibold">{{
                          d.numeroDocumento
                        }}</a>
                      </td>
                      <td class="text-xs">{{ d.asunto }}</td>
                      <td class="text-xs">{{ d.remitente }}</td>
                      <td class="text-xs">{{ d.fechaDocumento | date: 'dd/MM/yyyy' }}</td>
                      <td>{{ d.numeroFolios ?? '—' }}</td>
                      <td>{{ d.totalDocumentos }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="empty">Todavía no hay documentos en este contenedor.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-pager
              [page]="docs()?.pagina ?? 0"
              [size]="20"
              [total]="docs()?.totalElementos ?? 0"
              (changed)="cargarDocs($event)"
            />
          </div>
        </section>
        <aside class="space-y-5">
          <section class="panel">
            <h3>Estado de la digitalización</h3>
            <p class="text-xs leading-6 text-[var(--muted)] mt-3">
              {{
                c.estado === 'PENDIENTE'
                  ? 'Quedan documentos por subir o falta confirmarlo. Cualquier gestor puede continuar donde se quedó.'
                  : 'Todos los documentos de este contenedor ya fueron registrados.'
              }}
            </p>
            @if (puedeEditar()) {
              @if (c.estado === 'PENDIENTE') {
                <button
                  class="btn w-full mt-5"
                  [disabled]="busy() || !c.totalDocumentos"
                  (click)="cambiarEstado('completar')"
                >
                  Marcar como completado
                </button>
                @if (!c.totalDocumentos) {
                  <p class="text-[10px] text-[var(--muted)] mt-2">
                    Registra al menos un documento antes de completarlo.
                  </p>
                }
              } @else {
                <button
                  class="btn secondary w-full mt-5"
                  [disabled]="busy()"
                  (click)="cambiarEstado('reabrir')"
                >
                  Reabrir (volver a pendiente)
                </button>
              }
            }
          </section>
          <section class="panel">
            <dl class="data-list">
              <div>
                <dt>Registrado por</dt>
                <dd>{{ c.creadoPorNombre }}</dd>
              </div>
              <div>
                <dt>Fecha de registro</dt>
                <dd>{{ c.fechaRegistro | date: 'dd/MM/yyyy HH:mm' }}</dd>
              </div>
              <div>
                <dt>Último cambio</dt>
                <dd>{{ c.fechaActualizacion | date: 'dd/MM/yyyy HH:mm' }}</dd>
              </div>
            </dl>
            @if (puedeEditar()) {
              <div class="grid gap-3 mt-5">
                <button class="btn secondary" [disabled]="busy()" (click)="empezarEdicion(c)">
                  Editar contenedor
                </button>
                @if (!c.totalDocumentos) {
                  <button class="btn danger-soft" [disabled]="busy()" (click)="eliminar()">
                    Eliminar contenedor vacío
                  </button>
                }
              </div>
            }
          </section>
        </aside>
      </div>
    } @else {
      <div class="empty">Cargando contenedor…</div>
    }
  `,
})
export class ContenedorDetailComponent implements OnInit {
  api = inject(ArchiveApi);
  auth = inject(AuthService);
  dialog = inject(DialogService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  id = this.route.snapshot.paramMap.get('id')!;
  c = signal<Contenedor | null>(null);
  docs = signal<Page<RecordFile> | null>(null);
  busy = signal(false);
  editando = signal(false);
  form: { cajaId: string; tipo: TipoContenedor; descripcion: string } = {
    cajaId: '',
    tipo: 'ARCHIVADOR',
    descripcion: '',
  };

  ngOnInit() {
    this.cargar();
    this.cargarDocs(0);
  }

  puedeEditar() {
    return this.auth.can('GESTOR_DOCUMENTAL');
  }

  cargar() {
    this.api.contenedor(this.id).subscribe({
      next: (c) => this.c.set(c),
      error: (e) => this.dialog.error(e),
    });
  }

  cargarDocs(page: number) {
    this.api.search({ contenedorId: this.id }, page, 20).subscribe({
      next: (p) => this.docs.set(p),
      error: (e) => this.dialog.error(e),
    });
  }

  abrir(d: RecordFile) {
    void this.router.navigate(['/expedientes', d.id]);
  }

  empezarEdicion(c: Contenedor) {
    this.form = { cajaId: c.areaId, tipo: c.tipo, descripcion: c.descripcion };
    this.editando.set(true);
  }

  async guardar() {
    this.busy.set(true);
    try {
      await firstValueFrom(
        this.api.saveContenedor(this.id, { ...this.form, descripcion: this.form.descripcion.trim() }),
      );
      this.editando.set(false);
      this.cargar();
    } catch (e) {
      this.dialog.error(e);
    } finally {
      this.busy.set(false);
    }
  }

  async cambiarEstado(accion: 'completar' | 'reabrir') {
    const pregunta =
      accion === 'completar'
        ? '¿Ya se subieron todos los documentos de este contenedor? Quedará marcado como completado.'
        : 'El contenedor volverá a quedar pendiente para poder agregarle documentos.';
    if (!(await this.dialog.ask(accion === 'completar' ? 'Marcar como completado' : 'Reabrir contenedor', pregunta)))
      return;
    this.busy.set(true);
    try {
      await firstValueFrom(this.api.cambiarEstadoContenedor(this.id, accion));
      this.cargar();
    } catch (e) {
      this.dialog.error(e);
    } finally {
      this.busy.set(false);
    }
  }

  async eliminar() {
    if (!(await this.dialog.ask('Eliminar contenedor', 'Se eliminará este contenedor vacío.'))) return;
    this.busy.set(true);
    try {
      await firstValueFrom(this.api.deleteContenedor(this.id));
      void this.router.navigate(['/contenedores']);
    } catch (e) {
      this.dialog.error(e);
    } finally {
      this.busy.set(false);
    }
  }
}
