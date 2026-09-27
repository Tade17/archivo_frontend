import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: ` <header
      class="bg-white border-b border-[var(--line)] px-6 lg:px-16 min-h-[76px] flex flex-wrap items-center justify-between gap-4 py-3"
    >
      <a routerLink="/buscar" class="flex items-center gap-3 text-[var(--deep)]"
        ><img src="/design/kSOoW.png" alt="Escudo de San José" width="38" height="44" /><span
          class="text-[9px] leading-4"
          >MUNICIPALIDAD DISTRITAL<br /><strong class="text-[12px]">DE SAN JOSÉ</strong></span
        ><span class="h-7 border-l border-[var(--line)] mx-3 hidden xl:block"></span
        ><span class="hidden xl:block text-xs">Archivo Municipal</span></a
      >
      <nav aria-label="Navegación principal" class="flex flex-wrap gap-7 text-[11px]">
        @for (n of nav; track n.path) {
          @if (!n.roles || auth.can(...n.roles)) {
            <a
              [routerLink]="n.path"
              routerLinkActive="!text-[var(--brand)] border-b-2 border-[var(--yellow)]"
              class="text-[var(--muted)] py-3"
              ><span class="text-[9px] mr-1">{{ n.number }}</span
              >{{ n.label }}</a
            >
          }
        }
      </nav>
      <div class="flex items-center gap-3">
        <span
          class="rounded-full bg-[#DDECF5] w-8 h-8 flex items-center justify-center text-[10px]"
          >{{ initials() }}</span
        >
        <div class="text-[10px]">
          <strong>{{ auth.usuario()?.nombre }}</strong
          ><br /><span class="text-[var(--muted)]">{{ roleLabel() }}</span>
        </div>
        <button
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          class="icon-button ml-1"
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
  router = inject(Router);
  nav = [
    { number: '01', label: 'Explorar', path: '/buscar', roles: null },
    {
      number: '02',
      label: 'Cargar varios documentos',
      path: '/digitalizar',
      roles: ['GESTOR_DOCUMENTAL'],
    },
    { number: '03', label: 'Actividad', path: '/auditoria', roles: [] as string[] },
    { number: '04', label: 'Usuarios', path: '/usuarios', roles: [] as string[] },
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
  logout() {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
