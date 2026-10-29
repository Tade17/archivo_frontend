import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';
import {
  Catalogs,
  ColumnaReporte,
  User,
  ReporteDefinicion,
  ReporteResultado,
} from '../../../../core/models/archive.model';
import { saveBlob } from '../../../../shared/utils/save-blob';
import { PagerComponent } from '../../../../shared/components/pager.component';

const FILTROS_INICIALES = {
  desde: '',
  hasta: '',
  fecha: 'REGISTRO',
  agrupar: 'MES',
  areaId: '',
  tipoId: '',
  estadoContenedor: 'TODOS',
  texto: '',
  soloVacias: false,
  estadoUsuario: 'TODOS',
  accion: 'TODAS',
  dias: '30',
  usuarioId: '',
};
type Filtros = typeof FILTROS_INICIALES;

const NUMERICOS: ColumnaReporte['tipo'][] = ['numero', 'promedio', 'porcentaje'];

@Component({
  selector: 'app-reportes',
  imports: [FormsModule, DatePipe, PagerComponent],
  template: `
    <div class="page-heading no-print">
      <div>
        <h1>Reportes <strong>del archivo</strong></h1>
        <p>
          Consulta, imprime o descarga en Excel información del archivo, la digitalización y los
          préstamos.
        </p>
      </div>
    </div>
    <div class="workspace grid gap-6 lg:grid-cols-[300px_1fr] items-start print:!block">
      <nav class="panel no-print !p-0 overflow-hidden" aria-label="Reportes disponibles">
        @for (g of grupos(); track g.nombre) {
          <p class="eyebrow px-5 pt-5 pb-2">{{ g.nombre.toUpperCase() }}</p>
          @for (r of g.items; track r.codigo) {
            <button
              type="button"
              class="block w-full text-left px-5 py-3 border-b border-[var(--line)] text-sm"
              [style.background]="actual()?.codigo === r.codigo ? '#EAF0F8' : null"
              [class.font-semibold]="actual()?.codigo === r.codigo"
              (click)="elegir(r)"
            >
              {{ r.titulo }}
            </button>
          }
        }
      </nav>

      <section class="min-w-0 space-y-6">
        @if (actual(); as r) {
          <div class="panel no-print">
            <p class="eyebrow">{{ r.grupo.toUpperCase() }}</p>
            <h2 class="mt-1">{{ r.titulo }}</h2>
            <p class="text-sm text-[var(--muted)] mt-1 mb-5">{{ r.descripcion }}</p>
            <form class="flex flex-wrap items-end gap-4" (ngSubmit)="generar()">
              @if (usa('desde')) {
                <label class="min-w-[150px]"
                  >Desde
                  <input
                    type="date"
                    name="desde"
                    [(ngModel)]="f.desde"
                    (ngModelChange)="alCambiar()"
                  />
                </label>
              }
              @if (usa('hasta')) {
                <label class="min-w-[150px]"
                  >Hasta
                  <input
                    type="date"
                    name="hasta"
                    [(ngModel)]="f.hasta"
                    (ngModelChange)="alCambiar()"
                  />
                </label>
              }
              @if (usa('fecha')) {
                <label class="min-w-[200px]"
                  >Fecha a considerar
                  <select name="fecha" [(ngModel)]="f.fecha" (ngModelChange)="alCambiar()">
                    <option value="REGISTRO">Registro en el sistema</option>
                    <option value="DOCUMENTO">Fecha del documento</option>
                  </select>
                </label>
              }
              @if (usa('agrupar')) {
                <label class="min-w-[130px]"
                  >Agrupar por
                  <select name="agrupar" [(ngModel)]="f.agrupar" (ngModelChange)="alCambiar()">
                    <option value="DIA">Día</option>
                    <option value="MES">Mes</option>
                    <option value="ANIO">Año</option>
                  </select>
                </label>
              }
              @if (usa('areaId')) {
                <label class="min-w-[200px]"
                  >Área de destino
                  <select name="areaId" [(ngModel)]="f.areaId" (ngModelChange)="alCambiar()">
                    <option value="">Todas</option>
                    @for (a of catalogos()?.areas; track a.id) {
                      <option [value]="a.id">{{ a.nombre }}</option>
                    }
                  </select>
                </label>
              }
              @if (usa('tipoId')) {
                <label class="min-w-[180px]"
                  >Tipo documental
                  <select name="tipoId" [(ngModel)]="f.tipoId" (ngModelChange)="alCambiar()">
                    <option value="">Todos</option>
                    @for (t of catalogos()?.tipos; track t.id) {
                      <option [value]="t.id">{{ t.nombre }}</option>
                    }
                  </select>
                </label>
              }
              @if (usa('estadoContenedor')) {
                <label class="min-w-[150px]"
                  >Estado
                  <select
                    name="estadoContenedor"
                    [(ngModel)]="f.estadoContenedor"
                    (ngModelChange)="alCambiar()"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="PENDIENTE">Pendientes</option>
                    <option value="COMPLETADO">Completados</option>
                  </select>
                </label>
              }
              @if (usa('usuarioId')) {
                <label class="min-w-[220px]"
                  >Usuario
                  <select name="usuarioId" [(ngModel)]="f.usuarioId" (ngModelChange)="alCambiar()">
                    <option value="">Todos</option>
                    @for (u of usuarios(); track u.id) {
                      <option [value]="u.id">{{ u.nombre }}</option>
                    }
                  </select>
                </label>
              }
              @if (usa('accion')) {
                <label class="min-w-[170px]"
                  >Acción
                  <select name="accion" [(ngModel)]="f.accion" (ngModelChange)="alCambiar()">
                    <option value="TODAS">Todas</option>
                    <option value="CREAR">Creó</option>
                    <option value="MODIFICAR">Modificó</option>
                    <option value="CONSULTAR">Consultó</option>
                    <option value="DESCARGAR">Descargó</option>
                    <option value="ELIMINAR">Eliminó</option>
                  </select>
                </label>
              }
              @if (usa('estadoUsuario')) {
                <label class="min-w-[170px]"
                  >Cuentas
                  <select
                    name="estadoUsuario"
                    [(ngModel)]="f.estadoUsuario"
                    (ngModelChange)="alCambiar()"
                  >
                    <option value="TODOS">Todas</option>
                    <option value="ACTIVOS">Activas</option>
                    <option value="SUSPENDIDOS">Suspendidas</option>
                    <option value="INACTIVOS">Sin actividad reciente</option>
                  </select>
                </label>
              }
              @if (usa('dias')) {
                <label class="min-w-[170px]"
                  >Sin actividad desde hace (días)
                  <input type="number" name="dias" min="1" max="3650" [(ngModel)]="f.dias" />
                </label>
              }
              @if (usa('texto')) {
                <label class="min-w-[220px] flex-1"
                  >Buscar
                  <input name="texto" [placeholder]="placeholderTexto()" [(ngModel)]="f.texto" />
                </label>
              }
              @if (usa('soloVacias')) {
                <label class="!flex !flex-row !items-center !gap-2 whitespace-nowrap"
                  ><input
                    type="checkbox"
                    name="soloVacias"
                    [(ngModel)]="f.soloVacias"
                    (ngModelChange)="alCambiar()"
                  />
                  Solo ubicaciones vacías
                </label>
              }
              <button class="btn" [disabled]="cargando()">
                {{ cargando() ? 'Generando…' : 'Generar reporte' }}
              </button>
            </form>
          </div>
        }

        @if (resultado(); as res) {
          <div class="panel">
            <div class="hidden print-label mb-4">
              <div class="flex items-center gap-4">
                <img src="/design/kSOoW.png" alt="Escudo" width="46" height="50" />
                <div>
                  <p class="eyebrow">MUNICIPALIDAD DISTRITAL DE SAN JOSÉ · ARCHIVO MUNICIPAL</p>
                  <h2 class="mt-1">{{ res.titulo }}</h2>
                </div>
              </div>
              <p class="text-xs mt-2">
                Generado el {{ ahora | date: 'dd/MM/yyyy HH:mm' }} por {{ auth.usuario()?.nombre }}
                @if (resumenFiltros()) {
                  · {{ resumenFiltros() }}
                }
              </p>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4 no-print">
              <p class="text-sm text-[var(--muted)]">
                <strong class="text-[var(--deep)]">{{ res.filas.length }}</strong>
                {{ res.filas.length === 1 ? 'fila' : 'filas' }}
                @if (resumenFiltros()) {
                  · {{ resumenFiltros() }}
                }
                @if (sinAplicar()) {
                  <span style="color: #b7791f">
                    · Cambiaste un filtro: presiona «Generar reporte» para actualizar antes de
                    descargar.</span
                  >
                }
              </p>
              <div class="flex gap-3">
                <button
                  class="btn secondary"
                  [disabled]="!res.filas.length || sinAplicar() || cargando()"
                  (click)="exportar()"
                >
                  Descargar Excel (CSV) ↓
                </button>
                <button
                  class="btn secondary"
                  [disabled]="!res.filas.length || sinAplicar() || cargando()"
                  (click)="imprimir()"
                >
                  Imprimir / PDF
                </button>
              </div>
            </div>
            @if (res.truncado) {
              <p class="text-sm mb-4" style="color: #b7791f">
                Se muestran solo las primeras 5000 filas. Use los filtros para acotar el reporte.
              </p>
            }
            <div class="overflow-x-auto print:overflow-visible">
              <table>
                <thead>
                  <tr>
                    @for (c of res.columnas; track c.clave) {
                      <th [class.text-right]="numerica(c)">{{ c.etiqueta.toUpperCase() }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (fila of filasVisibles(); track $index) {
                    <tr>
                      @for (c of res.columnas; track c.clave) {
                        <td class="text-xs" [class.text-right]="numerica(c)">
                          @if (res.codigo === 'actividad-usuario' && c.clave === 'usuario') {
                            <a
                              role="button"
                              tabindex="0"
                              class="font-semibold underline cursor-pointer text-[var(--brand)]"
                              title="Ver todo lo que hizo esta persona"
                              (click)="verDetalle(fila)"
                              (keydown.enter)="verDetalle(fila)"
                              >{{ fmt(c, fila[c.clave]) }}</a
                            >
                          } @else {
                            {{ fmt(c, fila[c.clave]) }}
                          }
                        </td>
                      }
                    </tr>
                  } @empty {
                    <tr>
                      <td [attr.colspan]="res.columnas.length" class="empty">
                        No hay datos para los filtros elegidos.
                      </td>
                    </tr>
                  }
                  @if (hayTotales()) {
                    <tr class="font-bold">
                      @for (c of res.columnas; track c.clave; let i = $index) {
                        <td class="text-xs" [class.text-right]="numerica(c)">
                          @if (esTotal(c)) {
                            {{ fmt(c, res.totales[c.clave]) }}
                          } @else if (i === 0) {
                            TOTAL
                          }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if (res.filas.length > tamano) {
              <app-pager
                class="no-print"
                [page]="pagina()"
                [size]="tamano"
                [total]="res.filas.length"
                (changed)="pagina.set($event)"
              />
            }
          </div>
        } @else if (!cargando()) {
          <div class="panel">
            <p class="empty">Elija un reporte de la lista.</p>
          </div>
        }
      </section>
    </div>
  `,
})
export class ReportesComponent implements OnInit {
  api = inject(ArchiveApi);
  auth = inject(AuthService);
  dialog = inject(DialogService);

