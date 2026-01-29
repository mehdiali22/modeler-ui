import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { CatalogStoreService } from '../../core/catalog-store.service';
import
  {
    ActionDefinition,
    Condition,
    EventDefinition,
    Scenario,
    Stage,
    TriggerDefinition,
  } from '../../core/types';

import { SmartSelectComponent, SmartOption } from '../../shared/smart-select/smart-select.component';
import { RefMultiSelectComponent, RefOption } from '../../shared/ref-multi-select/ref-multi-select.component';

const COL_STAGES = 'stages';
const COL_TRIGGERS = 'triggers';
const COL_EVENTS = 'events';
const COL_CONDS = 'conditions';
const COL_ACTIONS = 'actions';
const COL_SCENARIOS = 'scenarios';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

type DecisionAny = any;

@Component({
  selector: 'app-scenarios',
  standalone: true,
  imports: [CommonModule, SmartSelectComponent, RefMultiSelectComponent],
  templateUrl: './scenarios.component.html',
  styleUrls: ['./scenarios.component.scss'],
})
export class ScenariosComponent
{
  stages: Stage[] = [];
  triggers: TriggerDefinition[] = [];
  events: EventDefinition[] = [];
  conditions: Condition[] = [];
  actionsCatalog: ActionDefinition[] = [];

  rows: Scenario[] = [];

  editingId: string | null = null;
  edit: Scenario | null = null;

  // options for pickers
  stageOptions: SmartOption[] = [];
  triggerOptions: SmartOption[] = [];
  condOptions: RefOption[] = [];
  eventOptions: RefOption[] = [];
  actionOptions: SmartOption[] = [];

  uiActionKeys: string[] = []; // برای dropdown تصمیم‌ها

  constructor(private store: CatalogStoreService)
  {
    this.reload();
  }

  reload()
  {
    this.stages = this.store.list<Stage>(COL_STAGES);
    this.triggers = this.store.list<TriggerDefinition>(COL_TRIGGERS);
    this.events = this.store.list<EventDefinition>(COL_EVENTS);
    this.conditions = this.store.list<Condition>(COL_CONDS);
    this.actionsCatalog = this.store.list<ActionDefinition>(COL_ACTIONS);

    this.rows = this.store.list<Scenario>(COL_SCENARIOS);

    this.buildOptions();
    this.buildUiActionKeys();
  }

  private buildOptions()
  {
    this.stageOptions = this.stages.map(s => ({ id: s.id, text: s.stageKey, sub: s.titleFa }));
    this.triggerOptions = this.triggers.map(t => ({ id: t.id, text: t.triggerKey, sub: t.titleFa }));
    this.condOptions = this.conditions.map(c => ({ id: c.id, text: c.conditionKey, sub: c.titleFa }));
    this.eventOptions = this.events.map(e => ({ id: e.id, text: e.eventKey, sub: e.titleFa }));
    this.actionOptions = this.actionsCatalog.map(a => ({ id: a.id, text: a.actionKey, sub: a.titleFa }));
  }

  private buildUiActionKeys()
  {
    const set = new Set<string>();

    // از decisionهای قبلی جمع کن
    for (const s of this.rows as any[])
    {
      const decs: any[] = s?.decisions ?? [];
      for (const d of decs)
      {
        const k = (d?.uiActionKey ?? '').trim();
        if (k) set.add(k);
      }
    }

    // چند کلید پیشنهادی رایج (اختیاری)
    ['IncomeApprove', 'IncomeReject', 'StartActivity', 'Close', 'Submit', 'Back'].forEach(x => set.add(x));

    this.uiActionKeys = [...set].sort((a, b) => a.localeCompare(b));
  }
  //-----------------------------------
  // Scenario-level produced events
  get scenarioProducedEventIds(): string[]
  {
    return (this.edit as any)?.producedEventIds ?? [];
  }
  set scenarioProducedEventIds(v: string[])
  {
    if (!this.edit) return;
    (this.edit as any).producedEventIds = v ?? [];
  }

