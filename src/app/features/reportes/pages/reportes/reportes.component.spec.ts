import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ReportesComponent } from './reportes.component';
import {
  ColumnaReporte,
  ReporteDefinicion,
  ReporteResultado,
} from '../../../../core/models/archive.model';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';

const columna = (tipo: ColumnaReporte['tipo']): ColumnaReporte => ({
  clave: 'x',
  etiqueta: 'X',
  tipo,
});

const definicion: ReporteDefinicion = {
  codigo: 'expedientes-periodo',
  grupo: 'Producción del archivo',
  titulo: 'Expedientes por periodo',
  descripcion: '',
  filtros: ['desde', 'hasta', 'agrupar', 'areaId'],
};

const resultado: ReporteResultado = {
  codigo: 'expedientes-periodo',
  titulo: 'Expedientes por periodo',
  columnas: [
    { clave: 'periodo', etiqueta: 'Periodo', tipo: 'texto' },
    { clave: 'expedientes', etiqueta: 'Expedientes', tipo: 'numero' },
    { clave: 'nota', etiqueta: 'Nota', tipo: 'texto' },
  ],
  filas: [
    { periodo: '09/2026', expedientes: 1200, nota: '=SUMA(A1)' },
    { periodo: '10/2026', expedientes: 5, nota: null },
  ],
  totales: { expedientes: 1205 },
  truncado: false,
};

