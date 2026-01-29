import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CatalogStoreService } from '../../../core/catalog-store.service';
import
  {
    Scenario,
    Stage,
    TriggerDefinition,
    EventDefinition,
} from '../../../core/types';
import { RouterModule } from '@angular/router';



const COL_SCENARIOS = 'scenarios';
const COL_STAGES = 'stages';
const COL_TRIGGERS = 'triggers';
const COL_EVENTS = 'events';

type DecisionRow = {
  uiActionKey: string;          // BTN_APPROVE ...
  scenarioId: string;
  scenarioKey: string;
  decisionId: string;
  decisionKey: string;
  stageId: string;
  stageKey: string;
  triggerKey: string;
  actionsCount: number;
  conditionsCount: number;
  events: string[];            // eventKey list
};

@Component({
  selector: 'app-ui-bindings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ui-bindings.component.html',
  styleUrls: ['./ui-bindings.component.scss'],
})
export class UiBindingsComponent
{
  rows: DecisionRow[] = [];

  stages: Stage[] = [];
  scenarios: Scenario[] = [];
  triggers: TriggerDefinition[] = [];
  events: EventDefinition[] = [];

  q = '';
  stageId = '';

  constructor(private store: CatalogStoreService)
  {
    this.reload();
  }

  reload()
  {
    this.stages = this.store.list<Stage>(COL_STAGES);
    this.scenarios = this.store.list<Scenario>(COL_SCENARIOS);
    this.triggers = this.store.list<TriggerDefinition>(COL_TRIGGERS);
    this.events = this.store.list<EventDefinition>(COL_EVENTS);

    const stageById = new Map(this.stages.map(s => [s.id, s]));
    const triggerById = new Map(this.triggers.map(t => [t.id, t]));
    const eventKeyById = new Map(this.events.map(e => [e.id, e.eventKey]));

    const out: DecisionRow[] = [];
    for (const s of this.scenarios)
    {
      const st = stageById.get(s.stageId ?? '—');
      const tr = triggerById.get(s.triggerId ?? '');

      for (const d of (s.decisions ?? []))
      {
        const ui = (d.uiActionKey ?? '').trim();

        out.push({
          uiActionKey: ui || '—',
          scenarioId: s.id,
          scenarioKey: s.scenarioKey,
          decisionId: d.id,
          decisionKey: d.decisionKey,
          stageId: s.stageId ?? '—',
          stageKey: st?.stageKey ?? '—',
          triggerKey: tr?.triggerKey ?? '—',
          actionsCount: (d.actions?.length ?? 0),
          conditionsCount: (d.conditionIds?.length ?? 0),
          events: (d.producedEventIds ?? []).map(id => eventKeyById.get(id) ?? '—'),
        });
      }
    }

    // مرتب‌سازی: اول uiActionKey بعد stage بعد scenario
    out.sort((a, b) =>
      a.uiActionKey.localeCompare(b.uiActionKey) ||
      a.stageKey.localeCompare(b.stageKey) ||
      a.scenarioKey.localeCompare(b.scenarioKey) ||
      a.decisionKey.localeCompare(b.decisionKey)
    );

    this.rows = out;
  }

  get filtered(): DecisionRow[]
  {
    const q = this.q.trim().toLowerCase();
    return this.rows.filter(r =>
    {
      if (this.stageId && r.stageId !== this.stageId) return false;
      if (!q) return true;
      return (
        r.uiActionKey.toLowerCase().includes(q) ||
        r.scenarioKey.toLowerCase().includes(q) ||
        r.decisionKey.toLowerCase().includes(q) ||
        r.stageKey.toLowerCase().includes(q) ||
        r.triggerKey.toLowerCase().includes(q)
      );
    });
  }

  // برای پیدا کردن دکمه‌هایی که چند جا استفاده شدن
  get duplicates(): { key: string; count: number }[]
  {
    const map = new Map<string, number>();
    for (const r of this.rows)
    {
      const k = r.uiActionKey;
      if (!k || k === '—') continue;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()]
      .filter(([, c]) => c > 1)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);
  }
}
