import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div
      class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"
    >
      <h2 class="font-semibold text-slate-900">{{ title() }}</h2>
      <p class="mx-auto mt-2 max-w-xl text-sm text-slate-500">{{ description() }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input('');
}
