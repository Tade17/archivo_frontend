import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpEventType } from '@angular/common/http';
import { vi } from 'vitest';
import { CargaDocumentosComponent } from './carga-documentos.component';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';

describe('Later ordered document upload', () => {
  const api = { record: vi.fn(), upload: vi.fn() };
  const dialog = { ask: vi.fn(), info: vi.fn(), error: vi.fn() };
  let component: CargaDocumentosComponent;
  beforeEach(() => {
    vi.clearAllMocks();
    api.record.mockReturnValue(of({ id: 'record-id', codigoUnico: 'EXP-1' }));
    api.upload.mockReturnValue(of({ type: HttpEventType.Response, body: [] }));
    dialog.ask.mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ArchiveApi, useValue: api },
        { provide: AuthService, useValue: { usuario: () => ({ usuarioId: 'technician' }) } },
        { provide: DialogService, useValue: dialog },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ expedienteId: 'record-id' }) },
          },
        },
      ],
    });
    component = TestBed.runInInjectionContext(() => new CargaDocumentosComponent());
  });

  it('preserves the existing-expediente binding and sends chosen order', async () => {
    component.ngOnInit();
    const z = new File(['z'], 'z.png', { type: 'image/png' });
    const a = new File(['a'], 'a.png', { type: 'image/png' });
    component.files.set([{ file: z }, { file: a }]);
    component.move(1, -1);
    await component.upload();
    const body = api.upload.mock.calls[0][0] as FormData;
    expect(body.get('expedienteId')).toBe('record-id');
    expect(body.getAll('archivos').map((file) => (file as File).name)).toEqual(['a.png', 'z.png']);
  });

  it('ignores out-of-range moves instead of corrupting the queue', () => {
    const row = { file: new File(['x'], 'x.png', { type: 'image/png' }) };
    component.files.set([row]);
    component.move(0, -1);
    expect(component.files()).toEqual([row]);
  });

  it('rejects more than 20 MB of images before uploading', () => {
    const files = [
      new File([new Uint8Array(11 * 1024 * 1024)], 'a.png', { type: 'image/png' }),
      new File([new Uint8Array(11 * 1024 * 1024)], 'b.png', { type: 'image/png' }),
    ];
    component.select({ target: { files, value: 'chosen' } } as unknown as Event);
    expect(component.files()).toEqual([]);
    expect(dialog.info).toHaveBeenCalled();
  });

  it('moves downward and preserves file identity', () => {
    const z = { file: new File(['z'], 'z.png', { type: 'image/png' }) };
    const a = { file: new File(['a'], 'a.png', { type: 'image/png' }) };
    component.files.set([z, a]);
    component.move(0, 1);
    expect(component.files()).toEqual([a, z]);
    component.busy.set(true);
    component.move(0, 1);
    component.remove(0);
    expect(component.files()).toEqual([a, z]);
  });

  it('preserves the selected queue for retry if conversion/upload fails', async () => {
    component.ngOnInit();
    const row = { file: new File(['x'], 'x.png', { type: 'image/png' }) };
    component.files.set([row]);
    const failure = new Error('conversion unavailable');
    api.upload.mockReturnValue(throwError(() => failure));
    await component.upload();
    expect(component.files()).toEqual([row]);
    expect(component.busy()).toBe(false);
    expect(dialog.error).toHaveBeenCalledWith(failure);
  });

  it('keeps separate PDFs outside the combined-image byte limit', () => {
    const files = ['z.pdf', 'a.pdf'].map((name) => {
      const file = new File(['pdf'], name, { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 });
      return file;
    });
    component.select({ target: { files, value: 'chosen' } } as unknown as Event);
    expect(component.files().map((row) => row.file)).toEqual(files);
  });

  it('rejects more than 100 files without altering the queue', () => {
    const files = Array.from(
      { length: 101 },
      (_, index) => new File(['x'], `${index}.png`, { type: 'image/png' }),
    );
    component.select({ target: { files, value: 'chosen' } } as unknown as Event);
    expect(component.files()).toEqual([]);
    expect(dialog.info).toHaveBeenCalledWith('Demasiados archivos', expect.stringContaining('100'));
  });
  const makeFile = (name: string, type = 'application/pdf', size = 4) => {
    const file = new File(['data'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };
  const choose = (files: File[]) =>
    component.select({ target: { files, value: 'selected' } } as unknown as Event);

  it('summarizes empty, PDF-only, image-only and mixed results as documents, not pages', () => {
    expect(component.summary()).toEqual({ images: 0, pdfs: 0, documents: 0, bytes: 0 });
    choose([makeFile('one.pdf'), makeFile('two.pdf')]);
    expect(component.summary()).toEqual({ images: 0, pdfs: 2, documents: 2, bytes: 8 });
    component.files.set([]);
    choose([makeFile('multipage.tiff', 'image/tiff')]);
    expect(component.summary()).toEqual({ images: 1, pdfs: 0, documents: 1, bytes: 4 });
    component.files.set([]);
    choose([
      ...Array.from({ length: 8 }, (_, i) => makeFile(`${i}.jpg`, 'image/jpeg')),
      makeFile('a.pdf'),
      makeFile('b.pdf'),
    ]);
    expect(component.summary()).toEqual({ images: 8, pdfs: 2, documents: 3, bytes: 40 });
  });

  it('requires a destination and files, but not capture metadata or manual checks', () => {
    expect(component.ready()).toBe(false);
    choose([makeFile('one.pdf')]);
    expect(component.ready()).toBe(false);
    component.ngOnInit();
    expect(component.ready()).toBe(true);
  });

  it('omits optional scanner and declared DPI rather than inventing measured metadata', async () => {
    component.ngOnInit();
    choose([makeFile('one.pdf')]);
    await component.upload();
    const body = api.upload.mock.calls[0][0] as FormData;
    expect(body.has('escanerUtilizado')).toBe(false);
    expect(body.has('resolucionDpi')).toBe(false);
    expect(dialog.ask).not.toHaveBeenCalled();
  });

  it('retains actual saved documents and their IDs without claiming OCR is finished', async () => {
    component.ngOnInit();
    choose([makeFile('one.pdf')]);
    const documents = [{ id: 'actual-id', nombreArchivo: 'one.pdf', ocrEstado: 'PENDIENTE' }];
    api.upload.mockReturnValue(of({ type: HttpEventType.Response, body: documents }));
    await component.upload();
    expect(component.savedDocuments()).toEqual(documents);
    expect(component.files()).toEqual([]);
    expect(component.busy()).toBe(false);
    expect(dialog.info).not.toHaveBeenCalled();
    component.changeRecord();
    expect(component.savedDocuments()).toEqual([]);
    expect(component.record()).toBeNull();
  });

  it('guards double submissions and all destination/queue mutations while saving', async () => {
    component.ngOnInit();
    choose([makeFile('one.pdf')]);
    const pending = new Subject();
    api.upload.mockReturnValue(pending);
    await component.upload();
    await component.upload();
    component.changeRecord();
    choose([makeFile('other.pdf')]);
    component.remove(0);
    expect(api.upload).toHaveBeenCalledTimes(1);
    expect(component.record()?.id).toBe('record-id');
    expect(component.files()).toHaveLength(1);
    pending.error(new Error('failure'));
    expect(component.busy()).toBe(false);
    expect(component.files()).toHaveLength(1);
  });

  it('rejects invalid, empty and oversized files while keeping valid selections', () => {
    choose([
      makeFile('valid.pdf'),
      makeFile('bad.txt', 'text/plain'),
      makeFile('empty.pdf', 'application/pdf', 0),
      makeFile('large.pdf', 'application/pdf', 20 * 1024 * 1024 + 1),
    ]);
    expect(component.files().map((row) => row.file.name)).toEqual(['valid.pdf']);
    expect(dialog.info).toHaveBeenCalledWith(
      'Archivos no admitidos',
      expect.stringContaining('bad.txt'),
    );
  });

  it('accepts exact file and image limits and rejects the batch byte limit', () => {
    choose([makeFile('limit.png', 'image/png', 20 * 1024 * 1024)]);
    expect(component.files()).toHaveLength(1);
    component.files.set([]);
    choose(
      Array.from({ length: 8 }, (_, i) =>
        makeFile(`${i}.pdf`, 'application/pdf', 20 * 1024 * 1024),
      ),
    );
    expect(component.files()).toEqual([]);
    expect(dialog.info).toHaveBeenCalledWith(
      'Lote demasiado grande',
      expect.stringContaining('150'),
    );
  });

  it('deduplicates repeated selections and keeps other PDF documents separate', () => {
    const pdf = makeFile('same.pdf');
    choose([pdf, pdf, makeFile('other.pdf')]);
    expect(component.summary().documents).toBe(2);
  });
  it('renders saved-document links on the existing detail route without manual scanning controls', () => {
    const fixture = TestBed.createComponent(CargaDocumentosComponent);
    fixture.detectChanges();
    const instance = fixture.componentInstance;
    instance.files.set([{ file: makeFile('file.pdf') }]);
    api.upload.mockReturnValue(
      of({
        type: HttpEventType.Response,
        body: [{ id: 'actual-document-id', nombreArchivo: 'file.pdf', ocrEstado: 'PENDIENTE' }],
      }),
    );
    instance.upload();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(
      element.querySelector('a[href="/documentos/actual-document-id"]')?.textContent,
    ).toContain('Ver procesamiento');
    expect(element.querySelector('input[type="checkbox"]')).toBeNull();
    expect(element.querySelector('input[type="number"]')).toBeNull();
    expect(element.textContent).not.toContain('Perfil de digitalización');
    expect(element.textContent).not.toContain('Revisión manual');
    expect(element.textContent).toContain('Guardado no significa');
  });

  it('keeps the previous queue when a subsequent selection exceeds the limits', () => {
    const existing = makeFile('existing.pdf');
    choose([existing]);
    choose(Array.from({ length: 100 }, (_, i) => makeFile(`${i}.pdf`)));
    expect(component.files().map((row) => row.file)).toEqual([existing]);
  });

  it('does not fabricate saved documents from an empty server response', () => {
    component.ngOnInit();
    choose([makeFile('file.pdf')]);
    component.upload();
    expect(component.savedDocuments()).toEqual([]);
    expect(component.files()).toHaveLength(1);
    expect(component.saveError()).toContain('consulta el expediente');
    expect(component.busy()).toBe(false);
  });
});
