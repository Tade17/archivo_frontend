import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AlertasService } from '../../../core/services/alertas.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: ` <header
      class="relative bg-[var(--deep)] px-6 lg:px-16 min-h-[88px] flex flex-wrap items-center justify-between gap-4 py-3"
    >
      <div class="flex items-center gap-4">
        @if (usaHamburguesa()) {
          <button
            type="button"
            aria-label="Menú principal"
            aria-controls="menu-principal"
            [attr.aria-expanded]="menuAbierto()"
            title="Menú"
            class="relative shrink-0 icon-button !inline-flex !items-center !justify-center !w-11 !h-11 !rounded-md !bg-white/10 !border-white/25 !text-white hover:!bg-white/20 mr-2"
            (click)="menuAbierto.set(!menuAbierto())"
          >
            <span class="flex flex-col items-center gap-[5px]" aria-hidden="true">
              <span class="block w-[20px] h-[2px] bg-white rounded-full"></span>
              <span class="block w-[20px] h-[2px] bg-white rounded-full"></span>
              <span class="block w-[20px] h-[2px] bg-white rounded-full"></span>
            </span>
            @if (!menuAbierto() && (alertas.resumen()?.vencidos ?? 0) > 0) {
              <span
                class="absolute -top-[5px] -right-[5px] w-[13px] h-[13px] rounded-full bg-[#D93025] border-2 border-[var(--deep)]"
              ></span>
            }
          </button>
        }
        <a routerLink="/buscar" class="flex items-center gap-4 text-white"
          ><img src="/design/kSOoW.png" alt="Escudo de San José" width="46" height="53" /><span
            class="text-[11px] leading-5 tracking-[.04em] text-[#B9CDE6]"
            >MUNICIPALIDAD DISTRITAL<br /><strong class="text-[16px] text-white"
              >DE SAN JOSÉ</strong
            ></span
          ><span class="h-9 border-l border-white/25 mx-3 hidden xl:block"></span
          ><span class="hidden xl:block text-sm text-[#B9CDE6]">Archivo Municipal</span></a
        >
      </div>
      @if (usaHamburguesa()) {
        @if (menuAbierto()) {
          <div class="fixed inset-0 z-40" aria-hidden="true" (click)="menuAbierto.set(false)"></div>
          <nav
            id="menu-principal"
            aria-label="Navegación principal"
            class="absolute left-6 lg:left-16 top-full z-50 w-[300px] bg-white border border-[var(--line)] rounded-b-md shadow-xl py-2 text-sm"
          >
            @for (n of visibles(); track n.path) {
              <a
                [routerLink]="n.path"
                routerLinkActive="!bg-[#EAF0F8] !text-[var(--deep)] font-semibold"
                class="flex items-center justify-between px-5 py-3 text-[#1F2933] hover:bg-[#F3F6F9]"
                (click)="menuAbierto.set(false)"
                >{{ n.label }}
                @if (n.path === '/prestamos' && (alertas.resumen()?.vencidos ?? 0) > 0) {
                  <span
                    class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#D93025] text-white text-[10px] font-bold"
                    >{{ alertas.resumen()!.vencidos }}</span
                  >
                }
              </a>
            }
          </nav>
        }
      } @else {
        <nav aria-label="Navegación principal" class="flex flex-wrap gap-8 text-[13px]">
          @for (n of nav; track n.path) {
            @if (!n.roles || auth.can(...n.roles)) {
              <a
                [routerLink]="n.path"
                routerLinkActive="!text-white border-b-2 border-[var(--yellow)]"
                class="text-[#B9CDE6] py-4 font-medium border-b-2 border-transparent"
                >{{ n.label }}
                @if (n.path === '/prestamos' && (alertas.resumen()?.vencidos ?? 0) > 0) {
                  <span
                    class="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#D93025] text-white text-[10px] font-bold"
                    >{{ alertas.resumen()!.vencidos }}</span
                  >
                }
              </a>
            }
          }
        </nav>
      }
      <div class="flex items-center gap-3">
        <span
          class="rounded-full bg-white/15 text-white w-10 h-10 flex items-center justify-center text-[12px] font-bold"
          >{{ initials() }}</span
        >
        <div class="text-[11px] text-white">
          <strong>{{ auth.usuario()?.nombre }}</strong
          ><br /><span class="text-[#B9CDE6]">{{ roleLabel() }}</span>
        </div>
        <button
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          class="icon-button ml-1 !bg-white/10 !border-white/20 !text-white hover:!bg-white/20"
          (click)="logout()"
        >
          ↪
        </button>
      </div>
    </header>
    @if (alertas.resumen(); as r) {
      @if (r.vencidos > 0) {
        <div
          role="alert"
          class="no-print bg-[#FDECEA] border-b border-[#E8B4B0] text-[#8C1D18] px-6 lg:px-16 py-2.5 text-[13px] flex flex-wrap items-center gap-3"
        >
          <span class="w-2.5 h-2.5 rounded-full bg-[#D93025]"></span>
          <span
            ><strong>{{ r.vencidos }} préstamo(s) vencido(s) sin devolver.</strong></span
          >
          <a routerLink="/prestamos" class="underline font-semibold">Revisar préstamos</a>
        </div>
      }
    }
    <main><router-outlet /></main>`,
})
export class AppShellComponent {
  auth = inject(AuthService);
  dialog = inject(DialogService);
  router = inject(Router);
  alertas = inject(AlertasService);
  constructor() {
    this.alertas.refrescar();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.alertas.refrescar();
      this.menuAbierto.set(false);
    });
  }
  menuAbierto = signal(false);
  // El Administrador tiene demasiadas opciones para una sola barra: se agrupan en un menú ☰.
  usaHamburguesa() {
    return this.auth.hasRole('ADMIN');
  }
  visibles() {
    return this.nav.filter((n) => !n.roles || this.auth.can(...n.roles));
  }
  @HostListener('document:keydown.escape')
  cerrarMenu() {
    this.menuAbierto.set(false);
  }
  nav = [
    { label: 'Explorar', path: '/buscar', roles: null },
    { label: 'Archivadores y folders', path: '/contenedores', roles: ['GESTOR_DOCUMENTAL'] },
    { label: 'Préstamos', path: '/prestamos', roles: ['GESTOR_DOCUMENTAL'] },
    { label: 'Reportes', path: '/reportes', roles: ['GESTOR_DOCUMENTAL'] },
    { label: 'Ubicaciones', path: '/ubicaciones', roles: [] as string[] },
    { label: 'Actividad', path: '/auditoria', roles: [] as string[] },
    { label: 'Usuarios', path: '/usuarios', roles: [] as string[] },
  ];
  initials() {
    return this.auth
      .usuario()
      ?.nombre.split(' ')
      .slice(0, 2)
      .map((s) => s[0])
      .join('');
  }
  roleLabel() {
    const labels: Record<string, string> = {
      ADMIN: 'Administrador del sistema',
      GESTOR_DOCUMENTAL: 'Gestor de documentos',
      LECTOR: 'Solo lectura',
    };
    const role = this.auth.usuario()?.rol ?? '';
    return labels[role] ?? role;
  }
  async logout() {
    if (!(await this.dialog.ask('Cerrar sesión', '¿Seguro que quieres salir del archivo?'))) return;
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
