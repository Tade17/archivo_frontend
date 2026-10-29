import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ReportesComponent } from './reportes.component';
import { ColumnaReporte, ReporteDefinicion, ReporteResultado } from '../../../../core/models/archive.model';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';

const columna = (tipo: ColumnaReporte['tipo']): ColumnaReporte => ({ clave: 'x', etiqueta: 'X', tipo });

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
  const api = { reportes: vi.fn(), catalogs: vi.fn(), reporte: vi.fn() };
  const dialog = { error: vi.fn() };
  let component: ReportesComponent;

  beforeEach(() => {
    vi.clearAllMocks();
    api.reportes.mockReturnValue(of([definicion]));
    api.catalogs.mockReturnValue(of({ areas: [{ id: 'a1', nombre: 'Alcaldía' }], tipos: [], roles: [] }));
    api.reporte.mockReturnValue(of(resultado));
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
    expect(api.reporte).toHaveBeenCalledWith('expedientes-periodo', { agrupar: 'MES', areaId: 'a1' });
    expect(component.resultado()).toBe(resultado);
  });

  it('elegir un reporte reinicia los filtros y lo genera', () => {
    component.f.areaId = 'a1';
    component.elegir(definicion);
    expect(component.f.areaId).toBe('');
    expect(api.reporte).toHaveBeenCalledWith('expedientes-periodo', { agrupar: 'MES' });
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
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
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
