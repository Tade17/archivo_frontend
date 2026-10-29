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

describe('Menú por rol', () => {
  function shellPara(rol: string) {
    const auth = {
      hasRole: (r: string) => rol === r,
      can: (...permitidos: string[]) => rol === 'ADMIN' || permitidos.includes(rol),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: DialogService, useValue: {} },
        { provide: AlertasService, useValue: { refrescar: vi.fn() } },
        { provide: Router, useValue: { events: EMPTY } },
      ],
    });
    return TestBed.runInInjectionContext(() => new AppShellComponent());
  }

  it('el administrador usa el menú ☰ con las 7 opciones', () => {
    const shell = shellPara('ADMIN');
    expect(shell.usaHamburguesa()).toBe(true);
    expect(shell.visibles().map((n) => n.label)).toEqual([
      'Explorar',
      'Archivadores y folders',
      'Préstamos',
      'Reportes',
      'Ubicaciones',
      'Actividad',
      'Usuarios',
    ]);
  });

  it('el gestor y el lector conservan la barra normal', () => {
    const gestor = shellPara('GESTOR_DOCUMENTAL');
    expect(gestor.usaHamburguesa()).toBe(false);
    expect(gestor.visibles().map((n) => n.label)).toEqual([
      'Explorar',
      'Archivadores y folders',
      'Préstamos',
      'Reportes',
    ]);
    TestBed.resetTestingModule();
    const lector = shellPara('LECTOR');
    expect(lector.usaHamburguesa()).toBe(false);
    expect(lector.visibles().map((n) => n.label)).toEqual(['Explorar']);
  });

  it('el menú se cierra con Escape', () => {
    const shell = shellPara('ADMIN');
    shell.menuAbierto.set(true);
    shell.cerrarMenu();
    expect(shell.menuAbierto()).toBe(false);
  });
});
