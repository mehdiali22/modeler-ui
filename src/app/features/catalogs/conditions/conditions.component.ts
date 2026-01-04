import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Condition, Fact, ModelContext } from '../../../core/types';
import { ModelContextService } from '../../../core/model-context.service';
import { VersionedStoreService } from '../../../core/versioned-store.service';

const COL_CONDS = 'conditions';
const COL_FACTS = 'facts';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

@Component({
  selector: 'app-conditions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './conditions.component.html',
  styleUrls: ['./conditions.component.scss'],
})
export class ConditionsComponent
{
  ctx!: ModelContext;

  facts: Fact[] = [];
  rows: Condition[] = [];
  editingId: string | null = null;

  factFilter = '';

  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private ctxService: ModelContextService,
    private store: VersionedStoreService,
    private router: Router
  )
  {
    // ✅ form باید اینجا ساخته شود
    this.form = this.fb.group({
      conditionKey: ['', [Validators.required, Validators.maxLength(150)]],
      titleFa: ['', [Validators.maxLength(250)]],
      expression: ['', [Validators.required]],
      failMessage: ['', [Validators.maxLength(500)]],
      factIdsUsed: [[] as string[]],
    });

    const ctx = this.ctxService.current;
    if (!ctx)
    {
      queueMicrotask(() => this.router.navigateByUrl('/model'));
      return;
    }
    this.ctx = ctx;

    this.facts = this.store.list<Fact>(this.ctx, COL_FACTS) ?? [];
    this.rows = this.store.list<Condition>(this.ctx, COL_CONDS) ?? [];
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

  toggleFact(factId: string)
  {
    const cur: string[] = (this.form.value.factIdsUsed as string[]) ?? [];
    const next = cur.includes(factId)
      ? cur.filter((x: string) => x !== factId)
      : [...cur, factId];

    this.form.patchValue({ factIdsUsed: next });
  }

  isFactSelected(factId: string): boolean
  {
    return (this.form.value.factIdsUsed ?? []).includes(factId);
  }

  submit()
  {
    if (!this.ctx)
    {
      this.router.navigateByUrl('/model');
      return;
    }

    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    const payload: Omit<Condition, 'id'> = {
      conditionKey: (v.conditionKey ?? '').trim(),
      titleFa: (v.titleFa ?? '').trim() || undefined,
      expression: (v.expression ?? '').trim(),
      failMessage: (v.failMessage ?? '').trim() || undefined,
      factIdsUsed: [...(v.factIdsUsed ?? [])],
    };

    if (!payload.conditionKey || !payload.expression) return;

    // Unique ConditionKey per version
    const dup = this.rows.find(x =>
      x.conditionKey.toLowerCase() === payload.conditionKey.toLowerCase() &&
      x.id !== this.editingId
    );
    if (dup) return;

    // facts must exist (drop invalid ids)
    payload.factIdsUsed = payload.factIdsUsed.filter(id => this.facts.some(f => f.id === id));

    if (this.editingId)
    {
      this.rows = this.rows.map(r => r.id === this.editingId ? ({ ...r, ...payload }) : r);
    } else
    {
      this.rows = [{ id: uid(), ...payload }, ...this.rows];
    }

    this.store.save(this.ctx, COL_CONDS, this.rows);
    this.reset();
  }

  edit(r: Condition)
  {
    this.editingId = r.id;
    this.form.setValue({
      conditionKey: r.conditionKey,
      titleFa: r.titleFa ?? '',
      expression: r.expression,
      failMessage: r.failMessage ?? '',
      factIdsUsed: r.factIdsUsed ?? [],
    });
  }

  remove(r: Condition)
  {
    if (!this.ctx) return;
    this.rows = this.rows.filter(x => x.id !== r.id);
    this.store.save(this.ctx, COL_CONDS, this.rows);
    if (this.editingId === r.id) this.reset();
  }

  reset()
  {
    this.editingId = null;
    this.factFilter = '';
    this.form.reset({
      conditionKey: '',
      titleFa: '',
      expression: '',
      failMessage: '',
      factIdsUsed: [],
    });
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
