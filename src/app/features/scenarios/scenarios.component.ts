import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CatalogStoreService } from '../../core/catalog-store.service';
import { Condition, Fact, Scenario, FactChange } from '../../core/types';
import { Process, Stage } from '../../core/types';


const COL_SCENARIOS = 'scenarios';
const COL_CONDS = 'conditions';
const COL_FACTS = 'facts';
const COL_PROCESSES = 'processes';
const COL_STAGES = 'stages';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

type ScenarioDraft = {
  scenarioKey: string;
  titleFa: string;
  stageId: string;          // ✅
  ownerSubdomain: string;
  trigger: string;
  description: string;

  preconditionIds: string[];
  factChanges: FactChange[];
  producedEvents: string[];
};

type FactChangeDraft = {
  factId: string;
  value: string;
};

@Component({
  selector: 'app-scenarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scenarios.component.html',
  styleUrls: ['./scenarios.component.scss'],
})
export class ScenariosComponent
{
  conditions: Condition[] = [];
  facts: Fact[] = [];
  rows: Scenario[] = [];
  processes: Process[] = [];
  stages: Stage[] = [];


  editingId: string | null = null;
  error: string | null = null;

  // filters
  condFilter = '';
  factFilter = '';

  // add factChange mini-form
  fcDraft: FactChangeDraft = { factId: '', value: '' };

  // add event mini-form
  eventDraft = '';

  draft: ScenarioDraft = this.newDraft();

  constructor(private store: CatalogStoreService)
  {
    // init in constructor ✅
    this.conditions = this.store.list<Condition>(COL_CONDS);
    this.facts = this.store.list<Fact>(COL_FACTS);
    this.processes = this.store.list<Process>(COL_PROCESSES);
    this.stages = this.store.list<Stage>(COL_STAGES);

    this.rows = this.store.list<Scenario>(COL_SCENARIOS);

    if (this.facts.length) this.fcDraft.factId = this.facts[0].id;
  }

  private newDraft(): ScenarioDraft
  {
    return {
      scenarioKey: '',
      titleFa: '',
      stageId: this.stages[0]?.id ?? '',
      ownerSubdomain: '',
      trigger: '',
      description: '',
      preconditionIds: [],
      factChanges: [],
      producedEvents: [],
    };
  }


