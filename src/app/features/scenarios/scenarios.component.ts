import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import
  {
    ActionDefinition,
    Condition,
    EventDefinition,
    Scenario,
    Stage,
    TriggerDefinition,
  } from '../../core/types';

import { ActionApiService } from '../../core/api/action-api.service';
import { ConditionApiService } from '../../core/api/condition-api.service';
import { EventApiService } from '../../core/api/event-api.service';
import { ScenarioApiService } from '../../core/api/scenario-api.service';
import { StageApiService } from '../../core/api/stage-api.service';
import { TriggerApiService } from '../../core/api/trigger-api.service';

import { RefMultiSelectComponent, RefOption } from '../../shared/ref-multi-select/ref-multi-select.component';
import { SmartSelectComponent, SmartOption } from '../../shared/smart-select/smart-select.component';

// We keep a flexible edit type because UI sometimes augments the Scenario
// shape (e.g., ensuring arrays exist).
type ScenarioEdit = Scenario & {
  stageId: number | null;
  triggerId?: number | null;
  [key: string]: any;
};

@Component({
  selector: 'app-scenarios',
  standalone: true,
  imports: [CommonModule, SmartSelectComponent, RefMultiSelectComponent],
  templateUrl: './scenarios.component.html',
  styleUrls: ['./scenarios.component.scss'],
})
export class ScenariosComponent implements OnInit
{
  rows: Scenario[] = [];

  stages: Stage[] = [];
  triggers: TriggerDefinition[] = [];
  events: EventDefinition[] = [];
  conditions: Condition[] = [];
  actions: ActionDefinition[] = [];

  stageOptions: SmartOption[] = [];
  triggerOptions: SmartOption[] = [];
  actionOptions: { id: number; text: string; sub?: string }[] = [];

  condOptions: RefOption[] = [];
  eventOptions: RefOption[] = [];

  q = '';
  error: string | null = null;

  editingId: number | null = null;
  edit: ScenarioEdit | null = null;

  scenarioPreconditionIds: number[] = [];
  scenarioProducedEventIds: number[] = [];

  constructor(
    private scenariosApi: ScenarioApiService,
    private stagesApi: StageApiService,
    private triggersApi: TriggerApiService,
    private eventsApi: EventApiService,
    private conditionsApi: ConditionApiService,
    private actionsApi: ActionApiService,
  ) { }

  ngOnInit(): void
  {
    this.reload();
  }

  reload()
  {
    this.error = null;

    forkJoin({
      scenarios: this.scenariosApi.list(),
      stages: this.stagesApi.list(),
      triggers: this.triggersApi.list(),
      events: this.eventsApi.list(),
      conditions: this.conditionsApi.list(),
      actions: this.actionsApi.list(),
    }).subscribe({
      next: (res) =>
      {
        this.rows = (res.scenarios ?? []) as Scenario[];
        this.stages = res.stages ?? [];
        this.triggers = res.triggers ?? [];
        this.events = res.events ?? [];
        this.conditions = res.conditions ?? [];
        this.actions = res.actions ?? [];

        this.rebuildOptions();

        if (this.editingId != null)
        {
          const stillThere = this.rows.find((x) => x.id === this.editingId);
          if (!stillThere) this.cancelEdit();
        }
      },
      error: (err: any) =>
      {
        this.error = err?.message ?? 'خطا در ارتباط با API';
      },
    });
  }

  private rebuildOptions()
  {
    this.stageOptions = (this.stages ?? []).map((s) => ({
      id: s.id,
      text: s.stageKey,
      sub: s.titleFa ?? '',
    }));

    this.triggerOptions = (this.triggers ?? []).map((t) => ({
      id: t.id,
      text: t.triggerKey,
      sub: t.titleFa ?? '',
    }));

    this.eventOptions = (this.events ?? []).map((e) => ({
      id: e.id,
      text: e.eventKey,
      sub: e.titleFa ?? '',
    }));

    this.condOptions = (this.conditions ?? []).map((c) => ({
      id: c.id,
      text: c.conditionKey,
      sub: c.titleFa ?? '',
    }));

    this.actionOptions = (this.actions ?? []).map((a) => ({
      id: a.id,
      text: a.actionKey,
      sub: a.titleFa ?? '',
    }));
  }

  get filtered(): Scenario[]
  {
    const q = (this.q ?? '').trim().toLowerCase();
    if (!q) return this.rows;
    return (this.rows ?? []).filter((r) =>
    {
      const s = `${r.scenarioKey} ${(r.titleFa ?? '')} ${(r.ownerSubdomain ?? '')}`.toLowerCase();
      return s.includes(q);
    });
  }

