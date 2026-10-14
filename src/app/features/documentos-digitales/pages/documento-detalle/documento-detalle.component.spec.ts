import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DocumentoDetalleComponent } from './documento-detalle.component';
import { DigitalFile } from '../../../../core/models/archive.model';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';

function document(overrides: Record<string, unknown> = {}): DigitalFile {
  return {
    id: 'doc',
    expedienteId: 'record',
    nombreArchivo: 'scan.pdf',
    pdfDisponible: false,
    ocrEstado: 'PROCESANDO',
    ocrConfianza: null,
    ocrError: null,
    ...overrides,
  } as DigitalFile;
}

describe('Actual OCR document progress', () => {
  const api = { document: vi.fn(), retryOcr: vi.fn() };
  const dialog = { error: vi.fn() };
  let component: DocumentoDetalleComponent;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    api.document.mockReturnValue(of(document()));
    TestBed.configureTestingModule({
      providers: [
        { provide: ArchiveApi, useValue: api },
        { provide: AuthService, useValue: { can: () => true } },
        { provide: DialogService, useValue: dialog },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'doc' }) } },
        },
      ],
    });
    TestBed.overrideComponent(DocumentoDetalleComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    });
    component = TestBed.runInInjectionContext(() => new DocumentoDetalleComponent());
  });
  afterEach(() => {
    component.ngOnDestroy();
    vi.useRealTimers();
  });

  it('shows actual confirmed counts without inventing a percentage', () => {
    const d = document({ ocrPaginasProcesadas: 4, ocrPaginasTotales: 10, ocrFase: 'RECOGNIZING' });
    expect(component.statusMessage(d)).toContain('4 de 10 páginas');
    expect(component.statusMessage(d)).not.toContain('%');
  });

  it.each([
    ['QUEUED', 'En cola'],
    ['RECOGNIZING', 'Reconociendo texto'],
    ['EXPORTING', 'Generando PDF'],
    ['RETRY_WAIT', 'Reintento programado'],
  ])('labels actual phase %s', (phase, label) => {
    expect(component.statusLabel(document({ ocrFase: phase }))).toBe(label);
  });

  it('does not label a saved/uploaded original as completed OCR', () => {
    expect(component.statusLabel(document({ ocrEstado: 'PENDIENTE', ocrFase: 'QUEUED' }))).toBe(
      'En cola',
    );
    expect(component.statusMessage(document({ ocrEstado: 'PENDIENTE' }))).not.toContain(
      'ya está disponible',
    );
  });

  it('keeps old and nullable metadata safe without fake totals', () => {
    for (const fields of [{}, { ocrPaginasProcesadas: null, ocrPaginasTotales: null }]) {
      const d = document(fields);
      expect(component.statusLabel(d)).toBe('Reconociendo texto');
      expect(component.statusMessage(d)).not.toMatch(/undefined|null|NaN|%/);
    }
  });

  it('guards pending/processing retries even when called directly', () => {
    component.doc.set(document({ ocrEstado: 'PENDIENTE' }));
    component.retryOcr();
    component.doc.set(document({ ocrEstado: 'PROCESANDO' }));
    component.retryOcr();
    expect(api.retryOcr).not.toHaveBeenCalled();
  });

  it('clears scheduled polling on destroy and ignores a late response', () => {
    const response = new Subject<DigitalFile>();
    api.document.mockReturnValue(response);
    component.ngOnInit();
    component.ngOnDestroy();
    response.next(document());
    vi.advanceTimersByTime(10000);
    expect(api.document).toHaveBeenCalledTimes(1);
  });

  it('keeps export distinct even when all pages are recognized', () => {
    const d = document({ ocrFase: 'EXPORTING', ocrPaginasProcesadas: 10, ocrPaginasTotales: 10 });
    expect(component.statusMessage(d)).toContain('10 de 10 páginas');
    expect(component.statusLabel(d)).toBe('Generando PDF');
    expect(component.statusMessage(d)).not.toContain('ya está disponible');
  });

  it('shows terminal completion and error without masking recovery', () => {
    const done = document({
      ocrEstado: 'COMPLETADO',
      ocrFase: 'COMPLETED',
      pdfDisponible: true,
      ocrPaginasProcesadas: 1,
      ocrPaginasTotales: 1,
    });
    expect(component.statusLabel(done)).toBe('Disponible');
    expect(component.statusMessage(done)).toContain('1 de 1 página reconocida');
    const failed = document({
      ocrEstado: 'ERROR',
      ocrFase: 'ERROR',
      ocrError: 'No se pudo completar el OCR.',
      ocrPaginasProcesadas: 4,
      ocrPaginasTotales: 10,
    });
    expect(component.statusLabel(failed)).toBe('Error de procesamiento');
    expect(component.statusMessage(failed)).toContain('No se pudo completar el OCR.');
    expect(component.statusMessage(failed)).toContain('4 de 10 páginas');
  });

  it('does not invent a total from old OCR page counts', () => {
    const d = document({ ocrPaginasProcesadas: 4, ocrPaginasTotales: null, ocrPaginas: 20 });
    expect(component.statusMessage(d)).toContain('4 páginas reconocidas; total aún no disponible');
    expect(component.statusMessage(d)).not.toContain('de 20');
  });

  it.each([
    { ocrPaginasProcesadas: -1, ocrPaginasTotales: 10 },
    { ocrPaginasProcesadas: 11, ocrPaginasTotales: 10 },
    { ocrPaginasProcesadas: 1.5, ocrPaginasTotales: 10 },
    { ocrPaginasProcesadas: 2, ocrPaginasTotales: 0 },
  ])('ignores malformed progress %j', (fields) => {
    expect(component.statusMessage(document(fields))).not.toContain('páginas reconocidas');
  });

  it('keeps retry waiting automatic without assuming timestamp zone or countdown', () => {
    const d = document({ ocrFase: 'RETRY_WAIT', ocrProximoReintento: '2026-10-14T15:00:00' });
    expect(component.statusMessage(d)).toContain('el mismo trabajo automáticamente');
    expect(component.statusMessage(d)).not.toContain('2026');
  });

  it('polls at 2.5 seconds and stops after completion', () => {
    api.document
      .mockReturnValueOnce(of(document()))
      .mockReturnValue(of(document({ ocrEstado: 'COMPLETADO', pdfDisponible: true })));
    component.ngOnInit();
    vi.advanceTimersByTime(2499);
    expect(api.document).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(api.document).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(10000);
    expect(api.document).toHaveBeenCalledTimes(2);
  });

  it('clears an already scheduled poll when destroyed', () => {
    component.ngOnInit();
    component.ngOnDestroy();
    vi.advanceTimersByTime(10000);
    expect(api.document).toHaveBeenCalledTimes(1);
  });

  it('clears busy after retry failure and prevents duplicate requests', () => {
    component.doc.set(document({ ocrEstado: 'ERROR' }));
    const response = new Subject<void>();
    api.retryOcr.mockReturnValue(response);
    component.retryOcr();
    component.retryOcr();
    expect(api.retryOcr).toHaveBeenCalledTimes(1);
    expect(component.busy()).toBe(true);
    response.error(new Error('retry failed'));
    expect(component.busy()).toBe(false);
    expect(dialog.error).toHaveBeenCalled();
  });

  it('unsubscribes a pending retry on destroy without polling later', () => {
    component.doc.set(document({ ocrEstado: 'ERROR' }));
    const response = new Subject<void>();
    api.retryOcr.mockReturnValue(response);
    component.retryOcr();
    component.ngOnDestroy();
    response.next();
    vi.advanceTimersByTime(10000);
    expect(api.document).not.toHaveBeenCalled();
  });

  it('renders actual counts in a polite atomic status region', () => {
    api.document.mockReturnValue(
      of(document({ ocrFase: 'RECOGNIZING', ocrPaginasProcesadas: 4, ocrPaginasTotales: 10 })),
    );
    const fixture = TestBed.createComponent(DocumentoDetalleComponent);
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('[role="status"]');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.getAttribute('aria-atomic')).toBe('true');
    expect(status.textContent).toContain('4 de 10 páginas');
    fixture.destroy();
  });
});
