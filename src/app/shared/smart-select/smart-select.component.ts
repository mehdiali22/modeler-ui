import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type SmartOption = { id: string; text: string; sub?: string };

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

  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

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

  onPick(v: string)
  {
    this.value = v;
    this.valueChange.emit(v);
  }

  trackById(_: number, x: SmartOption) { return x.id; }
}
