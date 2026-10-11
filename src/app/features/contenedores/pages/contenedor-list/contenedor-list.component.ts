import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { Contenedor, Page, TipoContenedor } from '../../../../core/models/archive.model';
import { PagerComponent } from '../../../../shared/components/pager.component';
import { UbicacionPickerComponent } from '../../../../shared/components/ubicacion-picker.component';

/**
 * Archivadores y folders físicos. Los pendientes salen primero: son los que
 * quedaron a medio digitalizar y alguien tiene que retomar.
 */
@Component({
  selector: 'app-contenedor-list',
  imports: [FormsModule, DatePipe, RouterLink, PagerComponent, UbicacionPickerComponent],
  template: `
    <div class="page-heading">
      <div>
        <h1>Archivadores <strong>y folders</strong></h1>
        <p>Cada documento se registra dentro del archivador o folder donde está guardado.</p>
      </div>
      @if (auth.can('GESTOR_DOCUMENTAL')) {
        <button class="btn" (click)="creando.set(!creando())">
          {{ creando() ? 'Cancelar' : '+ Nuevo contenedor' }}
        </button>
      }
    </div>
    <div class="workspace space-y-6">
      @if (creando()) {
        <form #f="ngForm" class="panel" (ngSubmit)="crear()">
          <p class="eyebrow">NUEVO CONTENEDOR</p>
          <h2 class="mt-1 mb-5">¿Dónde está y cómo se ve?</h2>
          <app-ubicacion-picker [(areaId)]="nuevo.cajaId" />
          <div class="grid gap-4 md:grid-cols-[220px_1fr] mt-5">
            <label
              >Tipo
              <select name="tipo" required [(ngModel)]="nuevo.tipo">
                <option value="ARCHIVADOR">Archivador</option>
                <option value="FOLDER">Folder</option>
              </select>
            </label>
            <label
              >Descripción, tal como está escrita en el lomo o la carátula
              <input
                name="descripcion"
                required
                maxlength="255"
                placeholder="Ej. Archivador negro - Obra Pista Principal 2024"
                [(ngModel)]="nuevo.descripcion"
              />
            </label>
          </div>
          <div class="flex justify-end mt-6">
            <button class="btn" [disabled]="!f.valid || !nuevo.cajaId || busy()">
              Crear y empezar a registrar documentos
            </button>
          </div>
        </form>
      }
      <form class="panel flex flex-wrap gap-3 items-end" (ngSubmit)="load(0)">
        <label class="!w-auto"
          >Estado
          <select name="estado" [(ngModel)]="filtros.estado" (change)="load(0)">
            <option value="PENDIENTE">Pendientes</option>
            <option value="COMPLETADO">Completados</option>
            <option value="">Todos</option>
          </select>
        </label>
        <label class="flex-1 min-w-[220px]"
          >Buscar por descripción
          <input name="texto" placeholder="Ej. archivador negro" [(ngModel)]="filtros.texto" />
        </label>
        <button class="btn secondary">Buscar</button>
      </form>
      <section class="panel !p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>CONTENEDOR</th>
                <th>UBICACIÓN</th>
                <th>DOCUMENTOS</th>
                <th>ESTADO</th>
                <th>ÚLTIMO CAMBIO</th>
              </tr>
            </thead>
            <tbody>
              @for (c of result()?.contenido; track c.id) {
                <tr class="selectable" (click)="abrir(c)">
                  <td>
                    <a [routerLink]="['/contenedores', c.id]" class="font-semibold">{{
                      c.descripcion
                    }}</a>
                    <p class="text-[10px] text-[var(--muted)] mt-1">{{ tipoLabel(c.tipo) }}</p>
                  </td>
                  <td class="text-xs">
                    Sección {{ c.seccion }} · Nivel {{ c.nivel }} · Área {{ c.area }}
                  </td>
                  <td>{{ c.totalDocumentos }}</td>
                  <td>
                    <span class="badge" [class.warning]="c.estado === 'PENDIENTE'">{{
                      c.estado === 'PENDIENTE' ? 'Pendiente' : 'Completado'
                    }}</span>
                  </td>
                  <td class="text-xs">{{ c.fechaActualizacion | date: 'dd/MM/yyyy HH:mm' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="empty">
                    {{
                      filtros.estado === 'PENDIENTE'
                        ? 'No hay contenedores pendientes. Todo lo registrado está completo.'
                        : 'No hay contenedores con estos filtros.'
                    }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="px-5">
          <app-pager
            [page]="result()?.pagina ?? 0"
            [size]="20"
            [total]="result()?.totalElementos ?? 0"
            (changed)="load($event)"
          />
        </div>
      </section>
    </div>
  `,
})
export class ContenedorListComponent implements OnInit {
  api = inject(ArchiveApi);
  auth = inject(AuthService);
  dialog = inject(DialogService);
  router = inject(Router);
  result = signal<Page<Contenedor> | null>(null);
  creando = signal(false);
  busy = signal(false);
  filtros = { estado: 'PENDIENTE', texto: '' };
  nuevo: { cajaId: string; tipo: TipoContenedor; descripcion: string } = {
    cajaId: '',
    tipo: 'ARCHIVADOR',
    descripcion: '',
  };

  ngOnInit() {
    this.load(0);
  }

  load(page: number) {
    this.api.contenedores(this.filtros, page).subscribe({
      next: (r) => this.result.set(r),
      error: (e) => this.dialog.error(e),
    });
  }

  tipoLabel(tipo: TipoContenedor) {
    return tipo === 'ARCHIVADOR' ? 'Archivador' : 'Folder';
  }

  abrir(c: Contenedor) {
    void this.router.navigate(['/contenedores', c.id]);
  }

  crear() {
    if (this.busy()) return;
    this.busy.set(true);
    this.api.saveContenedor(null, { ...this.nuevo, descripcion: this.nuevo.descripcion.trim() }).subscribe({
      next: (c) => {
        this.busy.set(false);
        void this.router.navigate(['/contenedores', c.id]);
      },
      error: (e) => {
        this.busy.set(false);
        this.dialog.error(e);
      },
    });
  }
}
