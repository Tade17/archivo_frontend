import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
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
    api.upload.mockReturnValue(of({ type: HttpEventType.Response }));
    dialog.ask.mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
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
    component.files.set([
      { file: z, reviewed: true },
      { file: a, reviewed: true },
    ]);
    component.move(1, -1);
    await component.upload();
    const body = api.upload.mock.calls[0][0] as FormData;
    expect(body.get('expedienteId')).toBe('record-id');
    expect(body.getAll('archivos').map((file) => (file as File).name)).toEqual(['a.png', 'z.png']);
  });

  it('ignores out-of-range moves instead of corrupting the queue', () => {
    const row = { file: new File(['x'], 'x.png', { type: 'image/png' }), reviewed: true };
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

  it('moves downward and preserves legibility confirmation', () => {
    const z = { file: new File(['z'], 'z.png', { type: 'image/png' }), reviewed: true };
    const a = { file: new File(['a'], 'a.png', { type: 'image/png' }), reviewed: false };
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
    const row = { file: new File(['x'], 'x.png', { type: 'image/png' }), reviewed: true };
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
});
