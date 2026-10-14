import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpEventType } from '@angular/common/http';
import { vi } from 'vitest';
import { ExpedienteFormComponent } from './expediente-form.component';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';

describe('Initial ordered document upload', () => {
  const api = { receive: vi.fn(), upload: vi.fn(), contenedores: vi.fn() };
  const dialog = { ask: vi.fn(), info: vi.fn(), error: vi.fn() };
  let component: ExpedienteFormComponent;
  beforeEach(() => {
    vi.clearAllMocks();
    api.receive.mockReturnValue(of({ id: 'record-id' }));
    api.upload.mockReturnValue(of({ type: HttpEventType.Response }));
    dialog.ask.mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: ArchiveApi, useValue: api },
        { provide: AuthService, useValue: { usuario: () => ({ usuarioId: 'technician' }) } },
        { provide: DialogService, useValue: dialog },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({}) },
          },
        },
      ],
    });
    component = TestBed.runInInjectionContext(() => new ExpedienteFormComponent());
  });

  it('allows moving selected files and submits that exact order', async () => {
    const z = new File(['z'], 'z.png', { type: 'image/png' });
    const a = new File(['a'], 'a.png', { type: 'image/png' });
    component.files.set([z, a]);
    component.moveFile(1, -1);
    await component.submit();
    const body = api.upload.mock.calls[0][0] as FormData;
    expect(body.getAll('archivos').map((file) => (file as File).name)).toEqual(['a.png', 'z.png']);
  });

  it('rejects more than 20 MB of images before creating an expediente', () => {
    const files = [
      new File([new Uint8Array(11 * 1024 * 1024)], 'a.png', { type: 'image/png' }),
      new File([new Uint8Array(11 * 1024 * 1024)], 'b.png', { type: 'image/png' }),
    ];
    const input = { files, value: 'chosen' };
    component.selectFiles({ target: input } as unknown as Event);
    expect(component.files()).toEqual([]);
    expect(dialog.info).toHaveBeenCalled();
  });

  it('keeps separate PDFs outside the combined-image byte limit', () => {
    const pdf = (name: string) => {
      const file = new File(['pdf'], name, { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 });
      return file;
    };
    const files = [pdf('z.pdf'), pdf('a.pdf')];
    component.selectFiles({ target: { files, value: 'chosen' } } as unknown as Event);
    expect(component.files()).toEqual(files);
  });

  it('does not reorder outside boundaries or while uploading', () => {
    const file = new File(['x'], 'x.png', { type: 'image/png' });
    component.files.set([file]);
    component.moveFile(0, -1);
    component.moveFile(0, 1);
    component.busy.set(true);
    component.removeFile(file);
    expect(component.files()).toEqual([file]);
  });

  it('rejects more than 100 files without changing the current selection', () => {
    const files = Array.from(
      { length: 101 },
      (_, index) => new File(['x'], `${index}.png`, { type: 'image/png' }),
    );
    component.selectFiles({ target: { files, value: 'chosen' } } as unknown as Event);
    expect(component.files()).toEqual([]);
    expect(dialog.info).toHaveBeenCalledWith('Demasiados archivos', expect.stringContaining('100'));
  });

  it('retains the saved-expediente recovery path if attachment upload fails', async () => {
    component.files.set([new File(['x'], 'x.png', { type: 'image/png' })]);
    api.upload.mockReturnValue(throwError(() => new Error('conversion unavailable')));
    await component.submit();
    expect(dialog.info).toHaveBeenCalledWith(
      'Expediente creado sin documentos',
      expect.stringContaining('nuevamente'),
    );
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/expedientes', 'record-id']);
    expect(component.busy()).toBe(false);
  });
});
