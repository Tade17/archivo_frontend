import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { ArchiveApi } from '../../core/services/archive-api.service';
import { DialogService } from '../../core/services/dialog.service';
import { Ubicaciones } from '../../core/models/archive.model';

/**
 * Selects en cascada Sección → Nivel → Área. Solo permite elegir ubicaciones que
 * ya existen: se administran aparte (pantalla de Ubicaciones, solo administrador).
 */
@Component({
  selector: 'app-ubicacion-picker',
  template: `
    <div class="grid gap-4 md:grid-cols-3">
      <label
        >Sección
        <select
          [disabled]="disabled()"
          (change)="elegirSeccion($any($event.target).value)"
        >
          <option value="">Seleccionar sección</option>
          @for (s of data()?.secciones; track s.id) {
            <option [value]="s.id" [selected]="s.id === seccionId()">{{ s.codigo }}</option>
          }
        </select>
      </label>
      <label
        >Nivel
        <select
          [disabled]="disabled() || !seccionId()"
          (change)="elegirNivel($any($event.target).value)"
        >
          <option value="">Seleccionar nivel</option>
          @for (n of niveles(); track n.id) {
            <option [value]="n.id" [selected]="n.id === nivelId()">{{ n.codigo }}</option>
          }
        </select>
      </label>
      <label
        >Área
        <select
          [disabled]="disabled() || !nivelId()"
          (change)="areaId.set($any($event.target).value)"
        >
          <option value="">Seleccionar área</option>
          @for (a of areas(); track a.id) {
            <option [value]="a.id" [selected]="a.id === areaId()">{{ a.codigo }}</option>
          }
        </select>
      </label>
    </div>
    @if (data() && !data()!.secciones.length) {
      <p class="text-xs text-[var(--muted)] mt-2">
        Todavía no hay ubicaciones registradas. El administrador debe darlas de alta en
        Ubicaciones.
      </p>
    }
  `,
})
export class UbicacionPickerComponent {
  private api = inject(ArchiveApi);
  private dialog = inject(DialogService);
  areaId = model('');
  disabled = input(false);
  data = signal<Ubicaciones | null>(null);
  seccionId = signal('');
  nivelId = signal('');
  niveles = computed(() =>
    (this.data()?.niveles ?? []).filter((n) => n.seccionId === this.seccionId()),
  );
  areas = computed(() => (this.data()?.areas ?? []).filter((a) => a.nivelId === this.nivelId()));

  constructor() {
    this.api.ubicaciones().subscribe({
      next: (u) => this.data.set(u),
      error: (e) => this.dialog.error(e),
    });
    // Si llega un área ya elegida (edición), se reconstruye su Sección y Nivel.
    effect(() => {
      const data = this.data();
      const area = data?.areas.find((a) => a.id === this.areaId());
      if (!data || !area || area.nivelId === this.nivelId()) return;
      const nivel = data.niveles.find((n) => n.id === area.nivelId);
      this.nivelId.set(area.nivelId);
      this.seccionId.set(nivel?.seccionId ?? '');
    });
  }

  elegirSeccion(id: string) {
    this.seccionId.set(id);
    this.nivelId.set('');
    this.areaId.set('');
  }

  elegirNivel(id: string) {
    this.nivelId.set(id);
    this.areaId.set('');
  }
}