  stageTitle(stageId: number | null | undefined): string
  {
    if (!stageId) return '—';
    const s = (this.stages ?? []).find((x) => x.id === stageId);
    return s ? `${s.stageKey}${s.titleFa ? ' — ' + s.titleFa : ''}` : '—';
  }

  addScenario()
  {
    this.error = null;

    const firstStageId = this.stages?.[0]?.id ?? null;
    if (!firstStageId)
    {
      this.error = 'حداقل یک Stage لازم است.';
      return;
    }

    const payload: Omit<Scenario, 'id'> = {
      scenarioKey: 'NEW_SCENARIO',
      stageId: firstStageId,
      titleFa: 'سناریوی جدید',
      description: '',
      ownerSubdomain: '',
      triggerId: undefined,
      preconditionIds: [],
      producedEventIds: [],
      actions: [],
      factChanges: [],
    };

    this.scenariosApi.create(payload).subscribe({
      next: (created) =>
      {
        this.rows = [created, ...this.rows];
        this.editRow(created.id);
      },
      error: (err: any) =>
      {
        this.error = err?.message ?? 'خطا در ایجاد';
      },
    });
  }

  editRow(id: number)
  {
    this.editingId = id;
    const src = this.rows.find((x) => x.id === id);
    if (!src)
    {
      this.edit = null;
      return;
    }

    const clone = structuredClone(src) as any;

    this.edit = {
      id: clone.id,
      scenarioKey: clone.scenarioKey,
      titleFa: clone.titleFa,
      description: clone.description,
      ownerSubdomain: clone.ownerSubdomain,
      stageId: clone.stageId ?? null,
      triggerId: clone.triggerId ?? null,
      preconditionIds: clone.preconditionIds ?? [],
      producedEventIds: clone.producedEventIds ?? [],
      actions: clone.actions ?? [],
      factChanges: clone.factChanges ?? [],
    };

    const e = this.edit;
    if (!e) return;

    this.scenarioPreconditionIds = [...(e.preconditionIds ?? [])];
    this.scenarioProducedEventIds = [...(e.producedEventIds ?? [])];
  }

  cancelEdit()
  {
    this.editingId = null;
    this.edit = null;
    this.scenarioPreconditionIds = [];
    this.scenarioProducedEventIds = [];
  }

  saveEdit()
  {
    if (!this.edit) return;

    this.error = null;

    // sync arrays from UI
    this.edit.preconditionIds = [...(this.scenarioPreconditionIds ?? [])];
    this.edit.producedEventIds = [...(this.scenarioProducedEventIds ?? [])];

    // sanitize
    this.edit.scenarioKey = (this.edit.scenarioKey ?? '').trim();
    this.edit.titleFa = (this.edit.titleFa ?? '').trim() || undefined;
    this.edit.description = (this.edit.description ?? '').trim() || undefined;
    this.edit.ownerSubdomain = (this.edit.ownerSubdomain ?? '').trim() || undefined;

    if (!this.edit.scenarioKey)
    {
      this.error = 'Scenario Key الزامی است.';
      return;
    }
    if (this.edit.stageId == null)
    {
      this.error = 'Stage الزامی است.';
      return;
    }

    if (this.edit.triggerId == null) this.edit.triggerId = undefined;

    const id = this.edit.id;

    const payload: Omit<Scenario, 'id'> = {
      scenarioKey: this.edit.scenarioKey,
      titleFa: this.edit.titleFa,
      description: this.edit.description,
      ownerSubdomain: this.edit.ownerSubdomain,
      stageId: this.edit.stageId,
      triggerId: this.edit.triggerId ?? undefined,
      preconditionIds: this.edit.preconditionIds ?? [],
      producedEventIds: this.edit.producedEventIds ?? [],
      actions: (this.edit as any).actions ?? [],
      factChanges: (this.edit as any).factChanges ?? [],
    };

    this.scenariosApi.update(id, payload).subscribe({
      next: (updated) =>
      {
        const idx = this.rows.findIndex((x) => x.id === id);
        if (idx >= 0) this.rows[idx] = updated;
        this.cancelEdit();
      },
      error: (err: any) =>
      {
        this.error = err?.message ?? 'خطا در ویرایش';
      },
    });
  }

  removeScenario(id: number)
  {
    this.error = null;
    this.scenariosApi.delete(id).subscribe({
      next: () =>
      {
        this.rows = this.rows.filter((x) => x.id !== id);
        if (this.editingId === id) this.cancelEdit();
      },
      error: (err: any) =>
      {
        this.error = err?.message ?? 'خطا در حذف';
      },
    });
  }
}
