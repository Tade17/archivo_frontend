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
            (click)="kind = k.key; nombre = ''"
          >
            {{ k.label }}
          </button>
        }
      </aside>
      <form #f="ngForm" class="panel self-start" (ngSubmit)="save()">
        <h2>Añadir {{ current().label.toLowerCase() }}</h2>
        <p class="mt-3 text-xs text-[var(--muted)]">Estos valores estarán disponibles al registrar documentos.</p>
        <div class="rule"></div>
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
