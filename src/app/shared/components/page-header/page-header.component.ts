import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="mb-6 flex flex-col gap-1">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
        {{ eyebrow() }}
      </p>
      <h1 class="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{{ title() }}</h1>
      @if (description()) {
        <p class="max-w-3xl text-sm leading-6 text-slate-600">{{ description() }}</p>
      }
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly eyebrow = input('Archivo digital');
  readonly title = input.required<string>();
  readonly description = input('');
}
