import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { Process } from '../../../core/types';
import { ProcessApiService } from '../../../core/api/process-api.service';

type ProcessDraft = {
  processKey: string;
  titleFa: string;
  order: string; // از input میاد string
  description: string;
};

@Component({
  selector: 'app-processes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './processes.component.html',
  styleUrls: ['./processes.component.scss'],
})
export class ProcessesComponent implements OnInit {
  rows: Process[] = [];
  editingId: number | null = null;
  error: string | null = null;

  draft: ProcessDraft = this.newDraft();

  constructor(private api: ProcessApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.error = null;
    this.api.list().subscribe({
      next: (rows) => {
        this.rows = rows ?? [];
      },
      error: (err: any) => {
        this.error = err?.message ?? 'خطا در ارتباط با API';
      },
    });
  }

  private newDraft(): ProcessDraft {
    return { processKey: '', titleFa: '', order: '', description: '' };
  }

  reset() {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
  }

  edit(r: Process) {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      processKey: r.processKey,
      titleFa: r.titleFa ?? '',
      order: r.order != null ? String(r.order) : '',
      description: r.description ?? '',
    };
  }

  remove(r: Process) {
    this.error = null;
    this.api.delete(r.id).subscribe({
      next: () => {
        this.rows = this.rows.filter((x) => x.id !== r.id);
        if (this.editingId === r.id) this.reset();
      },
      error: (err: any) => {
        this.error = err?.message ?? 'خطا در حذف';
      },
    });
  }

  submit() {
    this.error = null;

    const processKey = (this.draft.processKey || '').trim();
    if (!processKey) {
      this.error = 'ProcessKey اجباری است.';
      return;
    }

    const dup = this.rows.find(
      (x) => x.processKey.toLowerCase() === processKey.toLowerCase() && x.id !== this.editingId,
    );
    if (dup) {
      this.error = 'ProcessKey تکراری است.';
      return;
    }

    const orderRaw = (this.draft.order || '').trim();
    const orderNum = orderRaw === '' ? undefined : Number(orderRaw);
    if (orderNum != null && Number.isNaN(orderNum)) {
      this.error = 'Order باید عدد باشد.';
      return;
    }

    const payload: Omit<Process, 'id'> = {
      processKey,
      titleFa: (this.draft.titleFa || '').trim() || undefined,
      description: (this.draft.description || '').trim() || undefined,
      order: orderNum,
    };

    if (this.editingId !== null) {
      const id = this.editingId;
      this.api.update(id, payload).subscribe({
        next: (updated) => {
          this.rows = this.rows.map((r) => (r.id === id ? updated : r));
          this.reset();
        },
        error: (err: any) => {
          this.error = err?.message ?? 'خطا در ویرایش';
        },
      });
    } else {
      this.api.create(payload).subscribe({
        next: (created) => {
          this.rows = [created, ...this.rows];
          this.reset();
        },
        error: (err: any) => {
          this.error = err?.message ?? 'خطا در ایجاد';
        },
      });
    }
  }
}
