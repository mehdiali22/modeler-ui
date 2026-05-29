import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Kartabl, WorkItem, WorkItemAction } from '../../core/types';
import { KartablApiService } from '../../core/api/kartabl-api.service';
import { WorkItemApiService } from '../../core/api/work-item-api.service';
import { SmartOption, SmartSelectComponent } from '../../shared/smart-select/smart-select.component';

type WorkItemEdit = Omit<WorkItem, 'id'> & { id?: number; currentKartablId?: number | null };

@Component({
  selector: 'app-work-items',
  standalone: true,
  imports: [CommonModule, SmartSelectComponent],
  templateUrl: './work-items.component.html',
  styleUrls: ['./work-items.component.scss'],
})
export class WorkItemsComponent implements OnInit {
  rows: WorkItem[] = [];
  kartabls: Kartabl[] = [];
  kartablOptions: SmartOption[] = [];
  q = '';
  error: string | null = null;
  message: string | null = null;
  edit: WorkItemEdit | null = null;
  selected: WorkItem | null = null;
  actions: WorkItemAction[] = [];
  jsonError: string | null = null;

  constructor(private workItemApi: WorkItemApiService, private kartablApi: KartablApiService) {}

  ngOnInit(): void { this.reload(); }

  reload() {
    this.error = null;
    forkJoin({ items: this.workItemApi.list(), kartabls: this.kartablApi.list() }).subscribe({
      next: res => {
        this.rows = res.items ?? [];
        this.kartabls = res.kartabls ?? [];
        this.kartablOptions = this.kartabls.map(k => ({ id: k.id, text: k.kartablKey, sub: k.titleFa ?? '' }));
      },
      error: err => this.error = err?.error ?? err?.message ?? 'خطا در دریافت WorkItemها',
    });
  }

  get filtered(): WorkItem[] {
    const q = this.q.trim().toLowerCase();
    if (!q) return this.rows;
    return this.rows.filter(x => `${x.workItemKey} ${x.title ?? ''} ${x.ownerSubdomain ?? ''} ${x.referenceNo ?? ''} ${x.caseId ?? ''} ${x.caseStatus ?? ''}`.toLowerCase().includes(q));
  }

  kartablTitle(id: number | null | undefined): string {
    if (!id) return '—';
    const k = this.kartabls.find(x => x.id === id);
    return k ? `${k.kartablKey}${k.titleFa ? ' — ' + k.titleFa : ''}` : String(id);
  }

  add() {
    this.message = null;
    this.error = null;
    const kId = this.kartabls[0]?.id ?? null;
    const facts = { CaseStatus: 'Draft', CurrentKartablId: kId };
    this.edit = {
      workItemKey: `WI_${new Date().getTime()}`,
      title: 'پرونده جدید',
      ownerSubdomain: 'case',
      currentKartablId: kId,
      caseStatus: 'Draft',
      referenceNo: '',
      caseId: '',
      factsJson: JSON.stringify(facts, null, 2),
    };
  }

  editRow(row: WorkItem) {
    this.message = null;
    this.error = null;
    this.jsonError = null;
    this.edit = structuredClone(row) as WorkItemEdit;
    this.edit.factsJson = this.prettyJson(this.edit.factsJson || '{}');
  }

  cancel() { this.edit = null; this.jsonError = null; }

  save() {
    if (!this.edit) return;
    this.message = null;
    this.error = null;
    const normalized = this.normalizeJson(this.edit.factsJson || '{}');
    if (!normalized.ok) { this.jsonError = normalized.error; return; }
    this.jsonError = null;
    const payload: Omit<WorkItem, 'id'> = {
      workItemKey: (this.edit.workItemKey || '').trim(),
      title: this.edit.title?.trim() || undefined,
      ownerSubdomain: (this.edit.ownerSubdomain || '').trim(),
      currentKartablId: this.edit.currentKartablId || null,
      factsJson: normalized.value,
      caseStatus: this.edit.caseStatus?.trim() || undefined,
      referenceNo: this.edit.referenceNo?.trim() || undefined,
      caseId: this.edit.caseId?.trim() || undefined,
    };
    if (!payload.workItemKey) { this.error = 'WorkItemKey الزامی است.'; return; }
    if (!payload.ownerSubdomain) { this.error = 'OwnerSubdomain الزامی است.'; return; }

    const req = this.edit.id ? this.workItemApi.update(this.edit.id, payload) : this.workItemApi.create(payload);
    req.subscribe({
      next: saved => { this.message = 'ذخیره شد.'; this.edit = null; this.reload(); this.select(saved); },
      error: err => this.error = err?.error ?? err?.message ?? 'خطا در ذخیره WorkItem',
    });
  }

  remove(row: WorkItem) {
    if (!confirm(`حذف شود؟ ${row.workItemKey}`)) return;
    this.workItemApi.delete(row.id).subscribe({
      next: () => { this.message = 'حذف شد.'; if (this.selected?.id === row.id) this.selected = null; this.reload(); },
      error: err => this.error = err?.error ?? err?.message ?? 'خطا در حذف WorkItem',
    });
  }

  select(row: WorkItem) {
    this.selected = row;
    this.actions = [];
    this.workItemApi.actions(row.id).subscribe({
      next: rows => this.actions = rows ?? [],
      error: err => this.error = err?.error ?? err?.message ?? 'خطا در دریافت Actionهای WorkItem',
    });
  }

  syncFactsFromFields() {
    if (!this.edit) return;
    const parsed = this.normalizeJson(this.edit.factsJson || '{}', false);
    const obj: any = parsed.object ?? {};
    if (this.edit.caseStatus) obj.CaseStatus = this.edit.caseStatus;
    if (this.edit.currentKartablId) obj.CurrentKartablId = this.edit.currentKartablId;
    this.edit.factsJson = JSON.stringify(obj, null, 2);
    this.jsonError = null;
  }

  prettyFacts(row: WorkItem): string { return this.prettyJson(row.factsJson || '{}'); }
  prettyJson(input: string): string { try { return JSON.stringify(JSON.parse(input || '{}'), null, 2); } catch { return input || '{}'; } }
  normalizeJson(input: string, requireValid = true): { ok: boolean; value: string; error: string | null; object?: any } {
    try { const obj = JSON.parse(input || '{}'); return { ok: true, value: JSON.stringify(obj), error: null, object: obj }; }
    catch (e: any) { return { ok: !requireValid, value: input, error: e?.message ?? 'JSON نامعتبر است.' }; }
  }
}
