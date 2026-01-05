import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CatalogStoreService } from '../../../core/catalog-store.service';
import { Process } from '../../../core/types';

const COL = 'processes';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

type ProcessDraft = {
  processKey: string;
  titleFa: string;
  order: string; // از input میاد string، خودمون تبدیل می‌کنیم
  description: string;
};

@Component({
  selector: 'app-processes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './processes.component.html',
  styleUrls: ['./processes.component.scss'],
})
export class ProcessesComponent
{
  rows: Process[] = [];
  editingId: string | null = null;

  draft: ProcessDraft = this.newDraft();
  error: string | null = null;

  constructor(private store: CatalogStoreService)
  {
    this.rows = this.store.list<Process>(COL);
  }

  private newDraft(): ProcessDraft
  {
    return { processKey: '', titleFa: '', order: '', description: '' };
  }

  reset()
  {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
  }

  edit(r: Process)
  {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      processKey: r.processKey,
      titleFa: r.titleFa ?? '',
      order: r.order != null ? String(r.order) : '',
      description: r.description ?? '',
    };
  }

  remove(r: Process)
  {
    this.rows = this.rows.filter(x => x.id !== r.id);
    this.store.save(COL, this.rows);
    if (this.editingId === r.id) this.reset();
  }

  submit()
  {
    this.error = null;

    const processKey = (this.draft.processKey || '').trim();
    if (!processKey) { this.error = 'ProcessKey اجباری است.'; return; }

    const dup = this.rows.find(x =>
      x.processKey.toLowerCase() === processKey.toLowerCase() && x.id !== this.editingId
    );
    if (dup) { this.error = 'ProcessKey تکراری است.'; return; }

    const orderNum = (this.draft.order || '').trim() === '' ? undefined : Number(this.draft.order);
    if (orderNum != null && Number.isNaN(orderNum)) { this.error = 'Order باید عدد باشد.'; return; }

    const payload: Omit<Process, 'id'> = {
      processKey,
      titleFa: (this.draft.titleFa || '').trim() || undefined,
      description: (this.draft.description || '').trim() || undefined,
      order: orderNum,
    };

    if (this.editingId)
    {
      this.rows = this.rows.map(r => r.id === this.editingId ? ({ ...r, ...payload }) : r);
    } else
    {
      this.rows = [{ id: uid(), ...payload }, ...this.rows];
    }

    this.store.save(COL, this.rows);
    this.reset();
  }
}
