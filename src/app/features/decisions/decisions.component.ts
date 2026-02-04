import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Scenario, Condition, ActionDefinition, EventDefinition, Fact } from '../../core/types';

import { ScenarioApiService } from '../../core/api/scenario-api.service';
import { ConditionApiService } from '../../core/api/condition-api.service';
import { ActionApiService } from '../../core/api/action-api.service';
import { EventApiService } from '../../core/api/event-api.service';
import { FactApiService } from '../../core/api/fact-api.service';

import { ScenarioDecisionApiService, ScenarioDecisionDto } from '../../core/api/scenario-decision-api.service';
import { ScenarioDecisionOptionApiService, ScenarioDecisionOptionDto } from '../../core/api/scenario-decision-option-api.service';
import { DecisionOptionFactChangeApiService, DecisionOptionFactChangeDto } from '../../core/api/decision-option-fact-change-api.service';

import { SmartSelectComponent, SmartOption } from '../../shared/smart-select/smart-select.component';
import { RefMultiSelectComponent, RefOption } from '../../shared/ref-multi-select/ref-multi-select.component';

type OptionEdit = ScenarioDecisionOptionDto & {
  conditionIds: number[];
  actionIds: number[];
  producedEventIds: number[];
};

@Component({
  selector: 'app-decisions',
  standalone: true,
  imports: [CommonModule, SmartSelectComponent, RefMultiSelectComponent],
  templateUrl: './decisions.component.html',
  styleUrls: ['./decisions.component.scss'],
})
export class DecisionsComponent implements OnInit
{
  error: string | null = null;

  scenarios: Scenario[] = [];
  scenarioOptions: SmartOption[] = [];
  selectedScenarioId: number | null = null;

  // catalogs
  conditions: Condition[] = [];
  actions: ActionDefinition[] = [];
  events: EventDefinition[] = [];
  facts: Fact[] = [];

  conditionOptions: RefOption[] = [];
  eventOptions: RefOption[] = [];
  actionOptions: RefOption[] = [];
  factOptions: SmartOption[] = [];

  // decisions
  decisions: ScenarioDecisionDto[] = [];
  selectedDecisionId: number | null = null;
  decisionEdit: ScenarioDecisionDto | null = null;

  // options
  options: ScenarioDecisionOptionDto[] = [];
  selectedOptionId: number | null = null;
  optionEdit: OptionEdit | null = null;

  // option fact changes
  optionFactChanges: DecisionOptionFactChangeDto[] = [];

  constructor(
    private scenariosApi: ScenarioApiService,
    private conditionsApi: ConditionApiService,
    private actionsApi: ActionApiService,
    private eventsApi: EventApiService,
    private factsApi: FactApiService,

    private decisionsApi: ScenarioDecisionApiService,
    private optionsApi: ScenarioDecisionOptionApiService,
    private ofcApi: DecisionOptionFactChangeApiService,
  ) { }

  ngOnInit(): void
  {
    this.loadCatalogs();
  }

  loadCatalogs(): void
  {
    this.error = null;

    forkJoin({
      scenarios: this.scenariosApi.list(),
      conditions: this.conditionsApi.list(),
      actions: this.actionsApi.list(),
      events: this.eventsApi.list(),
      facts: this.factsApi.list(),
    }).subscribe({
      next: (res) =>
      {
        this.scenarios = res.scenarios ?? [];
        this.conditions = res.conditions ?? [];
        this.actions = res.actions ?? [];
        this.events = res.events ?? [];
        this.facts = res.facts ?? [];

        this.scenarioOptions = this.scenarios.map((s) => ({
          id: s.id,
          text: s.scenarioKey,
          sub: s.titleFa ?? '',
        }));

        this.conditionOptions = this.conditions.map((c) => ({
          id: c.id,
          text: c.conditionKey,
          sub: c.titleFa ?? '',
        }));

        this.actionOptions = this.actions.map((a) => ({
          id: a.id,
          text: a.actionKey,
          sub: a.titleFa ?? '',
        }));

        this.eventOptions = this.events.map((e) => ({
          id: e.id,
          text: e.eventKey,
          sub: e.titleFa ?? '',
        }));

        // ✅ Fact in your types.ts has: factKey + meaning (no titleFa)
        this.factOptions = this.facts.map((f) => ({
          id: f.id,
          text: f.factKey,
          sub: f.meaning ?? '',
        }));

        if (this.selectedScenarioId == null && this.scenarios.length)
        {
          this.selectedScenarioId = this.scenarios[0].id;
        }

        this.reloadDecisions();
      },
      error: (err: unknown) =>
      {
        this.error = this.errMsg(err, 'خطا در بارگذاری دیتا');
      },
    });
  }

  onScenarioPick(id: number | null): void
  {
    this.selectedScenarioId = id;

    this.selectedDecisionId = null;
    this.decisionEdit = null;
    this.decisions = [];

    this.selectedOptionId = null;
    this.optionEdit = null;
    this.options = [];
    this.optionFactChanges = [];

    this.reloadDecisions();
  }

  // -------- Decisions --------

