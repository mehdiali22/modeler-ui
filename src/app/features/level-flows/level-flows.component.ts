import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import {
  ActionDefinition,
  ActionStateTransition,
  EntityState,
  Id,
  Scenario,
  ScenarioDecision,
  ScenarioDecisionOption,
} from '../../core/types';
import { ActionApiService } from '../../core/api/action-api.service';
import { ActionStateTransitionApiService } from '../../core/api/action-state-transition-api.service';
import { EntityStateApiService } from '../../core/api/entity-state-api.service';
import { ScenarioApiService } from '../../core/api/scenario-api.service';
import { ScenarioDecisionApiService } from '../../core/api/scenario-decision-api.service';
import { ScenarioDecisionOptionApiService } from '../../core/api/scenario-decision-option-api.service';

type TransitionForm = {
  scenarioId: Id | null;
  actionId: Id | null;
  fromStateId: Id | null;
  toStateId: Id | null;
  decisionId: Id | null;
  decisionOptionId: Id | null;
  labelFa: string;
  sortOrder: number;
  description: string;
};

@Component({
  selector: 'app-level-flows',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './level-flows.component.html',
  styleUrls: ['./level-flows.component.scss'],
})
export class LevelFlowsComponent implements OnInit {
  states: EntityState[] = [];
  transitions: ActionStateTransition[] = [];
  actions: ActionDefinition[] = [];
  scenarios: Scenario[] = [];
  decisions: ScenarioDecision[] = [];
  options: ScenarioDecisionOption[] = [];

  form: TransitionForm = this.emptyForm();
  error: string | null = null;
  isLoading = false;

  constructor(
    private statesApi: EntityStateApiService,
    private transitionsApi: ActionStateTransitionApiService,
    private actionsApi: ActionApiService,
    private scenariosApi: ScenarioApiService,
    private decisionsApi: ScenarioDecisionApiService,
    private optionsApi: ScenarioDecisionOptionApiService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      states: this.statesApi.list(),
      transitions: this.transitionsApi.list(),
      actions: this.actionsApi.list(),
      scenarios: this.scenariosApi.list(),
      decisions: this.decisionsApi.list(),
      options: this.optionsApi.list(),
    }).subscribe({
      next: data => {
        this.states = data.states;
        this.transitions = data.transitions;
        this.actions = data.actions;
        this.scenarios = data.scenarios;
        this.decisions = data.decisions;
        this.options = data.options;
      },
      error: err => this.error = err?.message ?? 'خطا در خواندن داده‌های State Transition',
    });
  }

  load(): void {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      states: this.statesApi.list(),
      transitions: this.transitionsApi.list(),
    }).subscribe({
      next: data => {
        this.states = data.states;
        this.transitions = data.transitions;
        this.isLoading = false;
      },
      error: err => {
        this.error = err?.message ?? 'خطا در خواندن State Transitionها';
        this.isLoading = false;
      },
    });
  }

  add(): void {
    if (!this.form.actionId) {
      this.error = 'Action اجباری است.';
      return;
    }

    this.transitionsApi.create({
      scenarioId: this.form.scenarioId ? Number(this.form.scenarioId) : null,
      actionId: Number(this.form.actionId),
      fromStateId: this.form.fromStateId ? Number(this.form.fromStateId) : null,
      toStateId: this.form.toStateId ? Number(this.form.toStateId) : null,
      decisionId: this.form.decisionId ? Number(this.form.decisionId) : null,
      decisionOptionId: this.form.decisionOptionId ? Number(this.form.decisionOptionId) : null,
      labelFa: this.form.labelFa,
      sortOrder: Number(this.form.sortOrder || 0),
      description: this.form.description,
    }).subscribe({
      next: () => {
        this.form = this.emptyForm();
        this.load();
      },
      error: err => this.error = err?.message ?? 'خطا در ثبت State Transition',
    });
  }

  delete(id: Id): void {
    if (!confirm('State Transition حذف شود؟')) return;

    this.transitionsApi.delete(id).subscribe({
      next: () => this.load(),
      error: err => this.error = err?.message ?? 'خطا در حذف State Transition',
    });
  }

  filteredDecisions(): ScenarioDecision[] {
    if (!this.form.scenarioId) return this.decisions;

    return this.decisions.filter(d => d.scenarioId === Number(this.form.scenarioId));
  }

  filteredOptions(): ScenarioDecisionOption[] {
    if (!this.form.decisionId) return this.options;

    return this.options.filter(o => o.scenarioDecisionId === Number(this.form.decisionId));
  }

  onScenarioChanged(): void {
    if (this.form.decisionId && !this.filteredDecisions().some(d => d.id === Number(this.form.decisionId))) {
      this.form.decisionId = null;
      this.form.decisionOptionId = null;
    }
  }

  onDecisionChanged(): void {
    if (this.form.decisionOptionId && !this.filteredOptions().some(o => o.id === Number(this.form.decisionOptionId))) {
      this.form.decisionOptionId = null;
    }
  }

  scenarioLabel(id: Id | null | undefined): string {
    if (!id) return '—';

    const row = this.scenarios.find(x => x.id === id);
    return row ? `${row.scenarioKey} - ${row.titleFa || ''}` : String(id);
  }

  actionLabel(id: Id | null | undefined): string {
    if (!id) return '—';

    const row = this.actions.find(x => x.id === id);
    return row ? `${row.actionKey} - ${row.titleFa || ''}` : String(id);
  }

  stateLabel(id: Id | null | undefined): string {
    if (!id) return '—';

    const row = this.states.find(x => x.id === id);
    return row ? `${row.stateKey} - ${row.titleFa || ''}` : String(id);
  }

  decisionLabel(id: Id | null | undefined): string {
    if (!id) return '—';

    const row = this.decisions.find(x => x.id === id);
    return row ? `${row.decisionKey} - ${row.titleFa || ''}` : String(id);
  }

  optionLabel(id: Id | null | undefined): string {
    if (!id) return '—';

    const row = this.options.find(x => x.id === id);
    return row ? `${row.optionKey} - ${row.titleFa || ''}` : String(id);
  }

  stateConditions(id: Id | null | undefined): string {
    if (!id) return '—';

    const state = this.states.find(x => x.id === id);
    if (!state?.conditionJson || state.conditionJson === '[]') return '—';

    try {
      const parsed = JSON.parse(state.conditionJson);
      if (!Array.isArray(parsed)) return state.conditionJson;

      return parsed
        .map((x: any) => `${x.factKey ?? 'Fact#' + x.factId} ${x.op ?? '='} ${this.valueToText(x.value)}`)
        .join(' | ');
    } catch {
      return state.conditionJson;
    }
  }

  private valueToText(value: any): string {
    if (Array.isArray(value)) return value.join(',');
    if (value === null || value === undefined) return '';
    return String(value);
  }

  private emptyForm(): TransitionForm {
    return {
      scenarioId: null,
      actionId: null,
      fromStateId: null,
      toStateId: null,
      decisionId: null,
      decisionOptionId: null,
      labelFa: '',
      sortOrder: 10,
      description: '',
    };
  }
}
