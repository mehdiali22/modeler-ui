import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type SmartOption = { id: number; text: string; sub?: string };

@Component({
  selector: 'app-smart-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './smart-select.component.html',
  styleUrls: ['./smart-select.component.scss'],
})
export class SmartSelectComponent
{
  @Input() label = '';
  @Input() placeholder = 'انتخاب...';
  @Input() options: SmartOption[] = [];

  @Input() value: number | null = null;
  @Output() valueChange = new EventEmitter<number | null>();

  @Input() disabled = false;

  filter = '';

  get filtered(): SmartOption[]
  {
    const q = this.filter.trim().toLowerCase();
    if (!q) return this.options;
    return this.options.filter(o =>
      (o.text + ' ' + (o.sub ?? '')).toLowerCase().includes(q)
    );
  }

  onPick(raw: string)
{
  const v = (raw ?? '').toString().trim();
  const parsed = v === '' ? null : +v;
  this.value = (parsed === null || Number.isFinite(parsed)) ? parsed : null;
  this.valueChange.emit(this.value);
}


  trackById(_: number, x: SmartOption) { return x.id; }
}