  reportes = signal<ReporteDefinicion[]>([]);
  catalogos = signal<Catalogs | null>(null);
  usuarios = signal<User[]>([]);
  actual = signal<ReporteDefinicion | null>(null);
  resultado = signal<ReporteResultado | null>(null);
  cargando = signal(false);
  /** Filas por página en pantalla. El Excel y la impresión siempre llevan todas. */
  readonly tamano = 20;
  pagina = signal(0);
  imprimiendo = signal(false);
  filasVisibles = computed(() => {
    const filas = this.resultado()?.filas ?? [];
    return this.imprimiendo()
      ? filas
      : filas.slice(this.pagina() * this.tamano, (this.pagina() + 1) * this.tamano);
  });
  f: Filtros = { ...FILTROS_INICIALES };
  ahora = new Date();

  private fechas = new DatePipe('en-US');

  grupos = computed(() => {
    const porGrupo = new Map<string, ReporteDefinicion[]>();
    for (const r of this.reportes()) porGrupo.set(r.grupo, [...(porGrupo.get(r.grupo) ?? []), r]);
    return [...porGrupo].map(([nombre, items]) => ({ nombre, items }));
  });

  ngOnInit() {
    this.api.reportes().subscribe({
      next: (r) => {
        this.reportes.set(r);
        // Solo el Administrador ve reportes con filtro por usuario: ahí se necesita la lista de personas.
        if (r.some((x) => x.filtros.includes('usuarioId'))) {
          this.api.usersAll().subscribe({
            next: (p) => this.usuarios.set(p.contenido),
            error: (e) => this.dialog.error(e),
          });
        }
      },
      error: (e) => this.dialog.error(e),
    });
    this.api.catalogs().subscribe({
      next: (c) => this.catalogos.set(c),
      error: (e) => this.dialog.error(e),
    });
  }

