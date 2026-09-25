import {
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArchiveApi } from '../../core/services/archive-api.service';
import { DialogService } from '../../core/services/dialog.service';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

/** Fragmento de texto de una página tal como lo entrega pdf.js. */
interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

/** Parte de un fragmento de texto que forma parte de una coincidencia. */
interface Segment {
  item: number;
  from: number;
  to: number;
}

interface Match {
  page: number;
  segments: Segment[];
}

/** Texto de una página listo para buscar: plegado (sin tildes ni mayúsculas) y con su mapa de posiciones. */
interface PageText {
  items: PdfTextItem[];
  starts: number[];
  folded: string;
}

/** Igual longitud que el original, para que las posiciones del texto plegado sirvan sobre el texto real. */
const foldChar = (char: string): string =>
  (char.normalize('NFD')[0] ?? char).toLowerCase().charAt(0) || char;
const fold = (text: string): string => text.split('').map(foldChar).join('');

@Component({
  selector: 'app-document-preview',
  imports: [FormsModule],
  template: `
    <div class="h-full flex flex-col min-h-[460px]">
      <div
        class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3 bg-white"
      >
        <span class="text-xs text-[var(--muted)]">{{
          loading() ? 'Abriendo documento…' : pages() ? page() + ' / ' + pages() : ''
        }}</span>
        <div class="flex gap-2">
          <button class="icon-button" aria-label="Reducir" (click)="zoom(-0.15)" [disabled]="!pdf">
            −
          </button>
          <button class="icon-button" aria-label="Ampliar" (click)="zoom(0.15)" [disabled]="!pdf">
            +
          </button>
          <button
            class="icon-button"
            aria-label="Girar página"
            (click)="rotate()"
            [disabled]="!pdf"
          >
            ↻
          </button>
        </div>
      </div>
      @if (full()) {
        <div class="flex gap-2 bg-white p-3 border-b border-[var(--line)]">
          <input
            aria-label="Buscar dentro del documento"
            placeholder="Buscar dentro del documento…"
            [(ngModel)]="query"
            [disabled]="!pdf"
            (keydown.enter)="submit()"
            (keydown.shift.enter)="step(-1)"
          />
          <button class="btn small secondary" (click)="find()" [disabled]="!pdf || searching()">
            Buscar
          </button>
        </div>
        @if (imageUrl()) {
          <p class="p-3 text-xs bg-white border-b border-[var(--line)]">
            Este documento es una imagen sin texto seleccionable, por eso no se puede buscar dentro
            de él.
          </p>
        }
        @if (searchDone()) {
          <div
            class="flex flex-wrap items-center gap-3 p-3 text-xs bg-white border-b border-[var(--line)]"
            aria-live="polite"
          >
            @if (matches().length) {
              <span
                >Coincidencia {{ current() + 1 }} de {{ matches().length }} · página
                {{ matches()[current()]?.page }}</span
              >
              <button
                class="icon-button"
                aria-label="Coincidencia anterior"
                (click)="step(-1)"
              >
                ‹
              </button>
              <button class="icon-button" aria-label="Coincidencia siguiente" (click)="step(1)">
                ›
              </button>
            } @else {
              <span>Sin coincidencias.</span>
            }
          </div>
        }
      }
      <div class="bg-[var(--soft)] overflow-auto flex-1 p-5 relative text-center">
        <span #marker class="absolute pointer-events-none" aria-hidden="true"></span>
        @if (!id()) {
          <div class="empty">Selecciona un expediente con documento digital.</div>
        }
        @if (message()) {
          <p class="empty">{{ message() }}</p>
        }
        <canvas
          #canvas
          [class.hidden]="!pdf"
          class="mx-auto shadow-md max-w-full"
          aria-label="Página del documento"
        ></canvas>
        @if (imageUrl()) {
          <img
            [src]="imageUrl()"
            alt="Documento digitalizado"
            class="mx-auto max-w-full shadow-md"
          />
        }
      </div>
      @if (pdf) {
        <div class="flex items-center justify-center gap-4 p-3 bg-white">
          <button
            class="icon-button"
            aria-label="Página anterior del documento"
            [disabled]="page() <= 1"
            (click)="go(page() - 1)"
          >
            ‹
          </button>
          <span class="text-xs">Página {{ page() }} de {{ pages() }}</span>
          <button
            class="icon-button"
            aria-label="Página siguiente del documento"
            [disabled]="page() >= pages()"
            (click)="go(page() + 1)"
          >
            ›
          </button>
        </div>
      }
    </div>
  `,
})
export class DocumentPreviewComponent implements OnDestroy {
  id = input<string | null>(null);
  full = input(false);
  canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  marker = viewChild<ElementRef<HTMLElement>>('marker');
  api = inject(ArchiveApi);
  dialog = inject(DialogService);

