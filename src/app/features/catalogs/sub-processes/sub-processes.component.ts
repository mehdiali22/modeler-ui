import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Process, SubProcess } from '../../../core/types';
import { ProcessApiService } from '../../../core/api/process-api.service';
import { SubProcessApiService } from '../../../core/api/sub-process-api.service';

type SubProcessDraft = {
  processId: number;
  subProcessKey: string;
  titleFa: string;
  order: string;
  description: string;
};

@Component({
  selector: 'app-sub-processes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sub-processes.component.html',
  styleUrls: ['./sub-processes.component.scss'],
})
export class SubProcessesComponent implements OnInit {
  processes: Process[] = [];
  rows: SubProcess[] = [];

  editingId: number | null = null;
  error: string | null = null;

  draft: SubProcessDraft = this.newDraft();

  constructor(
    private processesApi: ProcessApiService,
    private subProcessesApi: SubProcessApiService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error = null;
    forkJoin({
      processes: this.processesApi.list(),
      subProcesses: this.subProcessesApi.list(),
    }).subscribe({
      next: res => {
        this.processes = res.processes ?? [];
        this.rows = res.subProcesses ?? [];
        if (!this.draft.processId && this.processes.length) this.draft.processId = this.processes[0].id;
      },
      error: err => { this.error = (err?.message ?? 'خطا در ارتباط با API'); },
    });
  }

  private newDraft(): SubProcessDraft {
    return { processId: 0, subProcessKey: '', titleFa: '', order: '', description: '' };
  }

  processKeyById(id: number): string {
    return this.processes.find(p => p.id === id)?.processKey ?? '—';
  }

  reset(): void {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
    if (this.processes.length) this.draft.processId = this.processes[0].id;
  }

  edit(r: SubProcess): void {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      processId: r.processId,
      subProcessKey: r.subProcessKey,
      titleFa: r.titleFa ?? '',
      order: r.order != null ? String(r.order) : '',
      description: r.description ?? '',
    };
  }

  remove(r: SubProcess): void {
    this.error = null;
    this.subProcessesApi.delete(r.id).subscribe({
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

    const subProcessKey = (this.draft.subProcessKey || '').trim();
    if (!subProcessKey) { this.error = 'SubProcessKey اجباری است.'; return; }

    const dup = this.rows.find(x =>
      x.subProcessKey.toLowerCase() === subProcessKey.toLowerCase() && x.id !== this.editingId
    );
    if (dup) { this.error = 'SubProcessKey تکراری است.'; return; }

    const orderNum = (this.draft.order || '').trim() === '' ? undefined : Number(this.draft.order);
    if (orderNum != null && Number.isNaN(orderNum)) { this.error = 'Order باید عدد باشد.'; return; }

    const payload: Omit<SubProcess, 'id'> = {
      processId,
      subProcessKey,
      titleFa: (this.draft.titleFa || '').trim() || undefined,
      description: (this.draft.description || '').trim() || undefined,
      order: orderNum,
    };

    if (this.editingId !== null) {
      const id = this.editingId;
      this.subProcessesApi.update(id, payload).subscribe({
        next: updated => {
          this.rows = this.rows.map(r => r.id === id ? updated : r);
          this.reset();
        },
        error: err => { this.error = (err?.message ?? 'خطا در ویرایش'); },
      });
    } else {
      this.subProcessesApi.create(payload).subscribe({
        next: created => {
          this.rows = [created, ...this.rows];
          this.reset();
        },
        error: err => { this.error = (err?.message ?? 'خطا در ایجاد'); },
      });
    }
  }
}
