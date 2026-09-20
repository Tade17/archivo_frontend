import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { User, Page } from '../../../../core/models/archive.model';
import { PagerComponent } from '../../../../shared/components/pager.component';
@Component({
  selector: 'app-usuario-list',
  imports: [RouterLink, PagerComponent],
  template: ` <div class="page-heading">
      <div>
        <h1>Usuarios y <strong>roles</strong></h1>
        <p>Accesos según perfil y permisos por módulo del sistema.</p>
      </div>
      <div class="flex gap-3">
        <a class="btn secondary" routerLink="/catalogos">Catálogos</a
        ><a class="btn" routerLink="/usuarios/nuevo">Nuevo usuario →</a>
      </div>
    </div>
    <div class="workspace grid lg:grid-cols-[340px_1fr] gap-6">
      <section class="panel">
        <h2>Directorio</h2>
        <p class="text-xs text-[var(--muted)] mt-2 mb-4">
          {{ result()?.totalElementos ?? 0 }} cuentas registradas
        </p>
        @for (u of result()?.contenido; track u.id) {
          <button
            class="w-full text-left py-5 px-3 border-b border-[var(--line)]"
            [class]="selected()?.id === u.id ? 'bg-[var(--soft)]' : ''"
            (click)="selected.set(u)"
          >
            <div class="flex justify-between gap-2">
              <strong>{{ u.nombre }}</strong
              ><span class="badge" [class.warning]="!u.activo">{{
                u.activo ? 'Activa' : 'Suspendida'
              }}</span>
            </div>
            <p class="text-xs text-[var(--muted)] mt-2">{{ roleLabel(u.rolNombre) }}</p>
          </button>
        }
        <app-pager
          [page]="result()?.pagina ?? 0"
          [size]="10"
          [total]="result()?.totalElementos ?? 0"
          (changed)="load($event)"
        />
      </section>
      <section class="panel">
        @if (selected(); as u) {
          <div class="flex flex-wrap justify-between gap-4">
            <div>
              <h2>{{ u.nombre }}</h2>
              <p class="text-xs text-[var(--muted)] mt-2">{{ u.correo }}</p>
              <span class="badge neutral mt-3">{{ roleLabel(u.rolNombre) }}</span>
            </div>
            <div class="flex gap-3 self-start">
              <a class="btn secondary" routerLink="/usuarios/nuevo" [queryParams]="{ editar: u.id }"
                >Editar usuario</a
              >
              @if (u.activo && u.id !== auth.usuario()?.usuarioId) {
                <button class="btn secondary" [disabled]="busy()" (click)="suspend(u)">
                  Suspender acceso
                </button>
              }
            </div>
          </div>
          <div class="rule"></div>
          <h3>Permisos por módulo</h3>
          <p class="text-xs text-[var(--muted)] mt-2 mb-6">
            Derivados del rol y aplicados por el servidor.
          </p>
          <div class="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>MÓDULO</th>
                  <th>CONSULTAR</th>
                  <th>CREAR / EDITAR</th>
                  <th>ELIMINAR</th>
                </tr>
              </thead>
              <tbody>
                @for (m of modules; track m.name) {
                  <tr>
                    <td>{{ m.name }}</td>
                    <td>{{ read(u, m.key) ? '✓' : '—' }}</td>
                    <td>{{ write(u, m.key) ? '✓' : '—' }}</td>
                    <td>
                      {{
                        u.rolNombre === 'ADMIN' && m.key !== 'expedientes' && m.key !== 'auditoria'
                          ? '✓'
                          : '—'
                      }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="empty">Selecciona un usuario.</p>
        }
      </section>
    </div>`,
})
export class UsuarioListComponent implements OnInit {
  api = inject(ArchiveApi);
  auth = inject(AuthService);
  dialog = inject(DialogService);
  result = signal<Page<User> | null>(null);
  selected = signal<User | null>(null);
  busy = signal(false);
  modules = [
    { name: 'Expedientes', key: 'expedientes' },
    { name: 'Carga de documentos', key: 'digital' },
    { name: 'Actividad y seguridad', key: 'auditoria' },
    { name: 'Usuarios', key: 'usuarios' },
  ];
  ngOnInit() {
    this.load(0);
  }
  load(p: number) {
    this.api.users(p).subscribe({
      next: (r) => {
        this.result.set(r);
        this.selected.set(r.contenido[0] ?? null);
      },
      error: (e) => this.dialog.error(e),
    });
  }
  read(u: User, m: string) {
    return ['usuarios', 'auditoria'].includes(m) ? u.rolNombre === 'ADMIN' : true;
  }
  write(u: User, m: string) {
    return (
      m !== 'auditoria' &&
      (u.rolNombre === 'ADMIN' || (m !== 'usuarios' && u.rolNombre === 'GESTOR_DOCUMENTAL'))
    );
  }
  roleLabel(name: string) {
    return (
      { ADMIN: 'Administrador', GESTOR_DOCUMENTAL: 'Gestor de documentos', LECTOR: 'Solo lectura' }[
        name
      ] ?? name
    );
  }
  async suspend(u: User) {
    this.busy.set(true);
    if (
      !(await this.dialog.ask(
        'Suspender acceso',
        'La cuenta de ' + u.nombre + ' dejará de tener acceso al sistema.',
      ))
    ) {
      this.busy.set(false);
      return;
    }
    this.api.suspendUser(u.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.load(this.result()?.pagina ?? 0);
      },
      error: (e) => {
        this.busy.set(false);
        this.dialog.error(e);
      },
    });
  }
}