  // Scenario-level preconditions (اگر لازم داری مشابهش)
  get scenarioPreconditionIds(): string[]
  {
    return (this.edit as any)?.preconditionIds ?? [];
  } 
  

  set scenarioPreconditionIds(v: string[])
  {
    if (!this.edit) return;
    (this.edit as any).preconditionIds = v ?? [];
  }

  // ---------- CRUD scenario ----------
  addScenario()
  {
    const s: Scenario = {
      id: uid(),
      scenarioKey: 'NEW_SCENARIO',
      titleFa: 'سناریوی جدید',
      description: '',
      stageId: this.stages[0]?.id ?? '',
      ownerSubdomain: 'Case',
      triggerId: this.triggers[0]?.id ?? '',
      preconditionIds: [],
      actions: [],
      factChanges: [],
      producedEventIds: [],
      decisions: [],
    };
    this.rows = [s, ...this.rows];
    this.store.save(COL_SCENARIOS, this.rows);
    this.editRow(s.id);
  }

  editRow(id: string)
  {
    this.editingId = id;
    const src = this.rows.find(x => x.id === id);
    this.edit = src ? structuredClone(src as any) : null;

    // ensure defaults
    if (this.edit)
    {
      (this.edit as any).preconditionIds ??= [];
      (this.edit as any).actions ??= [];
      (this.edit as any).factChanges ??= [];
      (this.edit as any).producedEventIds ??= [];
      (this.edit as any).decisions ??= [];
    }
  }

  cancelEdit()
  {
    this.editingId = null;
    this.edit = null;
  }

  saveEdit()
  {
    if (!this.edit) return;

    // minimal sanitize: keep ids arrays not null
    (this.edit as any).preconditionIds ??= [];
    (this.edit as any).actions ??= [];
    (this.edit as any).factChanges ??= [];
    (this.edit as any).producedEventIds ??= [];
    (this.edit as any).decisions ??= [];

    const idx = this.rows.findIndex(x => x.id === this.edit!.id);
    if (idx >= 0)
    {
      this.rows[idx] = this.edit!;
      this.store.save(COL_SCENARIOS, this.rows);
      this.buildUiActionKeys();
    }
  }

  removeScenario(id: string)
  {
    this.rows = this.rows.filter(x => x.id !== id);
    this.store.save(COL_SCENARIOS, this.rows);
    if (this.editingId === id) this.cancelEdit();
  }

  // ---------- Decisions ----------
  addDecision()
  {
    if (!this.edit) return;

    const d: DecisionAny = {
      id: uid(),
      decisionKey: 'DECISION_NEW',
      titleFa: '',
      uiActionKey: '',
      conditionIds: [],
      actions: [],
      factChanges: [],
      producedEventIds: [],
    };

    (this.edit as any).decisions = [d, ...((this.edit as any).decisions ?? [])];
  }

  removeDecision(decisionId: string)
  {
    if (!this.edit) return;
    (this.edit as any).decisions = ((this.edit as any).decisions ?? []).filter((x: any) => x.id !== decisionId);
  }

  setDecisionUiActionKey(d: any, v: string)
  {
    d.uiActionKey = v;
    if (v && !this.uiActionKeys.includes(v))
    {
      this.uiActionKeys = [...this.uiActionKeys, v].sort((a, b) => a.localeCompare(b));
    }
  }

  // ---------- Decision actions ----------
  addDecisionAction(d: any, actionId: string)
  {
    if (!actionId) return;
    d.actions ??= [];
    d.actions.push({ actionId, paramsJson: '' });
  }

  removeDecisionAction(d: any, idx: number)
  {
    d.actions ??= [];
    d.actions.splice(idx, 1);
  }

  // labels
  stageTitle(id: string)
  {
    const s = this.stages.find(x => x.id === id);
    return s ? `${s.stageKey} — ${s.titleFa}` : '—';
  }
}
