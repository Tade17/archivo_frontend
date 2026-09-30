import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: ` <header
      class="bg-[var(--deep)] px-6 lg:px-16 min-h-[88px] flex flex-wrap items-center justify-between gap-4 py-3"
    >
      <a routerLink="/buscar" class="flex items-center gap-4 text-white"
        ><img src="/design/kSOoW.png" alt="Escudo de San José" width="46" height="53" /><span
          class="text-[11px] leading-5 tracking-[.04em] text-[#B9CDE6]"
          >MUNICIPALIDAD DISTRITAL<br /><strong class="text-[16px] text-white"
            >DE SAN JOSÉ</strong
          ></span
        ><span class="h-9 border-l border-white/25 mx-3 hidden xl:block"></span
        ><span class="hidden xl:block text-sm text-[#B9CDE6]">Archivo Municipal</span></a
      >
      <nav aria-label="Navegación principal" class="flex flex-wrap gap-8 text-[13px]">
        @for (n of nav; track n.path) {
          @if (!n.roles || auth.can(...n.roles)) {
            <a
              [routerLink]="n.path"
              routerLinkActive="!text-white border-b-2 border-[var(--yellow)]"
              class="text-[#B9CDE6] py-4 font-medium border-b-2 border-transparent"
              >{{ n.label }}</a
            >
          }
        }
      </nav>
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
    <main><router-outlet /></main>`,
})
export class AppShellComponent {
  auth = inject(AuthService);
  dialog = inject(DialogService);
  router = inject(Router);
  nav = [
    { label: 'Explorar', path: '/buscar', roles: null },
    { label: 'Cargar varios documentos', path: '/digitalizar', roles: ['GESTOR_DOCUMENTAL'] },
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
