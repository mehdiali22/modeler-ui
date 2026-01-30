import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Process, Stage } from '../../../core/types';
import { StageApiService } from '../../../core/api/stage-api.service';
import { ProcessApiService } from '../../../core/api/process-api.service';
import { forkJoin } from 'rxjs';
type StageDraft = {
  processId: number;
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
export class StagesComponent implements OnInit
{
  processes: Process[] = [];
  rows: Stage[] = [];

  editingId: number | null = null;
  error: string | null = null;

  draft: StageDraft = this.newDraft();

  constructor(private stagesApi: StageApiService, private processesApi: ProcessApiService) {}


  ngOnInit(): void
  {
    this.load();
  }

load()
{
  this.error = null;
  forkJoin({
    stages: this.stagesApi.list(),
    processes: this.processesApi.list(),
  }).subscribe({
    next: res =>
    {
      this.rows = res.stages ?? [];
      this.processes = res.processes ?? [];
    },
    error: err => { this.error = (err?.message ?? 'خطا در ارتباط با API'); }
  });
}
private newDraft(): StageDraft
  {
    return { processId: 0, stageKey: '', titleFa: '', order: '', description: '' };
  }

  processKeyById(id: number): string
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
    this.error = null;
    this.stagesApi.delete(r.id).subscribe({
      next: () => {
        this.rows = this.rows.filter(x => x.id !== r.id);
        if (this.editingId === r.id) this.reset();
      },
      error: err => { this.error = (err?.message ?? 'خطا در حذف'); }
    });
  }

  submit()
  {
    this.error = null;

    const processId = this.draft.processId;
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

            if (this.editingId !== null)
            {
              const id = this.editingId;
              this.stagesApi.update(id, payload).subscribe({
                next: updated => {
                  this.rows = this.rows.map(r => r.id === id ? updated : r);
                  this.reset();
                },
                error: err => { this.error = (err?.message ?? 'خطا در ویرایش'); }
              });
            } else
            {
              this.stagesApi.create(payload).subscribe({
                next: created => {
                  this.rows = [created, ...this.rows];
                  this.reset();
                },
                error: err => { this.error = (err?.message ?? 'خطا در ایجاد'); }
              });
            }
          }


}
