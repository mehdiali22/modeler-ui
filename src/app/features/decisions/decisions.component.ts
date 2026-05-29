import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Scenario, Condition, ActionDefinition, Fact } from '../../core/types';

import { ScenarioApiService } from '../../core/api/scenario-api.service';
import { ConditionApiService } from '../../core/api/condition-api.service';
import { ActionApiService } from '../../core/api/action-api.service';
import { FactApiService } from '../../core/api/fact-api.service';

import { ScenarioDecisionApiService, ScenarioDecisionDto } from '../../core/api/scenario-decision-api.service';
import { ScenarioDecisionOptionApiService, ScenarioDecisionOptionDto } from '../../core/api/scenario-decision-option-api.service';
import { DecisionOptionFactChangeApiService, DecisionOptionFactChangeDto } from '../../core/api/decision-option-fact-change-api.service';

import { SmartSelectComponent, SmartOption } from '../../shared/smart-select/smart-select.component';
import { RefMultiSelectComponent, RefOption } from '../../shared/ref-multi-select/ref-multi-select.component';

type OptionEdit = ScenarioDecisionOptionDto & {
  conditionIds: number[];
  actionIds: number[];
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
  facts: Fact[] = [];

  conditionOptions: RefOption[] = [];
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
  optionFactChangesJson = '[]';

  constructor(
    private scenariosApi: ScenarioApiService,
    private conditionsApi: ConditionApiService,
    private actionsApi: ActionApiService,
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
      facts: this.factsApi.list(),
    }).subscribe({
      next: (res) =>
      {
        this.scenarios = res.scenarios ?? [];
        this.conditions = res.conditions ?? [];
        this.actions = res.actions ?? [];
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
      this.optionFactChangesJson = '[]';
      return;
    }

    this.error = null;
    this.ofcApi.list(this.selectedOptionId).subscribe({
      next: (rows: DecisionOptionFactChangeDto[]) =>
      {
        this.optionFactChanges = rows ?? [];
        this.refreshOptionFactChangesJson();
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
      sortOrder: this.optionFactChanges.length + 1,
    };

    this.error = null;
    this.ofcApi.create(payload).subscribe({
      next: (created: DecisionOptionFactChangeDto) =>
      {
        this.optionFactChanges = [...this.optionFactChanges, created];
        this.normalizeOptionFactChangeSortOrder();
        this.refreshOptionFactChangesJson();
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
      sortOrder: row.sortOrder ?? 0,
    };

    this.error = null;
    this.ofcApi.update(row.id, payload).subscribe({
      next: (updated: DecisionOptionFactChangeDto) =>
      {
        const idx = this.optionFactChanges.findIndex((x) => x.id === updated.id);
        if (idx >= 0) this.optionFactChanges[idx] = updated;
        this.normalizeOptionFactChangeSortOrder();
        this.refreshOptionFactChangesJson();
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
        this.normalizeOptionFactChangeSortOrder();
        this.refreshOptionFactChangesJson();
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


  onOptionFactChangeRowChanged(row?: DecisionOptionFactChangeDto): void
  {
    this.normalizeOptionFactChangeSortOrder();
    this.refreshOptionFactChangesJson();
  }

  refreshOptionFactChangesJson(): void
  {
    this.optionFactChangesJson = this.factChangesToJson(this.optionFactChanges ?? []);
  }

  applyOptionFactChangesJson(): void
  {
    if (!this.selectedOptionId) return;
    const rows = this.parseFactChangesJson(this.optionFactChangesJson);
    if (!rows) return;

    // Replace current option-level fact changes with the JSON rows.
    const deletes = [...this.optionFactChanges];
    const createNext = (index: number) => {
      if (index >= rows.length) {
        this.reloadOptionFactChanges();
        return;
      }
      this.ofcApi.create({ scenarioDecisionOptionId: this.selectedOptionId!, ...rows[index] } as any).subscribe({
        next: () => createNext(index + 1),
        error: (err: unknown) => this.error = this.errMsg(err, 'خطا در ایجاد FactChange از JSON'),
      });
    };

    const deleteNext = (index: number) => {
      if (index >= deletes.length) {
        createNext(0);
        return;
      }
      this.ofcApi.delete(deletes[index].id).subscribe({
        next: () => deleteNext(index + 1),
        error: (err: unknown) => this.error = this.errMsg(err, 'خطا در جایگزینی FactChangeها'),
      });
    };

    deleteNext(0);
  }

  private normalizeOptionFactChangeSortOrder(): void
  {
    this.optionFactChanges = (this.optionFactChanges ?? []).map((x, i) => ({ ...x, sortOrder: i + 1 }));
  }

  private factChangesToJson(rows: DecisionOptionFactChangeDto[]): string
  {
    const body = (rows ?? []).map((fc, index) => ({
      factKey: this.factKey(fc.factId),
      op: fc.op ?? 'Set',
      value: fc.value ?? '',
      sortOrder: fc.sortOrder ?? index + 1,
    }));
    return JSON.stringify(body, null, 2);
  }

  private parseFactChangesJson(json: string): Array<{ factId: number; op: 'Set' | 'Unset' | 'Inc' | 'Dec'; value?: string; sortOrder?: number }> | null
  {
    try {
      const data = JSON.parse(json || '[]');
      const items = Array.isArray(data)
        ? data
        : Object.entries(data ?? {}).map(([factKey, value]) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              const obj: any = value;
              return { factKey, op: obj.op ?? 'Set', value: obj.value ?? '' };
            }
            return { factKey, op: 'Set', value };
          });

      return items.map((item: any, index: number) => {
        const factId = Number(item.factId ?? this.factIdByKey(String(item.factKey ?? '')));
        if (!factId) throw new Error(`Fact not found: ${item.factKey ?? item.factId}`);
        const op = String(item.op ?? 'Set');
        if (!['Set', 'Unset', 'Inc', 'Dec'].includes(op)) throw new Error(`Invalid op: ${op}`);
        const rawValue = item.value;
        const value = rawValue == null ? '' : (typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue));
        return { factId, op: op as any, value, sortOrder: Number(item.sortOrder ?? index + 1) };
      });
    } catch (e: any) {
      this.error = e?.message ?? 'JSON نامعتبر است.';
      return null;
    }
  }

  private factIdByKey(key: string): number | null
  {
    return this.facts.find(f => f.factKey === key)?.id ?? null;
  }

  private factKey(id: number): string
  {
    return this.facts.find(f => f.id === id)?.factKey ?? String(id);
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
