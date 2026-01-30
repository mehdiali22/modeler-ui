import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { EventApiService } from '../../../core/api/event-api.service';
import { ScenarioApiService } from '../../../core/api/scenario-api.service';
import { StageApiService } from '../../../core/api/stage-api.service';
import { TriggerApiService } from '../../../core/api/trigger-api.service';

import { EventDefinition, Scenario, Stage, TriggerDefinition } from '../../../core/types';

type DecisionRow = {
  uiActionKey: string;          // BTN_APPROVE ...
  scenarioId: number;
  scenarioKey: string;
  decisionId: number;
  decisionKey: string;
  stageId: number;
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
  implements OnInit
{
  error: string | null = null;
  rows: DecisionRow[] = [];

  stages: Stage[] = [];
  scenarios: Scenario[] = [];
  triggers: TriggerDefinition[] = [];
  events: EventDefinition[] = [];

  q = '';
  stageId: number | null = null;

  constructor(
    private stagesApi: StageApiService,
    private scenariosApi: ScenarioApiService,
    private triggersApi: TriggerApiService,
    private eventsApi: EventApiService,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload() {
    this.error = null;

    forkJoin({
      stages: this.stagesApi.list(),
      scenarios: this.scenariosApi.list(),
      triggers: this.triggersApi.list(),
      events: this.eventsApi.list(),
    }).subscribe({
      next: (res: {
        stages?: Stage[];
        scenarios?: Scenario[];
        triggers?: TriggerDefinition[];
        events?: EventDefinition[];
      }) => {
        this.stages = res.stages ?? [];
        this.scenarios = res.scenarios ?? [];
        this.triggers = res.triggers ?? [];
        this.events = res.events ?? [];

        const stageById = new Map<number, Stage>(this.stages.map((s) => [s.id, s]));
        const triggerById = new Map<number, TriggerDefinition>(this.triggers.map((t) => [t.id, t]));
        const eventKeyById = new Map<number, string>(this.events.map((e) => [e.id, e.eventKey]));

        const out: DecisionRow[] = [];
        for (const s of this.scenarios) {
          const stageId = (s.stageId ?? 0) as number;
          const st = stageById.get(stageId);
          const tr = s.triggerId != null ? triggerById.get(s.triggerId) : undefined;

          for (const d of (s.decisions ?? [])) {
            const ui = (d.uiActionKey ?? '').trim();

            out.push({
              uiActionKey: ui || '—',
              scenarioId: s.id,
              scenarioKey: s.scenarioKey,
              decisionId: d.id,
              decisionKey: d.decisionKey,
              stageId,
              stageKey: st?.stageKey ?? '—',
              triggerKey: tr?.triggerKey ?? '—',
              actionsCount: (d.actions?.length ?? 0),
              conditionsCount: (d.conditionIds?.length ?? 0),
              events: (d.producedEventIds ?? []).map((id) => eventKeyById.get(id) ?? '—'),
            });
          }
        }

        // مرتب‌سازی: اول uiActionKey بعد stage بعد scenario
        out.sort((a, b) =>
          a.uiActionKey.localeCompare(b.uiActionKey) ||
          a.stageKey.localeCompare(b.stageKey) ||
          a.scenarioKey.localeCompare(b.scenarioKey) ||
          a.decisionKey.localeCompare(b.decisionKey),
        );

        this.rows = out;
      },
      error: (err: any) => {
        this.error = err?.message ?? 'خطا در ارتباط با API';
      },
    });
  }

  get filtered(): DecisionRow[]
  {
    const q = this.q.trim().toLowerCase();
    return this.rows.filter(r =>
    {
      if (this.stageId != null && r.stageId !== this.stageId) return false;
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
