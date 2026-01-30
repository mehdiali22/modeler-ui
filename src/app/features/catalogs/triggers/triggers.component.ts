import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { TriggerDefinition } from '../../../core/types';
import { TriggerApiService } from '../../../core/api/trigger-api.service';

type TriggerDraft = {
  triggerKey: string;
  titleFa: string;
  description: string;
};

@Component({
  selector: 'app-triggers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './triggers.component.html',
  styleUrls: ['./triggers.component.scss'],
})
export class TriggersComponent implements OnInit {
  rows: TriggerDefinition[] = [];
  editingId: number | null = null;
  error: string | null = null;

  draft: TriggerDraft = this.newDraft();

  constructor(private api: TriggerApiService) {}

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

  private newDraft(): TriggerDraft {
    return { triggerKey: '', titleFa: '', description: '' };
  }

  reset() {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
  }

  edit(r: TriggerDefinition) {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      triggerKey: r.triggerKey,
      titleFa: r.titleFa ?? '',
      description: r.description ?? '',
    };
  }

  remove(r: TriggerDefinition) {
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

    const triggerKey = (this.draft.triggerKey || '').trim();
    if (!triggerKey) {
      this.error = 'TriggerKey اجباری است.';
      return;
    }

    const dup = this.rows.find(
      (x) => x.triggerKey.toLowerCase() === triggerKey.toLowerCase() && x.id !== this.editingId,
    );
    if (dup) {
      this.error = 'TriggerKey تکراری است.';
      return;
    }

    const payload: Omit<TriggerDefinition, 'id'> = {
      triggerKey,
      titleFa: (this.draft.titleFa || '').trim() || undefined,
      description: (this.draft.description || '').trim() || undefined,
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