  page = signal(1);
  pages = signal(0);
  loading = signal(false);
  message = signal('');
  imageUrl = signal('');
  matches = signal<Match[]>([]);
  current = signal(-1);
  searchDone = signal(false);
  searching = signal(false);
  query = '';
  pdf: PDFDocumentProxy | null = null;

  private lastQuery = '';
  private reveal = false;
  private scale = 1.2;
  private rotation = 0;
  private serial = 0;
  private rendering: RenderTask | null = null;
  private pageTexts = new Map<number, PageText>();
  private measure: CanvasRenderingContext2D | null = null;

  constructor() {
    // open() lee otras señales (p. ej. imageUrl); sin untracked, cargar una imagen
    // volvía a disparar este efecto y el documento se pedía en bucle.
    effect(() => {
      const id = this.id();
      const canvas = this.canvas();
      if (canvas) untracked(() => void this.open(id));
    });
  }

  private async open(id: string | null) {
    const serial = ++this.serial;
    this.rendering?.cancel();
    void this.pdf?.cleanup();
    this.pdf = null;
    if (this.imageUrl()) URL.revokeObjectURL(this.imageUrl());
    this.imageUrl.set('');
    this.message.set('');
    this.page.set(1);
    this.pages.set(0);
    this.pageTexts.clear();
    this.matches.set([]);
    this.current.set(-1);
    this.searchDone.set(false);
    if (!id) return;
    this.loading.set(true);
    this.api.binary(id).subscribe({
      next: async (blob) => {
        if (serial !== this.serial) return;
        try {
          if (blob.type.startsWith('image/') && blob.type !== 'image/tiff') {
            this.imageUrl.set(URL.createObjectURL(blob));
            return;
          }
          if (blob.type !== 'application/pdf') {
            this.message.set('Este formato no tiene vista previa. Descarga el original para abrirlo.');
            return;
          }
          const engine = await import('pdfjs-dist');
          engine.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
          const pdf = await engine.getDocument({ data: await blob.arrayBuffer() }).promise;
          if (serial !== this.serial) {
            void pdf.cleanup();
            return;
          }
          this.pdf = pdf;
          this.pages.set(pdf.numPages);
          await this.render();
        } catch {
          this.message.set('No se pudo interpretar el documento. Puedes descargar el original.');
        } finally {
          if (serial === this.serial) this.loading.set(false);
        }
      },
      error: (e) => {
        if (serial === this.serial) {
          this.loading.set(false);
          this.message.set('No se pudo abrir la vista previa.');
          this.dialog.error(e);
        }
      },
    });
  }

