import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { WorkItemAction } from '../../core/types';
import { WorkItemActionApiService } from '../../core/api/work-item-action-api.service';

@Component({ selector: 'app-action-outbox', standalone: true, imports: [CommonModule], templateUrl: './action-outbox.component.html', styleUrls: ['./action-outbox.component.scss'] })
export class ActionOutboxComponent implements OnInit {
  rows: WorkItemAction[] = [];
  error: string | null = null;
  source = '';
  actionId = '';
  take = '100';
  failedError = 'External service failed';
  constructor(private api: WorkItemActionApiService) {}
  ngOnInit(): void { this.load(); }
  load() { this.error = null; this.api.pending({ source: this.source, actionId: this.actionId, take: Number(this.take || 100) }).subscribe({ next: rows => this.rows = rows ?? [], error: err => this.error = err?.message ?? 'خطا در دریافت Outbox' }); }
  done(r: WorkItemAction) { this.api.markDone(r.id).subscribe({ next: () => this.load(), error: err => this.error = err?.message ?? 'خطا در Done' }); }
  failed(r: WorkItemAction) { this.api.markFailed(r.id, this.failedError).subscribe({ next: () => this.load(), error: err => this.error = err?.message ?? 'خطا در Failed' }); }
  retry(r: WorkItemAction) { this.api.retry(r.id).subscribe({ next: () => this.load(), error: err => this.error = err?.message ?? 'خطا در Retry' }); }
}