  usa(filtro: string) {
    return !!this.actual()?.filtros.includes(filtro);
  }

  placeholderTexto() {
    const codigo = this.actual()?.codigo ?? '';
    if (codigo === 'eliminaciones') return 'Usuario o nombre de lo eliminado…';
    if (codigo === 'detalle-actividad') return 'Usuario, o nombre de lo que tocó…';
    if (['actividad-usuario', 'descargas-consultas', 'usuarios-estado'].includes(codigo))
      return 'Nombre o correo del usuario…';
    return codigo.startsWith('prestamos')
      ? 'Entidad, documento o archivador…'
      : 'Descripción del archivador…';
  }

  /** Desde el resumen "Actividad por usuario": abre el detalle de esa persona con el mismo periodo. */
  verDetalle(fila: Record<string, string | number | null>) {
    const detalle = this.reportes().find((r) => r.codigo === 'detalle-actividad');
    if (!detalle) return;
    this.actual.set(detalle);
    this.f = {
      ...FILTROS_INICIALES,
      desde: this.f.desde,
      hasta: this.f.hasta,
      usuarioId: String(fila['usuario_id'] ?? ''),
    };
    this.generar();
  }

  elegir(r: ReporteDefinicion) {
    this.actual.set(r);
    this.f = { ...FILTROS_INICIALES };
    this.generar();
  }

