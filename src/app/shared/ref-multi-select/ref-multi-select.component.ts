import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type RefOption = { id: number; text: string; sub?: string };

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

  @Input() selectedIds: number[] = [];
  @Output() selectedIdsChange = new EventEmitter<number[]>();

  @Input() disabled = false;

  filter = '';
  pendingId: number | null = null;

  get filtered(): RefOption[]
  {
    const q = this.filter.trim().toLowerCase();
    const base = !q
      ? this.options
      : this.options.filter(o => (o.text + ' ' + (o.sub ?? '')).toLowerCase().includes(q));

    // آیتم‌هایی که قبلاً انتخاب شدن رو از لیست Add حذف کن
    const set = new Set<number>(this.selectedIds);
    return base.filter(x => !set.has(x.id));
  }

  getSelectedLabel(id: number): string
  {
    const o = this.options.find(x => x.id === id);
    if (!o) return String(id);
    return o.text + (o.sub ? ' — ' + o.sub : '');
  }

onPendingChange(raw: string)
{
  const v = (raw ?? '').toString().trim();
  this.pendingId = v === '' ? null : +v;
  if (this.pendingId !== null && !Number.isFinite(this.pendingId)) this.pendingId = null;
}

add()

{
  const id = this.pendingId;
  if (id === null || !Number.isFinite(id)) return;
  if (this.selectedIds.includes(id)) return;

  const next = [...this.selectedIds, id];
  this.selectedIds = next;
  this.selectedIdsChange.emit(next);
  this.pendingId = null;
}


  remove(id: number)
  {
    const next = this.selectedIds.filter(x => x !== id);
    this.selectedIds = next;
    this.selectedIdsChange.emit(next);
  }
}
