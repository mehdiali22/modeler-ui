import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Condition, Fact } from '../../../core/types';
import { ConditionApiService } from '../../../core/api/condition-api.service';
import { FactApiService } from '../../../core/api/fact-api.service';
import { forkJoin } from 'rxjs';
type ConditionDraft = {
  conditionKey: string;
  titleFa: string;
  expression: string;
  failMessage: string;
  factIdsUsed: number[];
};

@Component({
  selector: 'app-conditions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conditions.component.html',
  styleUrls: ['./conditions.component.scss'],
})
export class ConditionsComponent implements OnInit
{
  facts: Fact[] = [];
  rows: Condition[] = [];
  editingId: number | null = null;

  draft: ConditionDraft = this.newDraft();
  error: string | null = null;

  factFilter = '';

  constructor(private condsApi: ConditionApiService, private factsApi: FactApiService) {}


  ngOnInit(): void
  {
    this.load();
  }

load()
{
  this.error = null;
  forkJoin({
    conditions: this.condsApi.list(),
    facts: this.factsApi.list(),
  }).subscribe({
    next: res =>
    {
      this.rows = res.conditions ?? [];
      this.facts = res.facts ?? [];
    },
    error: err => { this.error = (err?.message ?? 'خطا در ارتباط با API'); }
  });
}
private newDraft(): ConditionDraft
  {
    return {
      conditionKey: '',
      titleFa: '',
      expression: '',
      failMessage: '',
      factIdsUsed: [],
    };
  }

  get filteredFacts(): Fact[]
  {
    const q = (this.factFilter || '').trim().toLowerCase();
    if (!q) return this.facts;
    return this.facts.filter(f =>
      f.factKey.toLowerCase().includes(q) ||
      (f.meaning ?? '').toLowerCase().includes(q)
    );
  }

  isFactSelected(factId: number): boolean
  {
    return this.draft.factIdsUsed.includes(factId);
  }

  toggleFact(factId: number)
  {
    if (this.isFactSelected(factId))
    {
      this.draft.factIdsUsed = this.draft.factIdsUsed.filter(x => x !== factId);
    } else
    {
      this.draft.factIdsUsed = [...this.draft.factIdsUsed, factId];
    }
  }

  reset()
  {
    this.editingId = null;
    this.error = null;
    this.factFilter = '';
    this.draft = this.newDraft();
  }

  edit(r: Condition)
  {
    this.editingId = r.id;
    this.error = null;
    this.factFilter = '';
    this.draft = {
      conditionKey: r.conditionKey,
      titleFa: r.titleFa ?? '',
      expression: r.expression,
      failMessage: r.failMessage ?? '',
      factIdsUsed: [...(r.factIdsUsed ?? [])],
    };
  }

  remove(r: Condition)
  {
    this.error = null;
    this.condsApi.delete(r.id).subscribe({
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

            const payload: Omit<Condition, 'id'> = {
  conditionKey: (this.draft.conditionKey || '').trim(),
  titleFa: (this.draft.titleFa || '').trim() || undefined,
  expression: (this.draft.expression || '').trim(),
  failMessage: (this.draft.failMessage || '').trim() || undefined,
  factIdsUsed: [...(this.draft.factIdsUsed ?? [])],
};

            if (this.editingId !== null)
            {
              const id = this.editingId;
              this.condsApi.update(id, payload).subscribe({
                next: updated => {
                  this.rows = this.rows.map(r => r.id === id ? updated : r);
                  this.reset();
                },
                error: err => { this.error = (err?.message ?? 'خطا در ویرایش'); }
              });
            } else
            {
              this.condsApi.create(payload).subscribe({
                next: created => {
                  this.rows = [created, ...this.rows];
                  this.reset();
                },
                error: err => { this.error = (err?.message ?? 'خطا در ایجاد'); }
              });
            }
          }

  factsUsedText(ids: number[]): string
  {
    if (!ids?.length) return '—';
    const keys = ids
      .map(id => this.facts.find(f => f.id === id)?.factKey)
      .filter(Boolean) as string[];

    return keys.slice(0, 3).join('، ') + (keys.length > 3 ? ` (+${keys.length - 3})` : '');
  }
}