  // -------- filters ----------
  get filteredConditions(): Condition[]
  {
    const q = (this.condFilter || '').trim().toLowerCase();
    if (!q) return this.conditions;
    return this.conditions.filter(c =>
      c.conditionKey.toLowerCase().includes(q) ||
      (c.titleFa ?? '').toLowerCase().includes(q) ||
      (c.expression ?? '').toLowerCase().includes(q)
    );
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

  // -------- condition selection ----------
  isCondSelected(condId: string): boolean
  {
    return this.draft.preconditionIds.includes(condId);
  }

  toggleCond(condId: string)
  {
    if (this.isCondSelected(condId))
    {
      this.draft.preconditionIds = this.draft.preconditionIds.filter(x => x !== condId);
    } else
    {
      this.draft.preconditionIds = [...this.draft.preconditionIds, condId];
    }
  }

  // -------- fact changes ----------
  addFactChange()
  {
    this.error = null;

    const factId = (this.fcDraft.factId || '').trim();
    const value = (this.fcDraft.value || '').trim();

    if (!factId)
    {
      this.error = 'Fact را انتخاب کن.';
      return;
    }
    if (!this.facts.some(f => f.id === factId))
    {
      this.error = 'Fact انتخاب‌شده معتبر نیست.';
      return;
    }
    if (!value)
    {
      this.error = 'Value برای FactChange اجباری است.';
      return;
    }

    // unique by factId داخل سناریو (اگر وجود داشت overwrite)
    const next = this.draft.factChanges.filter(fc => fc.factId !== factId);
    next.unshift({ factId, op: 'Set', value });
    this.draft.factChanges = next;

    this.fcDraft.value = '';
  }

  removeFactChange(factId: string)
  {
    this.draft.factChanges = this.draft.factChanges.filter(fc => fc.factId !== factId);
  }

  factKeyById(factId: string): string
  {
    return this.facts.find(f => f.id === factId)?.factKey ?? '—';
  }

  // -------- produced events ----------
  addEvent()
  {
    this.error = null;
    const ev = (this.eventDraft || '').trim();
    if (!ev) return;

    // unique
    const exists = this.draft.producedEvents.some(x => x.toLowerCase() === ev.toLowerCase());
    if (!exists) this.draft.producedEvents = [ev, ...this.draft.producedEvents];

    this.eventDraft = '';
  }

  removeEvent(ev: string)
  {
    this.draft.producedEvents = this.draft.producedEvents.filter(x => x !== ev);
  }

  // -------- CRUD ----------
  reset()
  {
    this.editingId = null;
    this.error = null;
    this.condFilter = '';
    this.factFilter = '';

    this.draft = this.newDraft();
    this.fcDraft = { factId: this.facts[0]?.id ?? '', value: '' };
    this.eventDraft = '';
  }

  edit(r: Scenario)
  {
    this.editingId = r.id;
    this.error = null;
    this.condFilter = '';
    this.factFilter = '';

    this.draft = {
      scenarioKey: r.scenarioKey,
      titleFa: r.titleFa ?? '',
      stageId: r.stageId ?? '',
      ownerSubdomain: r.ownerSubdomain ?? '',
      trigger: r.trigger ?? '',
      description: r.description ?? '',

      preconditionIds: [...(r.preconditionIds ?? [])],
      factChanges: [...(r.factChanges ?? [])],
      producedEvents: [...(r.producedEvents ?? [])],
    };

    this.fcDraft = { factId: this.facts[0]?.id ?? '', value: '' };
    this.eventDraft = '';
  }

  remove(r: Scenario)
  {
    this.rows = this.rows.filter(x => x.id !== r.id);
    this.store.save(COL_SCENARIOS, this.rows);
    if (this.editingId === r.id) this.reset();
  }

  submit()
  {
    this.error = null;

    const payload: Omit<Scenario, 'id'> = {
      scenarioKey: (this.draft.scenarioKey || '').trim(),
      titleFa: (this.draft.titleFa || '').trim() || undefined, 
      stageId: (this.draft.stageId || '').trim() || undefined,
      ownerSubdomain: (this.draft.ownerSubdomain || '').trim() || undefined,
      trigger: (this.draft.trigger || '').trim() || undefined,
      description: (this.draft.description || '').trim() || undefined,

      preconditionIds: [...(this.draft.preconditionIds ?? [])],
      factChanges: [...(this.draft.factChanges ?? [])],
      producedEvents: [...(this.draft.producedEvents ?? [])],
    };

    if (!payload.scenarioKey)
    {
      this.error = 'ScenarioKey اجباری است.';
      return;
    }

    // unique ScenarioKey
    const dup = this.rows.find(x =>
      x.scenarioKey.toLowerCase() === payload.scenarioKey.toLowerCase() &&
      x.id !== this.editingId
    );
    if (dup)
    {
      this.error = 'ScenarioKey تکراری است.';
      return;
    }

    // sanitize: only valid condition ids
    payload.preconditionIds = payload.preconditionIds.filter(id => this.conditions.some(c => c.id === id));

    // sanitize: only valid fact ids
    payload.factChanges = payload.factChanges
      .filter(fc => this.facts.some(f => f.id === fc.factId))
      .map(fc => ({ ...fc, op: 'Set' as const, value: (fc.value ?? '').toString() }));

    // sanitize events
    payload.producedEvents = (payload.producedEvents ?? [])
      .map(x => x.trim())
      .filter(x => !!x);

    if (this.editingId)
    {
      this.rows = this.rows.map(r => r.id === this.editingId ? ({ ...r, ...payload }) : r);
    } else
    {
      this.rows = [{ id: uid(), ...payload }, ...this.rows];
    }

    this.store.save(COL_SCENARIOS, this.rows);
    this.reset();
  }

  // list helpers
  condCountText(ids: string[]): string
  {
    return `${(ids?.length ?? 0)}`;
  }

  factChangeCountText(changes: FactChange[]): string
  {
    return `${(changes?.length ?? 0)}`;
  }

  eventCountText(events: string[]): string
  {
    return `${(events?.length ?? 0)}`;
  }
  stageKeyById(stageId: string): string
  {
    return this.stages.find(s => s.id === stageId)?.stageKey ?? '—';
  }

}
