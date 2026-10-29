import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { PrestamoListComponent } from './prestamo-list.component';
import { Page, Prestamo } from '../../../../core/models/archive.model';
import { AlertasService } from '../../../../core/services/alertas.service';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';

function prestamo(overrides: Partial<Prestamo> = {}): Prestamo {
  return {
    id: 'p1',
    objeto: 'DOCUMENTO',
    expedienteId: 'e1',
    expedienteCodigo: 'EXP-2026-000027',
    expedienteAsunto: 'Requerimiento de información',
    contenedorId: null,
    contenedorDescripcion: null,
    solicitante: 'Contraloría General de la República',
    observaciones: null,
    fechaSolicitud: '2026-10-17',
    fechaDevolucionPrevista: '2026-10-25',
    fechaDevolucionReal: null,
    estado: 'PRESTADO',
    registradoPor: 'Rosa Chero',
    diasRestantes: -3,
    semaforo: 'ROJO',
    ...overrides,
  };
}

const pagina = (contenido: Prestamo[], n: number, total: number): Page<Prestamo> =>
  ({ contenido, pagina: n, tamano: 100, totalElementos: 2, totalPaginas: total }) as Page<Prestamo>;

describe('Préstamos: reporte en Excel y PDF', () => {
  const api = { prestamos: vi.fn() };
  const dialog = { error: vi.fn() };
  let component: PrestamoListComponent;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: ArchiveApi, useValue: api },
        { provide: DialogService, useValue: dialog },
        { provide: AlertasService, useValue: { refrescar: vi.fn(), resumen: () => null } },
        { provide: AuthService, useValue: { usuario: () => ({ nombre: 'Rosa' }) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new PrestamoListComponent());
  });

  it('exporta a Excel todos los préstamos del filtro, no solo la página visible', async () => {
    api.prestamos.mockReturnValueOnce(of(pagina([prestamo()], 0, 2))).mockReturnValueOnce(
      of(
        pagina(
          [
            prestamo({
              id: 'p2',
              objeto: 'CONTENEDOR',
              expedienteCodigo: null,
              expedienteAsunto: null,
              contenedorDescripcion: 'Archivador azul',
              solicitante: 'Fiscalía',
              observaciones: '=1+1',
              estado: 'DEVUELTO',
              fechaDevolucionReal: '2026-10-20',
              diasRestantes: null,
              semaforo: 'GRIS',
            }),
          ],
          1,
          2,
        ),
      ),
    );
    let blob: Blob | undefined;
    let nombre = '';
    URL.createObjectURL = vi.fn((b: Blob) => ((blob = b), 'blob:prestamos'));
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      nombre = this.download;
    });
    component.estado.set('TODOS');
    component.texto = 'contraloría';

    await component.exportarExcel();

    expect(api.prestamos).toHaveBeenCalledTimes(2);
    expect(api.prestamos).toHaveBeenNthCalledWith(
      1,
      { estado: 'TODOS', texto: 'contraloría' },
      0,
      100,
    );
    expect(api.prestamos).toHaveBeenNthCalledWith(
      2,
      { estado: 'TODOS', texto: 'contraloría' },
      1,
      100,
    );
    expect(nombre).toMatch(/^prestamos-todos-\d{8}\.csv$/);
    expect([...new Uint8Array(await blob!.arrayBuffer()).slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const lineas = (await blob!.text()).split('\r\n');
    expect(lineas).toHaveLength(3);
    expect(lineas[0]).toBe(
      '"Estado","Qué se prestó","Tipo","A quién","Salió","Debe volver","Devuelto el","Registró","Observaciones"',
    );
    expect(lineas[1]).toContain(
      '"Vencido hace 3 día(s)","EXP-2026-000027 · Requerimiento de información","Documento"',
    );
    expect(lineas[1]).toContain('"17/10/2026","25/10/2026",""');
    expect(lineas[2]).toContain(
      '"Archivador azul (archivador / folder completo)","Archivador o folder completo","Fiscalía"',
    );
    expect(lineas[2]).toContain('"20/10/2026","Rosa Chero","\'=1+1"'); // protegido contra fórmulas
    expect(component.exportando()).toBe(false);
  });

  it('para el PDF carga todos los préstamos y abre la impresión; luego limpia la vista', async () => {
    vi.useFakeTimers();
    api.prestamos.mockReturnValue(of(pagina([prestamo(), prestamo({ id: 'p2' })], 0, 1)));
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    await component.imprimirPdf();
    expect(component.filasImpresion()).toHaveLength(2);
    expect(imprimir).not.toHaveBeenCalled(); // espera a dibujar la tabla de impresión
    vi.advanceTimersByTime(150);
    expect(imprimir).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('afterprint'));
    expect(component.filasImpresion()).toBeNull();
    vi.useRealTimers();
  });

  it('describe el filtro aplicado para el encabezado impreso', () => {
    component.estado.set('VENCIDOS');
    component.texto = 'fiscalía';
    expect(component.resumenFiltro()).toBe('Mostrar: Vencidos · Búsqueda: «fiscalía»');
    expect(
      component.fechaCierre(prestamo({ estado: 'DEVUELTO', fechaDevolucionReal: '2026-10-20' })),
    ).toBe('Devuelto el 20/10/2026');
  });
});
