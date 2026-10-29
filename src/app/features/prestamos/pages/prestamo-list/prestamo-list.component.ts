import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { AlertasService } from '../../../../core/services/alertas.service';
import { AuthService } from '../../../../core/services/auth.service';
import { descargarCsv } from '../../../../shared/utils/export-csv';
import { Contenedor, Page, Prestamo, RecordFile } from '../../../../core/models/archive.model';
import { PagerComponent } from '../../../../shared/components/pager.component';
import { RecordPickerComponent } from '../../../../shared/components/record-picker.component';

const SEMAFORO_COLOR: Record<Prestamo['semaforo'], string> = {
  ROJO: '#B3261E',
  AMARILLO: '#B7791F',
  VERDE: '#237A57',
  GRIS: '#667482',
};

@Component({
  selector: 'app-prestamo-list',
  imports: [FormsModule, DatePipe, RouterLink, PagerComponent, RecordPickerComponent],
  template: `
    <div class="page-heading no-print">
      <div>
        <h1>Préstamos <strong>del archivo</strong></h1>
        <p>Controla qué documentos o archivadores salieron, a quién y cuándo deben volver.</p>
      </div>
      <button class="btn" (click)="creando() ? cerrarForm() : abrirForm()">
        {{ creando() ? 'Cancelar' : '+ Registrar préstamo' }}
      </button>
    </div>
    <div class="workspace space-y-6">
      @if (alertas.resumen(); as r) {
        <div class="grid sm:grid-cols-3 gap-4 no-print">
          <div class="panel !py-4">
            <p class="eyebrow">SIN DEVOLVER</p>
            <p class="text-2xl font-extrabold text-[var(--deep)] mt-1">{{ r.sinDevolver }}</p>
          </div>
          <div class="panel !py-4">
            <p class="eyebrow">POR VENCER (2 DÍAS O MENOS)</p>
            <p class="text-2xl font-extrabold mt-1" style="color: #b7791f">{{ r.porVencer }}</p>
          </div>
          <div class="panel !py-4">
            <p class="eyebrow">VENCIDOS</p>
            <p class="text-2xl font-extrabold mt-1" style="color: #b3261e">{{ r.vencidos }}</p>
          </div>
        </div>
      }

      @if (creando()) {
        <form #f="ngForm" class="panel no-print" (ngSubmit)="guardar()">
          <p class="eyebrow">NUEVO PRÉSTAMO</p>
          <h2 class="mt-1 mb-5">¿Qué se presta y a quién?</h2>
          <div class="flex flex-wrap gap-6 mb-5 text-sm">
            <label class="!flex !flex-row !items-center !gap-2 whitespace-nowrap"
              ><input
                type="radio"
                name="objeto"
                value="DOCUMENTO"
                [ngModel]="objeto()"
                (ngModelChange)="cambiarObjeto($event)"
              />Un documento</label
            >
            <label class="!flex !flex-row !items-center !gap-2 whitespace-nowrap"
              ><input
                type="radio"
                name="objeto"
                value="CONTENEDOR"
                [ngModel]="objeto()"
                (ngModelChange)="cambiarObjeto($event)"
              />Un archivador o folder completo</label
            >
          </div>

          @if (objeto() === 'DOCUMENTO') {
            @if (documento(); as d) {
              <div
                class="rounded-[6px] border border-[var(--line)] bg-[var(--soft)] px-4 py-3 mb-5 flex justify-between gap-3"
              >
                <div class="min-w-0">
                  <strong class="text-[var(--deep)]">{{ d.codigoUnico }}</strong>
                  <p class="text-xs mt-1">{{ d.asunto }}</p>
                  <p class="text-[10px] text-[var(--muted)] mt-1">{{ d.contenedorDescripcion }}</p>
                </div>
                <button type="button" class="text-button shrink-0" (click)="documento.set(null)">
                  Cambiar
                </button>
              </div>
            } @else {
              <div class="mb-5"><app-record-picker (chosen)="documento.set($event)" /></div>
            }
          } @else {
            @if (contenedor(); as c) {
              <div
                class="rounded-[6px] border border-[var(--line)] bg-[var(--soft)] px-4 py-3 mb-5 flex justify-between gap-3"
              >
                <div class="min-w-0">
                  <strong class="text-[var(--deep)]">{{ c.descripcion }}</strong>
                  <p class="text-xs mt-1">
                    Sección {{ c.seccion }} · Nivel {{ c.nivel }} · Área {{ c.area }} ·
                    {{ c.totalDocumentos }} documento(s)
                  </p>
                </div>
                <button type="button" class="text-button shrink-0" (click)="contenedor.set(null)">
                  Cambiar
                </button>
              </div>
            } @else {
              <div class="mb-5">
                <div class="flex gap-2">
                  <input
                    name="buscarContenedor"
                    placeholder="Descripción del archivador o folder…"
                    [(ngModel)]="textoContenedor"
                    (keydown.enter)="$event.preventDefault(); buscarContenedores()"
                  />
                  <button type="button" class="btn secondary" (click)="buscarContenedores()">
                    Localizar
                  </button>
                </div>
                @if (opciones(); as lista) {
                  <div class="mt-3 border border-[var(--line)] rounded-[8px] overflow-hidden">
                    @for (c of lista; track c.id) {
                      <button
                        type="button"
                        class="block text-left w-full px-4 py-3 border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--soft)]"
                        (click)="contenedor.set(c); opciones.set(null)"
                      >
                        <strong class="block text-xs text-[var(--deep)]">{{
                          c.descripcion
                        }}</strong>
                        <span class="block text-[10px] text-[var(--muted)] mt-1"
                          >Sección {{ c.seccion }} · Nivel {{ c.nivel }} · Área {{ c.area }} ·
                          {{ c.totalDocumentos }} documento(s)</span
                        >
                      </button>
                    } @empty {
                      <p class="p-4 text-xs text-[var(--muted)]">Sin coincidencias.</p>
                    }
                  </div>
                }
              </div>
            }
          }

          <div class="grid gap-4 md:grid-cols-[1fr_160px]">
            <label
              >Entidad o persona que lo solicita
              <input
                name="solicitante"
                required
                maxlength="200"
                placeholder="Ej. Contraloría - Sr. Pérez"
                [(ngModel)]="form.solicitante"
              />
            </label>
            <label
              >Días de préstamo
              <input name="dias" type="number" min="1" max="365" required [(ngModel)]="form.dias" />
            </label>
          </div>
          <label class="block mt-4"
            >Observaciones · opcional
            <input name="observaciones" maxlength="500" [(ngModel)]="form.observaciones" />
          </label>
          <div class="flex justify-end gap-3 mt-5">
            <button type="button" class="btn secondary" (click)="cerrarForm()">Cancelar</button>
            <button class="btn" [disabled]="!f.valid || !tieneObjeto() || busy()">
              Registrar préstamo
            </button>
          </div>
        </form>
      }

      <section class="panel no-print">
        <div class="flex flex-wrap items-end gap-4 mb-4">
          <label class="min-w-[180px]"
            >Mostrar
            <select [ngModel]="estado()" (ngModelChange)="filtrar($event)">
              <option value="ACTIVOS">Sin devolver</option>
              <option value="VENCIDOS">Vencidos</option>
              <option value="DEVUELTOS">Devueltos</option>
              <option value="TODOS">Todos</option>
            </select>
          </label>
          <form class="flex gap-2 flex-1 min-w-[240px]" (ngSubmit)="cargar(0)">
            <input
              name="texto"
              aria-label="Buscar préstamo"
              placeholder="Entidad, documento o archivador…"
              [(ngModel)]="texto"
            />
            <button class="btn secondary">Buscar</button>
          </form>
          <div class="flex gap-3">
            <button
              type="button"
              class="btn secondary"
              [disabled]="exportando() || !data()?.totalElementos"
              (click)="exportarExcel()"
            >
              Descargar Excel (CSV) ↓
            </button>
            <button
              type="button"
              class="btn secondary"
              [disabled]="exportando() || !data()?.totalElementos"
              (click)="imprimirPdf()"
            >
              Imprimir / PDF
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>ESTADO</th>
                <th>QUÉ SE PRESTÓ</th>
                <th>A QUIÉN</th>
                <th>SALIÓ</th>
                <th>DEBE VOLVER</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of data()?.contenido; track p.id) {
                <tr>
                  <td>
                    <span
                      class="inline-flex items-center gap-2 text-xs font-semibold"
                      [style.color]="color(p)"
                    >
                      <span class="w-2.5 h-2.5 rounded-full" [style.background]="color(p)"></span>
                      {{ etiqueta(p) }}
                    </span>
                  </td>
                  <td class="text-xs">
                    @if (p.objeto === 'DOCUMENTO') {
                      <a [routerLink]="['/expedientes', p.expedienteId]" class="font-semibold">{{
                        p.expedienteCodigo
                      }}</a>
                      <span class="block text-[var(--muted)]">{{ p.expedienteAsunto }}</span>
                    } @else {
                      <a [routerLink]="['/contenedores', p.contenedorId]" class="font-semibold">{{
                        p.contenedorDescripcion
                      }}</a>
                      <span class="block text-[var(--muted)]">Archivador / folder completo</span>
                    }
                    @if (p.observaciones) {
                      <span class="block text-[var(--muted)] italic">{{ p.observaciones }}</span>
                    }
                  </td>
                  <td class="text-xs">
                    {{ p.solicitante }}
                    <span class="block text-[var(--muted)]">Registró: {{ p.registradoPor }}</span>
                  </td>
                  <td class="text-xs">{{ p.fechaSolicitud | date: 'dd/MM/yyyy' }}</td>
                  <td class="text-xs">
                    @if (p.estado === 'DEVUELTO') {
                      Devuelto el {{ p.fechaDevolucionReal | date: 'dd/MM/yyyy' }}
                    } @else {
                      {{ p.fechaDevolucionPrevista | date: 'dd/MM/yyyy' }}
                    }
                  </td>
                  <td>
                    @if (p.estado === 'PRESTADO') {
                      <button class="text-button" [disabled]="busy()" (click)="devolver(p)">
                        Registrar devolución
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty">No hay préstamos en esta vista.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-pager
          [page]="data()?.pagina ?? 0"
          [size]="data()?.tamano ?? 20"
          [total]="data()?.totalElementos ?? 0"
          (changed)="cargar($event)"
        />
      </section>

      @if (filasImpresion(); as filas) {
        <div class="hidden print-label">
          <div class="flex items-center gap-4 mb-3">
            <img src="/design/kSOoW.png" alt="Escudo" width="46" height="50" />
            <div>
              <p class="eyebrow">MUNICIPALIDAD DISTRITAL DE SAN JOSÉ · ARCHIVO MUNICIPAL</p>
              <h2 class="mt-1">Préstamos del archivo</h2>
            </div>
          </div>
          <p class="text-xs mb-3">
            Generado el {{ ahora | date: 'dd/MM/yyyy HH:mm' }} por {{ auth.usuario()?.nombre }} ·
            {{ resumenFiltro() }} · {{ filas.length }} préstamo(s)
          </p>
          <table>
            <thead>
              <tr>
                <th>ESTADO</th>
                <th>QUÉ SE PRESTÓ</th>
                <th>A QUIÉN</th>
                <th>SALIÓ</th>
                <th>DEBE VOLVER / DEVUELTO</th>
                <th>REGISTRÓ</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filas; track p.id) {
                <tr>
                  <td class="text-xs">{{ etiqueta(p) }}</td>
                  <td class="text-xs">
                    {{ queSePresto(p) }}
                    @if (p.observaciones) {
                      <span class="block italic">{{ p.observaciones }}</span>
                    }
                  </td>
                  <td class="text-xs">{{ p.solicitante }}</td>
                  <td class="text-xs">{{ fecha(p.fechaSolicitud) }}</td>
                  <td class="text-xs">{{ fechaCierre(p) }}</td>
                  <td class="text-xs">{{ p.registradoPor }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class PrestamoListComponent implements OnInit {
  api = inject(ArchiveApi);
  dialog = inject(DialogService);
  alertas = inject(AlertasService);
  auth = inject(AuthService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  data = signal<Page<Prestamo> | null>(null);
  estado = signal<'ACTIVOS' | 'VENCIDOS' | 'DEVUELTOS' | 'TODOS'>('ACTIVOS');
  texto = '';
  busy = signal(false);
  exportando = signal(false);
  filasImpresion = signal<Prestamo[] | null>(null);
  ahora = new Date();
  private fechas = new DatePipe('en-US');

  creando = signal(false);
  objeto = signal<'DOCUMENTO' | 'CONTENEDOR'>('DOCUMENTO');
  documento = signal<RecordFile | null>(null);
  contenedor = signal<Contenedor | null>(null);
  opciones = signal<Contenedor[] | null>(null);
  textoContenedor = '';
  form = { solicitante: '', dias: 7, observaciones: '' };

  ngOnInit() {
    this.alertas.refrescar();
    this.cargar(0);
    const expedienteId = this.route.snapshot.queryParamMap.get('expedienteId');
    const contenedorId = this.route.snapshot.queryParamMap.get('contenedorId');
    if (expedienteId) {
      this.abrirForm();
      this.api.record(expedienteId).subscribe({
        next: (r) => this.documento.set(r),
        error: (e) => this.dialog.error(e),
      });
    } else if (contenedorId) {
      this.abrirForm();
      this.objeto.set('CONTENEDOR');
      this.api.contenedor(contenedorId).subscribe({
        next: (c) => this.contenedor.set(c),
        error: (e) => this.dialog.error(e),
      });
    }
  }

  color(p: Prestamo) {
    return SEMAFORO_COLOR[p.semaforo];
  }
  etiqueta(p: Prestamo) {
    const d = p.diasRestantes;
    switch (p.semaforo) {
      case 'GRIS':
        return 'Devuelto';
      case 'ROJO':
        return 'Vencido hace ' + Math.abs(d ?? 0) + ' día(s)';
      case 'AMARILLO':
        return d === 0 ? 'Vence hoy' : 'Vence en ' + d + ' día(s)';
      default:
        return 'En plazo · ' + d + ' días';
    }
  }
  tieneObjeto() {
    return this.objeto() === 'DOCUMENTO' ? !!this.documento() : !!this.contenedor();
  }
  abrirForm() {
    this.creando.set(true);
  }
  cerrarForm() {
    this.creando.set(false);
    this.documento.set(null);
    this.contenedor.set(null);
    this.opciones.set(null);
    this.form = { solicitante: '', dias: 7, observaciones: '' };
    if (this.route.snapshot.queryParamMap.keys.length)
      void this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }
  cambiarObjeto(v: 'DOCUMENTO' | 'CONTENEDOR') {
    this.objeto.set(v);
    this.documento.set(null);
    this.contenedor.set(null);
    this.opciones.set(null);
  }
  buscarContenedores() {
    this.api.contenedores({ texto: this.textoContenedor, estado: '' }, 0, 6).subscribe({
      next: (p) => this.opciones.set(p.contenido),
      error: (e) => this.dialog.error(e),
    });
  }
  filtrar(estado: 'ACTIVOS' | 'VENCIDOS' | 'DEVUELTOS' | 'TODOS') {
    this.estado.set(estado);
    this.cargar(0);
  }
  /** Todos los préstamos del filtro actual (la lista en pantalla solo muestra una página). */
  private async todos(): Promise<Prestamo[]> {
    const filas: Prestamo[] = [];
    let pagina = 0;
    while (true) {
      const p = await firstValueFrom(
        this.api.prestamos({ estado: this.estado(), texto: this.texto }, pagina, 100),
      );
      filas.push(...p.contenido);
      if (++pagina >= p.totalPaginas) break;
    }
    return filas;
  }
  fecha(iso: string | null) {
    return iso ? (this.fechas.transform(iso, 'dd/MM/yyyy') ?? '') : '';
  }
  queSePresto(p: Prestamo) {
    return p.objeto === 'DOCUMENTO'
      ? `${p.expedienteCodigo} · ${p.expedienteAsunto}`
      : `${p.contenedorDescripcion} (archivador / folder completo)`;
  }
  fechaCierre(p: Prestamo) {
    return p.estado === 'DEVUELTO'
      ? 'Devuelto el ' + this.fecha(p.fechaDevolucionReal)
      : this.fecha(p.fechaDevolucionPrevista);
  }
  /** Filtro aplicado, en texto, para el encabezado del reporte. */
  resumenFiltro() {
    const estados = {
      ACTIVOS: 'Sin devolver',
      VENCIDOS: 'Vencidos',
      DEVUELTOS: 'Devueltos',
      TODOS: 'Todos',
    };
    return (
      'Mostrar: ' + estados[this.estado()] + (this.texto ? ' · Búsqueda: «' + this.texto + '»' : '')
    );
  }
  async exportarExcel() {
    this.exportando.set(true);
    try {
      const filas = await this.todos();
      const dia = this.fechas.transform(new Date(), 'yyyyMMdd');
      descargarCsv(
        `prestamos-${this.estado().toLowerCase()}-${dia}.csv`,
        [
          'Estado',
          'Qué se prestó',
          'Tipo',
          'A quién',
          'Salió',
          'Debe volver',
          'Devuelto el',
          'Registró',
          'Observaciones',
        ],
        filas.map((p) => [
          this.etiqueta(p),
          this.queSePresto(p),
          p.objeto === 'DOCUMENTO' ? 'Documento' : 'Archivador o folder completo',
          p.solicitante,
          this.fecha(p.fechaSolicitud),
          this.fecha(p.fechaDevolucionPrevista),
          this.fecha(p.fechaDevolucionReal),
          p.registradoPor,
          p.observaciones ?? '',
        ]),
      );
    } catch (e) {
      this.dialog.error(e);
    } finally {
      this.exportando.set(false);
    }
  }
  /** Abre la impresión del navegador (elegir «Guardar como PDF») con todos los préstamos del filtro. */
  async imprimirPdf() {
    this.exportando.set(true);
    try {
      this.filasImpresion.set(await this.todos());
      this.ahora = new Date();
      window.addEventListener('afterprint', () => this.filasImpresion.set(null), { once: true });
      setTimeout(() => window.print(), 100); // da tiempo a dibujar la tabla de impresión
    } catch (e) {
      this.dialog.error(e);
    } finally {
      this.exportando.set(false);
    }
  }
  cargar(page: number) {
    this.api.prestamos({ estado: this.estado(), texto: this.texto }, page).subscribe({
      next: (p) => this.data.set(p),
      error: (e) => this.dialog.error(e),
    });
  }
  async guardar() {
    if (!this.tieneObjeto() || this.busy()) return;
    const destino =
      this.objeto() === 'DOCUMENTO'
        ? this.documento()!.codigoUnico
        : this.contenedor()!.descripcion;
    if (
      !(await this.dialog.ask(
        'Registrar préstamo',
        'Se prestará «' +
          destino +
          '» a ' +
          this.form.solicitante.trim() +
          ' por ' +
          this.form.dias +
          ' día(s).',
      ))
    )
      return;
    this.busy.set(true);
    this.api
      .crearPrestamo({
        expedienteId: this.objeto() === 'DOCUMENTO' ? this.documento()!.id : null,
        contenedorId: this.objeto() === 'CONTENEDOR' ? this.contenedor()!.id : null,
        solicitante: this.form.solicitante.trim(),
        dias: this.form.dias,
        observaciones: this.form.observaciones.trim() || null,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.cerrarForm();
          this.alertas.refrescar();
          this.cargar(0);
        },
        error: (e) => {
          this.busy.set(false);
          this.dialog.error(e);
        },
      });
  }
  async devolver(p: Prestamo) {
    const que = p.objeto === 'DOCUMENTO' ? p.expedienteCodigo : p.contenedorDescripcion;
    if (
      !(await this.dialog.ask(
        'Registrar devolución',
        '«' + que + '» fue devuelto por ' + p.solicitante + '.',
      ))
    )
      return;
    this.busy.set(true);
    this.api.devolverPrestamo(p.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.alertas.refrescar();
        this.cargar(this.data()?.pagina ?? 0);
      },
      error: (e) => {
        this.busy.set(false);
        this.dialog.error(e);
      },
    });
  }
}