  reloadDecisions(): void
  {
    if (!this.selectedScenarioId)
    {
      this.decisions = [];
      return;
    }

    this.error = null;
    this.decisionsApi.list(this.selectedScenarioId).subscribe({
      next: (rows: ScenarioDecisionDto[]) =>
      {
        this.decisions = rows ?? [];

        if (this.selectedDecisionId != null)
        {
          const still = this.decisions.find((x) => x.id === this.selectedDecisionId);
          if (!still) this.clearDecisionSelection();
        }
      },
      error: (err: unknown) =>
      {
        this.error = this.errMsg(err, 'خطا در بارگذاری Decisionها');
      },
    });
  }

  addDecision(): void
  {
    if (!this.selectedScenarioId) return;

    const payload: Omit<ScenarioDecisionDto, 'id'> = {
      scenarioId: this.selectedScenarioId,
      decisionKey: 'NEW_DECISION',
      titleFa: 'تصمیم جدید',
      uiActionKey: '',
    };

    this.error = null;
    this.decisionsApi.create(payload).subscribe({
      next: (created: ScenarioDecisionDto) =>
      {
        this.decisions = [created, ...this.decisions];
        this.selectDecision(created.id);
      },
      error: (err: unknown) =>
      {
        this.error = this.errMsg(err, 'خطا در ایجاد Decision');
      },
    });
  }

  selectDecision(id: number): void
  {
    this.selectedDecisionId = id;

    const d = this.decisions.find((x) => x.id === id);
    this.decisionEdit = d ? structuredClone(d) : null;

    // reset option part
    this.selectedOptionId = null;
    this.optionEdit = null;
    this.options = [];
    this.optionFactChanges = [];

    this.reloadOptions();
  }

  clearDecisionSelection(): void
  {
    this.selectedDecisionId = null;
    this.decisionEdit = null;

    this.selectedOptionId = null;
    this.optionEdit = null;
    this.options = [];
    this.optionFactChanges = [];
  }

  saveDecision(): void
  {
    if (!this.decisionEdit) return;

    const d = this.decisionEdit;

    d.decisionKey = (d.decisionKey ?? '').trim();
    d.titleFa = (d.titleFa ?? '').trim() || undefined;
    d.uiActionKey = (d.uiActionKey ?? '').trim() || undefined;

    if (!d.decisionKey)
    {
      this.error = 'DecisionKey الزامی است.';
      return;
    }

    const payload: Omit<ScenarioDecisionDto, 'id'> = {
      scenarioId: d.scenarioId,
      decisionKey: d.decisionKey,
      titleFa: d.titleFa,
      uiActionKey: d.uiActionKey,
    };

    this.error = null;
    this.decisionsApi.update(d.id, payload).subscribe({
      next: (updated: ScenarioDecisionDto) =>
      {
        const idx = this.decisions.findIndex((x) => x.id === updated.id);
        if (idx >= 0) this.decisions[idx] = updated;
        this.selectDecision(updated.id);
      },
      error: (err: unknown) =>
      {
        this.error = this.errMsg(err, 'خطا در ذخیره Decision');
      },
    });
  }

  deleteDecision(id: number): void
  {
    this.error = null;
    this.decisionsApi.delete(id).subscribe({
      next: () =>
      {
        this.decisions = this.decisions.filter((x) => x.id !== id);
        if (this.selectedDecisionId === id) this.clearDecisionSelection();
      },
      error: (err: unknown) =>
      {
        this.error = this.errMsg(err, 'خطا در حذف Decision');
      },
    });
  }

  // -------- Options --------

  reloadOptions(): void
  {
    if (!this.selectedDecisionId)
    {
      this.options = [];
      return;
    }

    this.error = null;
    this.optionsApi.list(this.selectedDecisionId).subscribe({
      next: (rows: ScenarioDecisionOptionDto[]) =>
      {
        this.options = rows ?? [];

        if (this.selectedOptionId != null)
        {
          const still = this.options.find((x) => x.id === this.selectedOptionId);
          if (!still) this.clearOptionSelection();
        }
      },
      error: (err: unknown) =>
      {
        this.error = this.errMsg(err, 'خطا در بارگذاری Optionها');
      },
    });
  }

  addOption(): void
  {
    if (!this.selectedDecisionId) return;

    const payload: Omit<ScenarioDecisionOptionDto, 'id'> = {
      scenarioDecisionId: this.selectedDecisionId,
      optionKey: 'OPT_NEW',
      titleFa: 'گزینه جدید',
      conditionIdsJson: '[]',
      actionIdsJson: '[]',
      producedEventIdsJson: '[]',
    };

    this.error = null;
    this.optionsApi.create(payload).subscribe({
      next: (created: ScenarioDecisionOptionDto) =>
      {
        this.options = [created, ...this.options];
        this.selectOption(created.id);
      },
      error: (err: unknown) =>
      {
        this.error = this.errMsg(err, 'خطا در ایجاد Option');
      },
    });
  }