  async render() {
    const pdf = this.pdf;
    const canvas = this.canvas()?.nativeElement;
    if (!pdf || !canvas) return;
    this.rendering?.cancel();
    try {
      const page = await pdf.getPage(this.page());
      const viewport = page.getViewport({ scale: this.scale, rotation: this.rotation });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const task = page.render({ canvas, viewport });
      this.rendering = task;
      await task.promise;
      const text = await this.pageText(this.page());
      const ctx = canvas.getContext('2d')!;
      // 'multiply' tiñe el fondo sin tapar las letras.
      ctx.globalCompositeOperation = 'multiply';
      let focus: { x: number; y: number } | null = null;
      for (const [index, match] of this.matches().entries()) {
        if (match.page !== this.page()) continue;
        const active = index === this.current();
        ctx.fillStyle = active ? '#FF9F43' : '#FFE066';
        for (const segment of match.segments) {
          const item = text.items[segment.item];
          const left = item.transform[4] + item.width * this.ratio(item.str, segment.from);
          const right = item.transform[4] + item.width * this.ratio(item.str, segment.to);
          const base = item.transform[5];
          const height = item.height || Math.abs(item.transform[3]);
          const [x1, y1] = viewport.convertToViewportPoint(left, base - height * 0.2);
          const [x2, y2] = viewport.convertToViewportPoint(right, base + height * 0.9);
          ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
          if (active && !focus) focus = { x: Math.min(x1, x2), y: Math.min(y1, y2) };
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      if (this.reveal && focus) this.scrollTo(canvas, focus);
      this.reveal = false;
    } catch (e) {
      if ((e as Error).name !== 'RenderingCancelledException') {
        this.message.set('No se pudo mostrar esta página.');
      }
    }
  }

  go(n: number) {
    this.page.set(n);
    void this.render();
  }

  zoom(delta: number) {
    this.scale = Math.max(0.5, Math.min(3, this.scale + delta));
    void this.render();
  }

  rotate() {
    this.rotation = (this.rotation + 90) % 360;
    void this.render();
  }

  /** Enter: busca; si ya hay resultados de esta misma búsqueda, avanza a la siguiente coincidencia. */
  submit() {
    if (this.searchDone() && this.lastQuery === this.query && this.matches().length) this.step(1);
    else void this.find();
  }

  step(direction: 1 | -1) {
    const total = this.matches().length;
    if (total) this.select((this.current() + direction + total) % total);
  }

  private select(index: number) {
    this.current.set(index);
    this.page.set(this.matches()[index].page);
    this.reveal = true;
    void this.render();
  }

  /** Centra en pantalla la coincidencia activa; el marcador invisible hace de ancla para el desplazamiento. */
  private scrollTo(canvas: HTMLCanvasElement, point: { x: number; y: number }) {
    const marker = this.marker()?.nativeElement;
    if (!marker) return;
    marker.style.left = `${canvas.offsetLeft + point.x}px`;
    marker.style.top = `${canvas.offsetTop + point.y}px`;
    marker.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }

  async find() {
    const pdf = this.pdf;
    if (!pdf) return;
    const serial = this.serial;
    const needle = fold(this.query.trim()).replace(/\s+/g, ' ');
    this.lastQuery = this.query;
    this.matches.set([]);
    this.current.set(-1);
    this.searchDone.set(true);
    if (!needle) {
      void this.render();
      return;
    }
    this.searching.set(true);
    try {
      const found: Match[] = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const text = await this.pageText(n);
        if (serial !== this.serial) return;
        let from = 0;
        for (;;) {
          const at = text.folded.indexOf(needle, from);
          if (at < 0) break;
          found.push({ page: n, segments: this.segmentsOf(text, at, at + needle.length) });
          from = at + needle.length;
        }
      }
      this.matches.set(found);
      if (found.length) this.select(0);
      else void this.render();
    } finally {
      this.searching.set(false);
    }
  }

  /** Texto de la página unido en una sola cadena; se une con espacio solo donde el PDF separa palabras. */
  private async pageText(n: number): Promise<PageText> {
    const cached = this.pageTexts.get(n);
    if (cached) return cached;
    const content = await (await this.pdf!.getPage(n)).getTextContent();
    const items = content.items.filter((item) => 'str' in item) as unknown as PdfTextItem[];
    const starts: number[] = [];
    let joined = '';
    items.forEach((item, i) => {
      if (i > 0 && this.needsSpace(items[i - 1], item)) joined += ' ';
      starts.push(joined.length);
      joined += item.str;
    });
    const result = { items, starts, folded: fold(joined) };
    this.pageTexts.set(n, result);
    return result;
  }

  private needsSpace(previous: PdfTextItem, item: PdfTextItem): boolean {
    if (/\s$/.test(previous.str) || /^\s/.test(item.str)) return false;
    const sameLine = Math.abs(previous.transform[5] - item.transform[5]) < (item.height || 1) * 0.5;
    const gap = item.transform[4] - (previous.transform[4] + previous.width);
    return !(sameLine && gap < (item.height || 1) * 0.15);
  }

  private segmentsOf(text: PageText, start: number, end: number): Segment[] {
    const segments: Segment[] = [];
    text.items.forEach((item, i) => {
      const itemStart = text.starts[i];
      const from = Math.max(start, itemStart) - itemStart;
      const to = Math.min(end, itemStart + item.str.length) - itemStart;
      if (to > from) segments.push({ item: i, from, to });
    });
    return segments;
  }

  /** Qué fracción del ancho de un fragmento ocupa su texto hasta la posición dada (fuentes proporcionales). */
  private ratio(text: string, index: number): number {
    if (!text.length) return 0;
    const ctx = (this.measure ??= document.createElement('canvas').getContext('2d')!);
    ctx.font = '16px Arial, Helvetica, sans-serif';
    const total = ctx.measureText(text).width;
    return total > 0 ? ctx.measureText(text.slice(0, index)).width / total : index / text.length;
  }

  ngOnDestroy() {
    this.serial++;
    this.rendering?.cancel();
    void this.pdf?.cleanup();
    if (this.imageUrl()) URL.revokeObjectURL(this.imageUrl());
  }
}