describe('Reportes', () => {
  const api = { reportes: vi.fn(), catalogs: vi.fn(), reporte: vi.fn(), usersAll: vi.fn() };
  const dialog = { error: vi.fn() };
  let component: ReportesComponent;

  beforeEach(() => {
    vi.clearAllMocks();
    api.reportes.mockReturnValue(of([definicion]));
    api.catalogs.mockReturnValue(
      of({ areas: [{ id: 'a1', nombre: 'Alcaldía' }], tipos: [], roles: [] }),
    );
    api.reporte.mockReturnValue(of(resultado));
    api.usersAll.mockReturnValue(
      of({ contenido: [{ id: 'u1', nombre: 'Rosa Chero', correo: 'rosa@sanjose.gob.pe' }] }),
    );
    TestBed.configureTestingModule({
      providers: [
        { provide: ArchiveApi, useValue: api },
        { provide: AuthService, useValue: { usuario: () => ({ nombre: 'Rosa' }) } },
        { provide: DialogService, useValue: dialog },
      ],
    });
    component = TestBed.runInInjectionContext(() => new ReportesComponent());
  });

  it('agrupa los reportes por grupo al cargar', () => {
    component.ngOnInit();
    expect(component.grupos()).toEqual([{ nombre: 'Producción del archivo', items: [definicion] }]);
  });

  it('formatea cada tipo de columna y muestra un guion si no hay dato', () => {
    expect(component.fmt(columna('fecha'), '2026-10-24')).toBe('24/10/2026');
    expect(component.fmt(columna('numero'), 1234)).toBe((1234).toLocaleString('es-PE'));
    expect(component.fmt(columna('porcentaje'), 33.3)).toContain('%');
    expect(component.fmt(columna('texto'), 'Oficio')).toBe('Oficio');
    expect(component.fmt(columna('fechahora'), null)).toBe('—');
  });

  it('al elegir un reporte envía solo los filtros que ese reporte usa y con valor', () => {
    component.ngOnInit();
    component.f.areaId = 'a1';
    component.f.texto = 'no aplica a este reporte';
    component.actual.set(definicion);
    component.generar();
    expect(api.reporte).toHaveBeenCalledWith('expedientes-periodo', {
      agrupar: 'MES',
      areaId: 'a1',
    });
    expect(component.resultado()).toBe(resultado);
  });

  it('elegir un reporte reinicia los filtros y lo genera', () => {
    component.f.areaId = 'a1';
    component.elegir(definicion);
    expect(component.f.areaId).toBe('');
    expect(api.reporte).toHaveBeenCalledWith('expedientes-periodo', { agrupar: 'MES' });
  });

  it('pagina las filas en pantalla, pero imprime todas', () => {
    vi.useFakeTimers();
    const filas = Array.from({ length: 45 }, (_, i) => ({
      periodo: 'P' + i,
      expedientes: i,
      nota: null,
    }));
    component.resultado.set({ ...resultado, filas });

    expect(component.filasVisibles()).toHaveLength(20);
    expect(component.filasVisibles()[0]['periodo']).toBe('P0');
    component.pagina.set(2); // la última página tiene lo que sobra
    expect(component.filasVisibles()).toHaveLength(5);
    expect(component.filasVisibles()[0]['periodo']).toBe('P40');

    const imprimirNavegador = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    component.imprimir();
    expect(component.filasVisibles()).toHaveLength(45); // para imprimir se muestran todas
    vi.advanceTimersByTime(150);
    expect(imprimirNavegador).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('afterprint'));
    expect(component.filasVisibles()).toHaveLength(5); // y se vuelve a la página en pantalla
    vi.useRealTimers();
  });

  it('al generar un reporte vuelve a la primera página', () => {
    component.actual.set(definicion);
    component.pagina.set(3);
    component.generar();
    expect(component.pagina()).toBe(0);
  });

  it('no deja descargar un resultado que ya no corresponde a los filtros elegidos', () => {
    component.actual.set(definicion);
    component.generar();
    expect(component.sinAplicar()).toBe(false);

    component.f.areaId = 'a1'; // se cambió un filtro y todavía no se generó de nuevo
    expect(component.sinAplicar()).toBe(true);

    component.generar();
    expect(component.sinAplicar()).toBe(false);
    component.f.texto = 'algo'; // un filtro que este reporte no usa no cuenta
    expect(component.sinAplicar()).toBe(false);
  });

  it('al elegir un filtro de lista se genera solo, con el valor elegido', () => {
    vi.useFakeTimers();
    const accion: ReporteDefinicion = {
      ...definicion,
      codigo: 'detalle-actividad',
      filtros: ['accion'],
    };
    component.actual.set(accion);
    component.f.accion = 'CREAR';

    component.alCambiar();
    expect(api.reporte).not.toHaveBeenCalled(); // espera a que el valor llegue al modelo
    vi.advanceTimersByTime(1);
    expect(api.reporte).toHaveBeenCalledWith('detalle-actividad', { accion: 'CREAR' });
    expect(component.sinAplicar()).toBe(false);
    vi.useRealTimers();
  });

  it('desde el resumen de actividad abre el detalle de esa persona con el mismo periodo', () => {
    const detalle: ReporteDefinicion = {
      codigo: 'detalle-actividad',
      grupo: 'Seguridad y auditoría',
      titulo: 'Detalle de actividad por usuario',
      descripcion: '',
      filtros: ['desde', 'hasta', 'usuarioId', 'accion', 'texto'],
    };
    api.reportes.mockReturnValue(of([definicion, detalle]));
    component.ngOnInit();
    component.f.desde = '2026-10-01';
    component.f.hasta = '2026-10-31';
    component.f.accion = 'ELIMINAR'; // un filtro de otro reporte no debe arrastrarse

    component.verDetalle({
      usuario: 'Rosa Chero',
      correo: 'rosa.chero@sanjose.gob.pe',
      usuario_id: 'u1',
    });

    expect(component.actual()).toBe(detalle);
    expect(api.reporte).toHaveBeenCalledWith('detalle-actividad', {
      desde: '2026-10-01',
      hasta: '2026-10-31',
      accion: 'TODAS', // el valor por defecto: no arrastra el 'ELIMINAR' del reporte anterior
      usuarioId: 'u1',
    });
    expect(component.usuarios()).toHaveLength(1); // la lista para el desplegable se cargo
    expect(component.resumenFiltros()).toContain('Usuario: Rosa Chero');
  });

  it('describe los filtros aplicados para el encabezado impreso', () => {
    component.ngOnInit();
    component.actual.set(definicion);
    component.f.desde = '2026-10-01';
    component.f.areaId = 'a1';
    expect(component.resumenFiltros()).toBe('Desde 01/10/2026 · Por mes · Área: Alcaldía');
  });

  it('exporta CSV con BOM, números sin formato, total y protección contra fórmulas', async () => {
    let blob: Blob | undefined;
    let nombre = '';
    URL.createObjectURL = vi.fn((b: Blob) => ((blob = b), 'blob:reporte'));
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      nombre = this.download;
    });
    component.resultado.set(resultado);
    component.actual.set(definicion);
    component.exportar();
    expect(nombre).toMatch(/^reporte-expedientes-periodo-\d{8}\.csv$/);
    const texto = await blob!.text();
    expect([...new Uint8Array(await blob!.arrayBuffer()).slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(texto.startsWith('"Periodo","Expedientes","Nota"')).toBe(true);
    expect(texto).toContain('"09/2026","1200","\'=SUMA(A1)"');
    expect(texto).toContain('"10/2026","5",""');
    expect(texto.endsWith('"TOTAL","1205",""')).toBe(true);
  });
});
