import { TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';
import { vi } from 'vitest';
import { AppShellComponent } from './app-shell.component';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { AlertasService } from '../../../core/services/alertas.service';
import { Router } from '@angular/router';
import { routes } from '../../../app.routes';

describe('Document upload navigation', () => {
  it('removes the global batch entry without removing the upload route', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: DialogService, useValue: {} },
        { provide: AlertasService, useValue: { refrescar: vi.fn() } },
        { provide: Router, useValue: { events: EMPTY } },
      ],
    });
    const shell = TestBed.runInInjectionContext(() => new AppShellComponent());
    expect(shell.nav.some((item) => item.path === '/digitalizar')).toBe(false);
    expect(
      routes.flatMap((route) => route.children ?? []).some((route) => route.path === 'digitalizar'),
    ).toBe(true);
  });
});
