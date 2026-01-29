import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type RefOption = { id: string; text: string; sub?: string };

@Component({
  selector: 'app-ref-multi-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ref-multi-select.component.html',
  styleUrls: ['./ref-multi-select.component.scss'],
})
export class RefMultiSelectComponent
{
  @Input() label = '';
  @Input() placeholder = 'انتخاب...';
  @Input() options: RefOption[] = [];

  @Input() selectedIds: string[] = [];
  @Output() selectedIdsChange = new EventEmitter<string[]>();

  @Input() disabled = false;

  filter = '';
  pendingId = '';

  get filtered(): RefOption[]
  {
    const q = this.filter.trim().toLowerCase();
    const base = !q
      ? this.options
      : this.options.filter(o => (o.text + ' ' + (o.sub ?? '')).toLowerCase().includes(q));

    // آیتم‌هایی که قبلاً انتخاب شدن رو از لیست Add حذف کن
    const set = new Set(this.selectedIds);
    return base.filter(x => !set.has(x.id));
  }

  getSelectedLabel(id: string): string
  {
    const o = this.options.find(x => x.id === id);
    if (!o) return id;
    return o.text + (o.sub ? ' — ' + o.sub : '');
  }

  add()
  {
    const id = (this.pendingId ?? '').trim();
    if (!id) return;
    if (this.selectedIds.includes(id)) return;

    const next = [...this.selectedIds, id];
    this.selectedIds = next;
    this.selectedIdsChange.emit(next);
    this.pendingId = '';
  }

  remove(id: string)
  {
    const next = this.selectedIds.filter(x => x !== id);
    this.selectedIds = next;
    this.selectedIdsChange.emit(next);
  }
}
