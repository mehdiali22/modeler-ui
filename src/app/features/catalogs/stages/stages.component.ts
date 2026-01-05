import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CatalogStoreService } from '../../../core/catalog-store.service';
import { Process, Stage } from '../../../core/types';

const COL_STAGES = 'stages';
const COL_PROCESSES = 'processes';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

type StageDraft = {
  processId: string;
  stageKey: string;
  titleFa: string;
  order: string;
  description: string;
};

@Component({
  selector: 'app-stages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stages.component.html',
  styleUrls: ['./stages.component.scss'],
})
export class StagesComponent
{
  processes: Process[] = [];
  rows: Stage[] = [];

  editingId: string | null = null;
  error: string | null = null;

  draft: StageDraft = this.newDraft();

  constructor(private store: CatalogStoreService)
  {
    this.processes = this.store.list<Process>(COL_PROCESSES);
    this.rows = this.store.list<Stage>(COL_STAGES);

    if (this.processes.length) this.draft.processId = this.processes[0].id;
  }

  private newDraft(): StageDraft
  {
    return { processId: '', stageKey: '', titleFa: '', order: '', description: '' };
  }

  processKeyById(id: string): string
  {
    return this.processes.find(p => p.id === id)?.processKey ?? '—';
  }

  reset()
  {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
    if (this.processes.length) this.draft.processId = this.processes[0].id;
  }

  edit(r: Stage)
  {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      processId: r.processId,
      stageKey: r.stageKey,
      titleFa: r.titleFa ?? '',
      order: r.order != null ? String(r.order) : '',
      description: r.description ?? '',
    };
  }

  remove(r: Stage)
  {
    this.rows = this.rows.filter(x => x.id !== r.id);
    this.store.save(COL_STAGES, this.rows);
    if (this.editingId === r.id) this.reset();
  }

  submit()
  {
    this.error = null;

    const processId = (this.draft.processId || '').trim();
    if (!processId) { this.error = 'Process را انتخاب کن.'; return; }
    if (!this.processes.some(p => p.id === processId)) { this.error = 'Process انتخاب‌شده معتبر نیست.'; return; }

    const stageKey = (this.draft.stageKey || '').trim();
    if (!stageKey) { this.error = 'StageKey اجباری است.'; return; }

    const dup = this.rows.find(x =>
      x.stageKey.toLowerCase() === stageKey.toLowerCase() && x.id !== this.editingId
    );
    if (dup) { this.error = 'StageKey تکراری است.'; return; }

    const orderNum = (this.draft.order || '').trim() === '' ? undefined : Number(this.draft.order);
    if (orderNum != null && Number.isNaN(orderNum)) { this.error = 'Order باید عدد باشد.'; return; }

    const payload: Omit<Stage, 'id'> = {
      processId,
      stageKey,
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

    this.store.save(COL_STAGES, this.rows);
    this.reset();
  }


}
