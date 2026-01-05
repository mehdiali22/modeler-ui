import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Condition, Fact } from '../../../core/types';
import { CatalogStoreService } from '../../../core/catalog-store.service';

const COL_CONDS = 'conditions';
const COL_FACTS = 'facts';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

type ConditionDraft = {
  conditionKey: string;
  titleFa: string;
  expression: string;
  failMessage: string;
  factIdsUsed: string[];
};

@Component({
  selector: 'app-conditions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conditions.component.html',
  styleUrls: ['./conditions.component.scss'],
})
export class ConditionsComponent
{
  facts: Fact[] = [];
  rows: Condition[] = [];
  editingId: string | null = null;

  draft: ConditionDraft = this.newDraft();
  error: string | null = null;

  factFilter = '';

  constructor(private store: CatalogStoreService)
  {
    // init in constructor ✅
    this.facts = this.store.list<Fact>(COL_FACTS);
    this.rows = this.store.list<Condition>(COL_CONDS);
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

  isFactSelected(factId: string): boolean
  {
    return this.draft.factIdsUsed.includes(factId);
  }

  toggleFact(factId: string)
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
    this.rows = this.rows.filter(x => x.id !== r.id);
    this.store.save(COL_CONDS, this.rows);
    if (this.editingId === r.id) this.reset();
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

    if (!payload.conditionKey)
    {
      this.error = 'ConditionKey اجباری است.';
      return;
    }
    if (!payload.expression)
    {
      this.error = 'Expression اجباری است.';
      return;
    }

    // Unique ConditionKey
    const dup = this.rows.find(x =>
      x.conditionKey.toLowerCase() === payload.conditionKey.toLowerCase() &&
      x.id !== this.editingId
    );
    if (dup)
    {
      this.error = 'ConditionKey تکراری است.';
      return;
    }

    // keep only valid fact ids
    payload.factIdsUsed = payload.factIdsUsed.filter(id => this.facts.some(f => f.id === id));

    if (this.editingId)
    {
      this.rows = this.rows.map(r => r.id === this.editingId ? ({ ...r, ...payload }) : r);
    } else
    {
      this.rows = [{ id: uid(), ...payload }, ...this.rows];
    }

    this.store.save(COL_CONDS, this.rows);
    this.reset();
  }

  factsUsedText(ids: string[]): string
  {
    if (!ids?.length) return '—';
    const keys = ids
      .map(id => this.facts.find(f => f.id === id)?.factKey)
      .filter(Boolean) as string[];

    return keys.slice(0, 3).join('، ') + (keys.length > 3 ? ` (+${keys.length - 3})` : '');
  }
}