  /** Huella de los filtros que usa el reporte elegido (para saber si el resultado en pantalla sigue vigente). */
  private huella() {
    const r = this.actual();
    return r ? JSON.stringify(r.filtros.map((k) => this.f[k as keyof Filtros])) : '';
  }
  private aplicados = '';
  /** Hay filtros cambiados que todavía no se aplicaron al resultado que se ve. */
  sinAplicar() {
    return this.huella() !== this.aplicados;
  }
  /** Lista, fecha o casilla: se aplica al elegir (el texto y los días esperan al botón o a Intro). */
  alCambiar() {
    setTimeout(() => this.generar()); // espera a que el valor elegido llegue a `f`
  }

  generar() {
    const r = this.actual();
    if (!r) return;
    this.aplicados = this.huella();
    this.cargando.set(true);
    const filtros: Record<string, unknown> = {};
    for (const k of r.filtros) {
      const v = this.f[k as keyof Filtros];
      if (v !== '' && v !== false) filtros[k] = v;
    }
    this.api.reporte(r.codigo, filtros).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.pagina.set(0);
        this.ahora = new Date();
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.dialog.error(e);
      },
    });
  }

  numerica(c: ColumnaReporte) {
    return NUMERICOS.includes(c.tipo);
  }

  esTotal(c: ColumnaReporte) {
    return !!this.resultado() && c.clave in this.resultado()!.totales;
  }

  hayTotales() {
    const res = this.resultado();
    return !!res && res.filas.length > 1 && Object.keys(res.totales).length > 0;
  }

  /** Valor tal como se muestra en pantalla, impresión y exportación. */
  fmt(c: ColumnaReporte, v: unknown): string {
    if (v === null || v === undefined || v === '') return '—';
    switch (c.tipo) {
      case 'fecha':
        return this.fechas.transform(String(v), 'dd/MM/yyyy') ?? '—';
      case 'fechahora':
        return this.fechas.transform(String(v), 'dd/MM/yyyy HH:mm') ?? '—';
      case 'numero':
        return Number(v).toLocaleString('es-PE');
      case 'promedio':
        return Number(v).toLocaleString('es-PE', { maximumFractionDigits: 1 });
      case 'porcentaje':
        return Number(v).toLocaleString('es-PE', { maximumFractionDigits: 1 }) + ' %';
      default:
        return String(v);
    }
  }

  /** Filtros aplicados, en texto, para mostrar y para el encabezado impreso. */
  resumenFiltros() {
    const r = this.actual();
    if (!r) return '';
    const partes: string[] = [];
    const dia = (iso: string) => this.fechas.transform(iso, 'dd/MM/yyyy');
    if (this.usa('desde') && this.f.desde) partes.push('Desde ' + dia(this.f.desde));
    if (this.usa('hasta') && this.f.hasta) partes.push('Hasta ' + dia(this.f.hasta));
    if (this.usa('fecha') && this.f.fecha === 'DOCUMENTO') partes.push('Por fecha del documento');
    if (this.usa('agrupar'))
      partes.push(
        'Por ' +
          ({ DIA: 'día', MES: 'mes', ANIO: 'año' } as Record<string, string>)[this.f.agrupar],
      );
    const area = this.catalogos()?.areas.find((a) => a.id === this.f.areaId);
    if (this.usa('areaId') && area) partes.push('Área: ' + area.nombre);
    const tipo = this.catalogos()?.tipos.find((t) => t.id === this.f.tipoId);
    if (this.usa('tipoId') && tipo) partes.push('Tipo: ' + tipo.nombre);
    if (this.usa('estadoContenedor') && this.f.estadoContenedor !== 'TODOS')
      partes.push(this.f.estadoContenedor === 'PENDIENTE' ? 'Solo pendientes' : 'Solo completados');
    if (this.usa('estadoUsuario') && this.f.estadoUsuario !== 'TODOS')
      partes.push(
        (
          {
            ACTIVOS: 'Cuentas activas',
            SUSPENDIDOS: 'Cuentas suspendidas',
            INACTIVOS: 'Sin actividad reciente',
          } as Record<string, string>
        )[this.f.estadoUsuario],
      );
    if (this.usa('dias') && this.f.dias)
      partes.push('Umbral: ' + this.f.dias + ' días sin actividad');
    const persona = this.usuarios().find((u) => u.id === this.f.usuarioId);
    if (this.usa('usuarioId') && persona) partes.push('Usuario: ' + persona.nombre);
    if (this.usa('accion') && this.f.accion !== 'TODAS')
      partes.push(
        (
          {
            CREAR: 'Solo creaciones',
            MODIFICAR: 'Solo modificaciones',
            CONSULTAR: 'Solo consultas',
            DESCARGAR: 'Solo descargas',
            ELIMINAR: 'Solo eliminaciones',
          } as Record<string, string>
        )[this.f.accion],
      );
    if (this.usa('texto') && this.f.texto) partes.push('Búsqueda: «' + this.f.texto + '»');
    if (this.usa('soloVacias') && this.f.soloVacias) partes.push('Solo ubicaciones vacías');
    return partes.join(' · ');
  }

  imprimir() {
    this.imprimiendo.set(true); // se imprimen todas las filas, no solo la página visible
    window.addEventListener('afterprint', () => this.imprimiendo.set(false), { once: true });
    setTimeout(() => window.print(), 100); // da tiempo a dibujar la tabla completa
  }

  exportar() {
    const res = this.resultado();
    if (!res) return;
    const cell = (v: string) => '"' + (/^[=+@-]/.test(v) ? "'" + v : v).replace(/"/g, '""') + '"';
    const linea = (valores: string[]) => valores.map(cell).join(',');
    // Los números van sin formato para que Excel los reconozca como números.
    const valor = (c: ColumnaReporte, v: unknown) =>
      v == null ? '' : this.numerica(c) ? String(v) : this.fmt(c, v);
    const filas = res.filas.map((fila) => linea(res.columnas.map((c) => valor(c, fila[c.clave]))));
    if (this.hayTotales())
      filas.push(
        linea(
          res.columnas.map((c, i) =>
            this.esTotal(c) ? valor(c, res.totales[c.clave]) : i === 0 ? 'TOTAL' : '',
          ),
        ),
      );
    const csv = [linea(res.columnas.map((c) => c.etiqueta)), ...filas].join('\r\n');
    const dia = this.fechas.transform(new Date(), 'yyyyMMdd');
    saveBlob(
      new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }),
      `reporte-${res.codigo}-${dia}.csv`,
    );
  }
}
