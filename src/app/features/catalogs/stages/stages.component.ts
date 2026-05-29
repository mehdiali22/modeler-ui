import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Process, Stage, SubProcess } from '../../../core/types';
import { StageApiService } from '../../../core/api/stage-api.service';
import { ProcessApiService } from '../../../core/api/process-api.service';
import { SubProcessApiService } from '../../../core/api/sub-process-api.service';

type StageDraft = {
  processId: number;
  subProcessId: number | null;
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
export class StagesComponent implements OnInit {
  processes: Process[] = [];
  subProcesses: SubProcess[] = [];
  rows: Stage[] = [];

  editingId: number | null = null;
  error: string | null = null;

  draft: StageDraft = this.newDraft();

  constructor(
    private stagesApi: StageApiService,
    private processesApi: ProcessApiService,
    private subProcessesApi: SubProcessApiService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error = null;
    forkJoin({
      stages: this.stagesApi.list(),
      processes: this.processesApi.list(),
      subProcesses: this.subProcessesApi.list(),
    }).subscribe({
      next: res => {
        this.rows = res.stages ?? [];
        this.processes = res.processes ?? [];
        this.subProcesses = res.subProcesses ?? [];
        if (!this.draft.processId && this.processes.length) this.draft.processId = this.processes[0].id;
      },
      error: err => { this.error = (err?.message ?? 'خطا در ارتباط با API'); },
    });
  }

  private newDraft(): StageDraft {
    return { processId: 0, subProcessId: null, stageKey: '', titleFa: '', order: '', description: '' };
  }

  get filteredSubProcesses(): SubProcess[] {
    return this.subProcesses.filter(x => x.processId === this.draft.processId);
  }

  onProcessChanged(value: string): void {
    this.draft.processId = Number(value);
    if (this.draft.subProcessId && !this.filteredSubProcesses.some(x => x.id === this.draft.subProcessId)) {
      this.draft.subProcessId = null;
    }
  }

  processKeyById(id: number): string {
    return this.processes.find(p => p.id === id)?.processKey ?? '—';
  }

  subProcessKeyById(id?: number | null): string {
    if (!id) return '—';
    return this.subProcesses.find(s => s.id === id)?.subProcessKey ?? '—';
  }

  reset(): void {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
    if (this.processes.length) this.draft.processId = this.processes[0].id;
  }

  edit(r: Stage): void {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      processId: r.processId,
      subProcessId: r.subProcessId ?? null,
      stageKey: r.stageKey,
      titleFa: r.titleFa ?? '',
      order: r.order != null ? String(r.order) : '',
      description: r.description ?? '',
    };
  }

  remove(r: Stage): void {
    this.error = null;
    this.stagesApi.delete(r.id).subscribe({
      next: () => {
        this.rows = this.rows.filter(x => x.id !== r.id);
        if (this.editingId === r.id) this.reset();
      },
      error: err => { this.error = (err?.message ?? 'خطا در حذف'); },
    });
  }

  submit(): void {
    this.error = null;

    const processId = this.draft.processId;
    if (!processId) { this.error = 'Process را انتخاب کن.'; return; }
    if (!this.processes.some(p => p.id === processId)) { this.error = 'Process انتخاب‌شده معتبر نیست.'; return; }

    const subProcessId = this.draft.subProcessId || null;
    if (subProcessId) {
      const sp = this.subProcesses.find(x => x.id === subProcessId);
      if (!sp) { this.error = 'SubProcess انتخاب‌شده معتبر نیست.'; return; }
      if (sp.processId !== processId) { this.error = 'SubProcess باید متعلق به Process انتخاب‌شده باشد.'; return; }
    }

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
      subProcessId,
      stageKey,
      titleFa: (this.draft.titleFa || '').trim() || undefined,
      description: (this.draft.description || '').trim() || undefined,
      order: orderNum,
    };

    if (this.editingId !== null) {
      const id = this.editingId;
      this.stagesApi.update(id, payload).subscribe({
        next: updated => {
          this.rows = this.rows.map(r => r.id === id ? updated : r);
          this.reset();
        },
        error: err => { this.error = (err?.message ?? 'خطا در ویرایش'); },
      });
    } else {
      this.stagesApi.create(payload).subscribe({
        next: created => {
          this.rows = [created, ...this.rows];
          this.reset();
        },
        error: err => { this.error = (err?.message ?? 'خطا در ایجاد'); },
      });
    }
  }
}
