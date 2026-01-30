import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { EventDefinition } from '../../../core/types';
import { EventApiService } from '../../../core/api/event-api.service';

type EventDraft = {
  eventKey: string;
  titleFa: string;
  description: string;
};

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent implements OnInit {
  rows: EventDefinition[] = [];
  editingId: number | null = null;
  error: string | null = null;

  draft: EventDraft = this.newDraft();

  constructor(private api: EventApiService) {}

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

  private newDraft(): EventDraft {
    return { eventKey: '', titleFa: '', description: '' };
  }

  reset() {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
  }

  edit(r: EventDefinition) {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      eventKey: r.eventKey,
      titleFa: r.titleFa ?? '',
      description: r.description ?? '',
    };
  }

  remove(r: EventDefinition) {
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

    const eventKey = (this.draft.eventKey || '').trim();
    if (!eventKey) {
      this.error = 'EventKey اجباری است.';
      return;
    }

    const dup = this.rows.find(
      (x) => x.eventKey.toLowerCase() === eventKey.toLowerCase() && x.id !== this.editingId,
    );
    if (dup) {
      this.error = 'EventKey تکراری است.';
      return;
    }

    const payload: Omit<EventDefinition, 'id'> = {
      eventKey,
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
