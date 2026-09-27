import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { DocumentPreviewComponent } from './document-preview.component';

/** Panel "Buscar dentro del documento": maneja la búsqueda de un visor y lista sus coincidencias. */
@Component({
  selector: 'app-document-search',
  imports: [FormsModule],
  template: `
    <section class="panel !p-5">
      <h3>Buscar dentro del documento</h3>
      <div class="relative mt-4">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          class="!pl-9"
          aria-label="Buscar dentro del documento"
          placeholder="Buscar dentro del documento…"
          [ngModel]="viewer().query"
          (ngModelChange)="viewer().setQuery($event)"
          [disabled]="!canSearch()"
          (keydown.enter)="viewer().submit()"
          (keydown.shift.enter)="viewer().step(-1)"
        />
      </div>
      <button
        class="btn small secondary w-full mt-3"
        (click)="viewer().find()"
        [disabled]="!canSearch() || viewer().searching()"
      >
        Buscar
      </button>
      <p class="mt-3 text-[11px] leading-5 text-[var(--muted)]" aria-live="polite">
        @if (viewer().imageUrl()) {
          Este documento es una imagen sin texto seleccionable, por eso no se puede buscar dentro de
          él.
        } @else if (viewer().searchDone()) {
          @if (viewer().matches().length) {
            <span class="text-[var(--brand)] font-semibold"
              >{{ viewer().matches().length }}
              {{ viewer().matches().length === 1 ? 'coincidencia' : 'coincidencias' }} en
              {{ pagesWithMatches() }} {{ pagesWithMatches() === 1 ? 'página' : 'páginas' }}</span
            >
          } @else {
            Sin coincidencias.
          }
        } @else {
          Ignora tildes y mayúsculas.
        }
      </p>
    </section>
    @if (viewer().matches().length) {
      <section class="panel !p-5 mt-4">
        <div class="flex items-center justify-between gap-2">
          <h3>Coincidencias</h3>
          <span class="flex gap-1">
            <button
              class="icon-button"
              aria-label="Coincidencia anterior"
              (click)="viewer().step(-1)"
            >
              ‹
            </button>
            <button
              class="icon-button"
              aria-label="Coincidencia siguiente"
              (click)="viewer().step(1)"
            >
              ›
            </button>
          </span>
        </div>
        <ul class="mt-3 flex flex-col gap-2 max-h-[340px] overflow-auto">
          @for (match of viewer().matches(); track $index) {
            <li>
              <button
                class="block w-full text-left rounded-[5px] px-3 py-2 border"
                [class]="
                  $index === viewer().current()
                    ? 'bg-[var(--soft)] border-[var(--brand)]'
                    : 'bg-white border-[var(--line)] hover:bg-[var(--soft)]'
                "
                (click)="viewer().select($index)"
              >
                <span class="block text-[10px] font-bold text-[var(--brand)]"
                  >Pág. {{ match.page }}</span
                >
                <span class="block text-[11px] leading-4 text-[var(--ink)] mt-1">{{
                  match.snippet
                }}</span>
              </button>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class DocumentSearchComponent {
  viewer = input.required<DocumentPreviewComponent>();
  canSearch = computed(() => this.viewer().pages() > 0);

  pagesWithMatches(): number {
    return new Set(this.viewer().matches().map((match) => match.page)).size;
  }
}
