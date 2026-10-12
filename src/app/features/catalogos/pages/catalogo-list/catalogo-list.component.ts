import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArchiveApi } from '../../../../core/services/archive-api.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { Catalogs, CatalogItem } from '../../../../core/models/archive.model';
@Component({
  selector: 'app-catalogo-list',
  imports: [FormsModule, RouterLink],
  template: ` <div class="page-heading">
      <div>
        <h1>Configurar <strong>el archivo</strong></h1>
        <p>Áreas y tipos documentales para organizar el archivo digital.</p>
      </div>
      <a class="btn secondary" routerLink="/usuarios">Volver a administración</a>
    </div>
    <div class="workspace grid lg:grid-cols-[300px_1fr] gap-6">
      <aside class="panel">
        <p class="eyebrow mb-5">CATÁLOGOS</p>
        @for (k of kinds; track k.key) {
          <button
            class="block w-full text-left px-3 py-4 border-b border-[var(--line)]"
            [class]="kind === k.key ? 'bg-[var(--soft)] text-[var(--brand)]' : ''"
            (click)="kind = k.key; nombre = ''; editing.set(null)"
          >
            {{ k.label }}
          </button>
        }
      </aside>
      <form #f="ngForm" class="panel self-start" (ngSubmit)="save()">
        <h2>Añadir {{ current().label.toLowerCase() }}</h2>
        <p class="mt-3 text-xs text-[var(--muted)]">Estos valores estarán disponibles al registrar documentos.</p>
        <div class="rule"></div>
        <p class="eyebrow mb-2">{{ current().label.toUpperCase() }} EXISTENTES</p>
        <ul class="border border-[var(--line)] rounded-[6px] mb-6 max-h-[320px] overflow-auto">
          @for (item of items(); track item.id) {
            <li
              class="flex items-center justify-between gap-3 px-4 py-2 border-b border-[var(--line)] last:border-b-0"
            >
              <span class="text-sm">{{ item.nombre }}</span>
              <span class="flex gap-4 shrink-0">
                <button type="button" class="text-button" [disabled]="busy()" (click)="rename(item)">
                  Renombrar
                </button>
                <button type="button" class="text-button" [disabled]="busy()" (click)="remove(item)">
                  Quitar
                </button>
              </span>
            </li>
          } @empty {
            <li class="px-4 py-3 text-xs text-[var(--muted)]">Todavía no hay registros.</li>
          }
        </ul>
        @if (editing(); as ed) {
          <div class="rounded-[6px] bg-[var(--soft)] px-4 py-3 mb-6">
            <label
              >Nuevo nombre<input
                name="renombre"
                maxlength="100"
                [ngModelOptions]="{ standalone: true }"
                [(ngModel)]="newName"
            /></label>
            <div class="flex justify-end gap-3 mt-3">
              <button type="button" class="text-button" (click)="editing.set(null)">Cancelar</button>
              <button
                type="button"
                class="btn"
                [disabled]="!newName.trim() || busy()"
                (click)="saveRename(ed)"
              >
                Guardar nombre
              </button>
            </div>
          </div>
        }
        <label
          >{{ current().code ? 'Código' : 'Nombre'
          }}<input name="nombre" required maxlength="100" [(ngModel)]="nombre"
        /></label>
        <div class="flex justify-end mt-7">
          <button class="btn" [disabled]="!f.valid || busy()">Guardar catálogo</button>
        </div>
        <p class="text-xs text-[var(--muted)] mt-7">
          {{ count() }} registro(s) existentes en este catálogo.
        </p>
      </form>
    </div>`,
})
export class CatalogoListComponent implements OnInit {
  api = inject(ArchiveApi);
  dialog = inject(DialogService);
  catalogs = signal<Catalogs | null>(null);
  busy = signal(false);
  kind = 'areas';
  nombre = '';
  newName = '';
  editing = signal<CatalogItem | null>(null);
  kinds = [
    {
      key: 'areas',
      label: 'Áreas de destino',
      path: 'areas-responsables',
      code: false,
    },
    {
      key: 'tipos',
      label: 'Tipos documentales',
      path: 'tipos-documentales',
      code: false,
    },
  ];
  ngOnInit() {
    this.load();
  }
  current() {
    return this.kinds.find((k) => k.key === this.kind)!;
  }
  items(): CatalogItem[] {
    const c = this.catalogs();
    return c ? ((c as unknown as Record<string, CatalogItem[]>)[this.kind] ?? []) : [];
  }
  rename(item: CatalogItem) {
    this.newName = item.nombre;
    this.editing.set(item);
  }
  saveRename(item: CatalogItem) {
    this.busy.set(true);
    this.api
      .updateCatalog(this.current().path, item.id, { nombre: this.newName.trim() })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.editing.set(null);
          this.load();
        },
        error: (e) => {
          this.busy.set(false);
          this.dialog.error(e);
        },
      });
  }
  async remove(item: CatalogItem) {
    if (
      !(await this.dialog.ask(
        'Quitar del catálogo',
        'Se quitará «' +
          item.nombre +
          '». Si hay documentos que lo usan, el sistema no lo permitirá.',
      ))
    )
      return;
    this.api.deleteCatalog(this.current().path, item.id).subscribe({
      next: () => this.load(),
      error: (e) => this.dialog.error(e),
    });
  }
  count() {
    const c = this.catalogs();
    return c ? ((c as unknown as Record<string, CatalogItem[]>)[this.kind]?.length ?? 0) : 0;
  }
  load() {
    this.api
      .catalogs()
      .subscribe({ next: (c) => this.catalogs.set(c), error: (e) => this.dialog.error(e) });
  }
  async save() {
    this.busy.set(true);
    const k = this.current();
    if (
      !(await this.dialog.ask(
        'Guardar catálogo',
        'Se añadirá ' + this.nombre + ' a ' + k.label + '.',
      ))
    ) {
      this.busy.set(false);
      return;
    }
    const body: Record<string, string> = {};
    body[k.code ? 'codigo' : 'nombre'] = this.nombre;
    this.api.createCatalog(k.path, body).subscribe({
      next: () => {
        this.busy.set(false);
        this.nombre = '';
        this.load();
        this.dialog.info('Registro guardado', 'El catálogo ya está disponible en los formularios.');
      },
      error: (e) => {
        this.busy.set(false);
        this.dialog.error(e);
      },
    });
  }
}
