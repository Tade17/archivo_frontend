import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ArchiveApi, UbicacionTipo } from '../../../../core/services/archive-api.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { UbicacionItem, Ubicaciones } from '../../../../core/models/archive.model';

interface Columna {
  tipo: UbicacionTipo;
  titulo: string;
  singular: string;
  ayuda: string;
}

@Component({
  selector: 'app-ubicacion-admin',
  imports: [FormsModule],
  template: `
    <div class="page-heading">
      <div>
        <h1>Ubicación <strong>física</strong></h1>
        <p>
          Registra solo las secciones, niveles y áreas que existen en el archivo. Al registrar
          documentos se elige de esta lista.
        </p>
      </div>
    </div>
    <div class="workspace grid gap-6 lg:grid-cols-3">
      @for (col of columnas; track col.tipo) {
        <section class="panel self-start">
          <p class="eyebrow">{{ col.titulo.toUpperCase() }}</p>
          <p class="text-xs text-[var(--muted)] mt-2">{{ col.ayuda }}</p>
          @if (padreFalta(col.tipo)) {
            <p class="empty !py-8">{{ padreFalta(col.tipo) }}</p>
          } @else {
            <ul class="mt-4 border-t border-[var(--line)]">
              @for (item of items(col.tipo); track item.id) {
                <li
                  class="flex items-center gap-2 py-2 border-b border-[var(--line)] px-2"
                  [style.background]="seleccionado(col.tipo) === item.id ? 'var(--soft)' : ''"
                >
                  @if (editando() === item.id) {
                    <input
                      class="!py-2"
                      [ngModel]="item.codigo"
                      #nuevo
                      maxlength="50"
                      (keyup.enter)="renombrar(col.tipo, item, nuevo.value)"
                    />
                    <button class="text-button" (click)="renombrar(col.tipo, item, nuevo.value)">
                      Guardar
                    </button>
                    <button class="text-button" (click)="editando.set(null)">Cancelar</button>
                  } @else {
                    <button
                      class="flex-1 text-left py-1 font-semibold"
                      [disabled]="col.tipo === 'area'"
                      (click)="seleccionar(col.tipo, item.id)"
                    >
                      {{ col.singular }} {{ item.codigo }}
                      @if (col.tipo === 'area') {
                        <span class="text-[10px] font-normal text-[var(--muted)]">
                          · {{ contenedoresDe(item.id) }} contenedor(es)</span
                        >
                      }
                    </button>
                    <button class="text-button" [disabled]="busy()" (click)="editando.set(item.id)">
                      Renombrar
                    </button>
                    <button
                      class="text-button !text-[var(--error)]"
                      [disabled]="busy()"
                      (click)="eliminar(col.tipo, item)"
                    >
                      Quitar
                    </button>
                  }
                </li>
              } @empty {
                <li class="py-4 text-xs text-[var(--muted)]">Sin registros todavía.</li>
              }
            </ul>
            <form class="flex gap-2 mt-4" (ngSubmit)="agregar(col.tipo)">
              <input
                [name]="'nuevo-' + col.tipo"
                [placeholder]="'Código de ' + col.singular.toLowerCase() + ' (ej. 1)'"
                maxlength="50"
                [(ngModel)]="nuevos[col.tipo]"
              />
              <button class="btn small" [disabled]="busy() || !nuevos[col.tipo].trim()">
                Agregar
              </button>
            </form>
          }
        </section>
      }
    </div>
  `,
})
export class UbicacionAdminComponent implements OnInit {
  private api = inject(ArchiveApi);
  private dialog = inject(DialogService);
  data = signal<Ubicaciones | null>(null);
  seccionId = signal('');
  nivelId = signal('');
  editando = signal<string | null>(null);
  busy = signal(false);
  nuevos: Record<UbicacionTipo, string> = { seccion: '', nivel: '', area: '' };
  columnas: Columna[] = [
    {
      tipo: 'seccion',
      titulo: 'Secciones',
      singular: 'Sección',
      ayuda: 'Cada hilera de andamios del archivo.',
    },
    {
      tipo: 'nivel',
      titulo: 'Niveles',
      singular: 'Nivel',
      ayuda: 'Pisos de la sección, contados desde el fondo hacia arriba.',
    },
    {
      tipo: 'area',
      titulo: 'Áreas',
      singular: 'Área',
      ayuda: 'Espacios dentro del nivel, contados desde el fondo hacia delante.',
    },
  ];
  private niveles = computed(() =>
    (this.data()?.niveles ?? []).filter((n) => n.seccionId === this.seccionId()),
  );
  private areas = computed(() =>
    (this.data()?.areas ?? []).filter((a) => a.nivelId === this.nivelId()),
  );

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.ubicaciones().subscribe({
      next: (u) => this.data.set(u),
      error: (e) => this.dialog.error(e),
    });
  }

  items(tipo: UbicacionTipo): UbicacionItem[] {
    if (tipo === 'seccion') return this.data()?.secciones ?? [];
    return tipo === 'nivel' ? this.niveles() : this.areas();
  }

  seleccionado(tipo: UbicacionTipo) {
    return tipo === 'seccion' ? this.seccionId() : tipo === 'nivel' ? this.nivelId() : '';
  }

  padreFalta(tipo: UbicacionTipo) {
    if (tipo === 'nivel' && !this.seccionId()) return 'Elige una sección para ver sus niveles.';
    if (tipo === 'area' && !this.nivelId()) return 'Elige un nivel para ver sus áreas.';
    return '';
  }

  contenedoresDe(areaId: string) {
    return this.data()?.areas.find((a) => a.id === areaId)?.totalContenedores ?? 0;
  }

  seleccionar(tipo: UbicacionTipo, id: string) {
    if (tipo === 'seccion') {
      this.seccionId.set(id);
      this.nivelId.set('');
    } else if (tipo === 'nivel') {
      this.nivelId.set(id);
    }
  }

  private cuerpo(tipo: UbicacionTipo, codigo: string) {
    if (tipo === 'seccion') return { archivoCentralId: this.data()?.archivoCentral.id, codigo };
    if (tipo === 'nivel') return { estanteId: this.seccionId(), codigo };
    return { nivelId: this.nivelId(), codigo };
  }

  async agregar(tipo: UbicacionTipo) {
    const codigo = this.nuevos[tipo].trim();
    if (!codigo || this.busy()) return;
    if (tipo === 'seccion' && !this.data()?.archivoCentral.id) {
      this.dialog.info('Falta el archivo central', 'No hay un archivo central registrado.');
      return;
    }
    await this.guardar(tipo, null, codigo);
    this.nuevos[tipo] = '';
  }

  async renombrar(tipo: UbicacionTipo, item: UbicacionItem, codigo: string) {
    codigo = codigo.trim();
    if (!codigo || codigo === item.codigo) {
      this.editando.set(null);
      return;
    }
    await this.guardar(tipo, item.id, codigo);
    this.editando.set(null);
  }

  private async guardar(tipo: UbicacionTipo, id: string | null, codigo: string) {
    this.busy.set(true);
    try {
      await firstValueFrom(this.api.saveUbicacion(tipo, id, this.cuerpo(tipo, codigo)));
      this.load();
    } catch (e) {
      this.dialog.error(e);
    } finally {
      this.busy.set(false);
    }
  }

  async eliminar(tipo: UbicacionTipo, item: UbicacionItem) {
    const nombre = this.columnas.find((c) => c.tipo === tipo)!.singular + ' ' + item.codigo;
    if (!(await this.dialog.ask('Quitar ubicación', 'Se quitará ' + nombre + ' del sistema.'))) return;
    this.busy.set(true);
    try {
      await firstValueFrom(this.api.deleteUbicacion(tipo, item.id));
      if (this.seccionId() === item.id) this.seleccionar('seccion', '');
      if (this.nivelId() === item.id) this.nivelId.set('');
      this.load();
    } catch (e) {
      this.dialog.error(e);
    } finally {
      this.busy.set(false);
    }
  }
}