  selectOption(id: number): void
  {
    this.selectedOptionId = id;

    const o = this.options.find((x) => x.id === id);
    if (!o)
    {
      this.optionEdit = null;
      return;
    }

    this.optionEdit = {
      ...structuredClone(o),
      conditionIds: this.parseIds(o.conditionIdsJson),
      actionIds: this.parseIds(o.actionIdsJson),
      producedEventIds: this.parseIds(o.producedEventIdsJson),
    };

    this.reloadOptionFactChanges();
  }

  clearOptionSelection(): void
  {
    this.selectedOptionId = null;
    this.optionEdit = null;
    this.optionFactChanges = [];
  }

  saveOption(): void
  {
    if (!this.optionEdit) return;

    const o = this.optionEdit;

    o.optionKey = (o.optionKey ?? '').trim();
    o.titleFa = (o.titleFa ?? '').trim() || undefined;

    if (!o.optionKey)
    {
      this.error = 'OptionKey الزامی است.';
      return;
    }

    const payload: Omit<ScenarioDecisionOptionDto, 'id'> = {
      scenarioDecisionId: o.scenarioDecisionId,
      optionKey: o.optionKey,
      titleFa: o.titleFa,
      conditionIdsJson: JSON.stringify(o.conditionIds ?? []),
      actionIdsJson: JSON.stringify(o.actionIds ?? []),
      producedEventIdsJson: JSON.stringify(o.producedEventIds ?? []),
    };

    this.error = null;
    this.optionsApi.update(o.id, payload).subscribe({
      next: (updated: ScenarioDecisionOptionDto) =>
      {
        const idx = this.options.findIndex((x) => x.id === updated.id);
        if (idx >= 0) this.options[idx] = updated;
        this.selectOption(updated.id);
      },
      error: (err: unknown) =>
      {
        this.error = this.errMsg(err, 'خطا در ذخیره Option');
      },
    });
  }

  deleteOption(id: number): void
  {
    this.error = null;
    this.optionsApi.delete(id).subscribe({
      next: () =>
      {
        this.options = this.options.filter((x) => x.id !== id);
        if (this.selectedOptionId === id) this.clearOptionSelection();
      },
      error: (err: unknown) =>
      {
        this.error = this.errMsg(err, 'خطا در حذف Option');
      },
    });
  }

  // -------- Option FactChanges --------

  reloadOptionFactChanges(): void
  {
    if (!this.selectedOptionId)
    {
      this.optionFactChanges = [];
      return;
    }

    this.error = null;
    this.ofcApi.list(this.selectedOptionId).subscribe({
      next: (rows: DecisionOptionFactChangeDto[]) =>
      {
        this.optionFactChanges = rows ?? [];
      },
      error: (err: unknown) =>
      {
        this.error = this.errMsg(err, 'خطا در بارگذاری FactChangeها');
      },
    });
  }

  addOptionFactChange(): void
  {
    if (!this.selectedOptionId) return;

    if (!this.facts.length)
    {
      this.error = 'حداقل یک Fact لازم است.';
      return;
    }

    const payload: Omit<DecisionOptionFactChangeDto, 'id'> = {
      scenarioDecisionOptionId: this.selectedOptionId,
      factId: this.facts[0].id,
      op: 'Set',
      value: '',
    };

    this.error = null;
    this.ofcApi.create(payload).subscribe({
      next: (created: DecisionOptionFactChangeDto) =>
      {
        this.optionFactChanges = [...this.optionFactChanges, created];
      },
      error: (err: unknown) =>
      {
        this.error = this.errMsg(err, 'خطا در ایجاد FactChange');
      },
    });
  }

  saveOptionFactChange(row: DecisionOptionFactChangeDto): void
  {
    const payload: Omit<DecisionOptionFactChangeDto, 'id'> = {
      scenarioDecisionOptionId: row.scenarioDecisionOptionId,
      factId: row.factId,
      op: row.op,
      value: row.value,
    };

    this.error = null;
    this.ofcApi.update(row.id, payload).subscribe({
      next: (updated: DecisionOptionFactChangeDto) =>
      {
        const idx = this.optionFactChanges.findIndex((x) => x.id === updated.id);
        if (idx >= 0) this.optionFactChanges[idx] = updated;
      },
      error: (err: unknown) =>
      {
        this.error = this.errMsg(err, 'خطا در ذخیره FactChange');
      },
    });
  }

  deleteOptionFactChange(id: number): void
  {
    this.error = null;
    this.ofcApi.delete(id).subscribe({
      next: () =>
      {
        this.optionFactChanges = this.optionFactChanges.filter((x) => x.id !== id);
      },
      error: (err: unknown) =>
      {
        this.error = this.errMsg(err, 'خطا در حذف FactChange');
      },
    });
  }

  // -------- helpers --------

  private parseIds(json?: string): number[]
  {
    try
    {
      if (!json) return [];
      const arr: unknown = JSON.parse(json);
      if (!Array.isArray(arr)) return [];
      return arr
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x) && x > 0);
    } catch
    {
      return [];
    }
  }

  private errMsg(err: unknown, fallback: string): string
  {
    // try common shapes: HttpErrorResponse.message, or string
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err)
    {
      const m = (err as { message?: unknown }).message;
      if (typeof m === 'string' && m.trim()) return m;
    }
    return fallback;
  }
}
