import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { ActionDefinition, ActionStateTransition, Artifact, EntityState, Fact, FactEnumValue, Id, Scenario, ScenarioDecision, ScenarioDecisionOption } from '../../core/types';
import { ArtifactApiService } from '../../core/api/artifact-api.service';
import { EntityStateApiService } from '../../core/api/entity-state-api.service';
import { FactApiService } from '../../core/api/fact-api.service';
import { FactEnumValueApiService } from '../../core/api/fact-enum-value-api.service';
import { ActionApiService } from '../../core/api/action-api.service';
import { ScenarioApiService } from '../../core/api/scenario-api.service';
import { ScenarioDecisionApiService } from '../../core/api/scenario-decision-api.service';
import { ScenarioDecisionOptionApiService } from '../../core/api/scenario-decision-option-api.service';
import { ActionStateTransitionApiService } from '../../core/api/action-state-transition-api.service';

type StateConditionRow = { factId: Id | null; op: string; value: any };

@Component({
  selector: 'app-states',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './states.component.html',
  styleUrls: ['./states.component.scss'],
})
export class StatesComponent implements OnInit {
  artifacts: Artifact[] = [];
  facts: Fact[] = [];
  enumValues: FactEnumValue[] = [];
  states: EntityState[] = [];
  transitions: ActionStateTransition[] = [];
  actions: ActionDefinition[] = [];
  scenarios: Scenario[] = [];
  decisions: ScenarioDecision[] = [];
  options: ScenarioDecisionOption[] = [];
  transitionForm: any = this.emptyTransitionForm();
  operators = ['=', '!=', '>', '>=', '<', '<=', 'in', 'not in', 'exists', 'not exists', 'contains'];

  error: string | null = null;
  isLoading = false;
  form: any = this.emptyForm();
  rows: StateConditionRow[] = [];

  constructor(
    private artifactsApi: ArtifactApiService,
    private statesApi: EntityStateApiService,
    private factsApi: FactApiService,
    private enumValuesApi: FactEnumValueApiService,
    private actionsApi: ActionApiService,
    private scenariosApi: ScenarioApiService,
    private decisionsApi: ScenarioDecisionApiService,
    private optionsApi: ScenarioDecisionOptionApiService,
    private transitionsApi: ActionStateTransitionApiService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      artifacts: this.artifactsApi.list(),
      facts: this.factsApi.list(),
      enumValues: this.enumValuesApi.list(),
      actions: this.actionsApi.list(),
      scenarios: this.scenariosApi.list(),
      decisions: this.decisionsApi.list(),
      options: this.optionsApi.list(),
    }).subscribe({
      next: data => {
        this.artifacts = data.artifacts;
        this.facts = data.facts;
        this.enumValues = data.enumValues;
        this.actions = data.actions;
        this.scenarios = data.scenarios;
        this.decisions = data.decisions;
        this.options = data.options;
        if (this.artifacts.length === 1) this.form.artifactId = this.artifacts[0].id;
        this.load();
      },
      error: err => this.error = err?.message ?? 'خطا در خواندن داده‌های پایه',
    });
  }

  load(): void {
    this.isLoading = true;
    this.error = null;
    forkJoin({ states: this.statesApi.list(), transitions: this.transitionsApi.list() }).subscribe({
      next: x => { this.states = x.states; this.transitions = x.transitions; this.isLoading = false; },
      error: err => { this.error = err?.message ?? 'خطا در خواندن Stateها'; this.isLoading = false; },
    });
  }

  add(): void {
    if (!this.form.artifactId || !this.form.stateKey) return;
    if (!this.ensureValidJson()) return;
    this.statesApi.create({
      artifactId: Number(this.form.artifactId),
      stateKey: this.form.stateKey,
      titleFa: this.form.titleFa,
      conditionJson: this.form.conditionJson || '[]',
      description: this.form.description,
    }).subscribe({ next: () => { this.reset(); this.load(); }, error: err => this.error = err?.message ?? 'خطا در ثبت State' });
  }

  delete(id: Id): void {
    if (!confirm('State حذف شود؟')) return;
    this.statesApi.delete(id).subscribe({ next: () => this.load(), error: err => this.error = err?.message ?? 'خطا در حذف State' });
  }

  addRow(): void { this.rows.push({ factId: null, op: '=', value: '' }); this.rowsToJson(); }
  removeRow(index: number): void { this.rows.splice(index, 1); this.rowsToJson(); }
  onRowChanged(): void { this.rowsToJson(); }

  jsonToRows(): void {
    try {
      const parsed = JSON.parse(this.form.conditionJson || '[]');
      if (!Array.isArray(parsed)) { this.error = 'ConditionJson باید آرایه JSON باشد.'; return; }
      this.rows = parsed.map((x: any) => ({ factId: this.resolveFactId(x.factId, x.factKey), op: String(x.op ?? '='), value: this.valueToUi(x.value) }));
      this.error = null;
    } catch { this.error = 'ConditionJson معتبر نیست.'; }
  }

  rowsToJson(): void {
    const payload = this.rows
      .filter(r => r.factId)
      .map(r => {
        const fact = this.facts.find(f => f.id === Number(r.factId));
        return { factId: Number(r.factId), factKey: fact?.factKey, op: r.op || '=', value: this.uiToValue(r.value, r.op) };
      });
    this.form.conditionJson = JSON.stringify(payload);
  }

  valueOptionsFor(row: StateConditionRow): { value: string; label: string }[] {
    const fact = row.factId ? this.facts.find(x => x.id === Number(row.factId)) : null;
    if (!fact) return [];
    const enumValues = this.enumValues.filter(x => x.factId === fact.id).map(x => ({ value: x.value ?? x.enumKey, label: `${x.enumKey}${x.titleFa ? ' - ' + x.titleFa : ''}` }));
    if (enumValues.length > 0) return enumValues;
    if (Number(fact.valueType) === 4) return [{ value: 'true', label: 'true' }, { value: 'false', label: 'false' }];
    return [];
  }

  artifactLabel(id: Id): string { const a = this.artifacts.find(x => x.id === id); return a ? `${a.artifactKey} - ${a.titleFa || ''}` : String(id); }
  factLabel(f: Fact): string { return `${f.factKey}${f.meaning ? ' - ' + f.meaning : ''}`; }
  conditionJsonLabel(value: string | null | undefined): string {
    if (!value || value === '[]') return '—';
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return value;
      return parsed.map((x: any) => `${x.factKey ?? 'Fact#' + x.factId} ${x.op ?? '='} ${this.valueToUi(x.value)}`).join(' | ');
    } catch { return value; }
  }


  addTransition(): void {
    if (!this.transitionForm.actionId) return;
    this.transitionsApi.create({
      scenarioId: this.transitionForm.scenarioId ? Number(this.transitionForm.scenarioId) : null,
      actionId: Number(this.transitionForm.actionId),
      fromStateId: this.transitionForm.fromStateId ? Number(this.transitionForm.fromStateId) : null,
      toStateId: this.transitionForm.toStateId ? Number(this.transitionForm.toStateId) : null,
      decisionId: this.transitionForm.decisionId ? Number(this.transitionForm.decisionId) : null,
      decisionOptionId: this.transitionForm.decisionOptionId ? Number(this.transitionForm.decisionOptionId) : null,
      labelFa: this.transitionForm.labelFa,
      sortOrder: Number(this.transitionForm.sortOrder || 0),
      description: this.transitionForm.description,
    }).subscribe({ next: () => { this.transitionForm = this.emptyTransitionForm(); this.load(); }, error: err => this.error = err?.message ?? 'خطا در ثبت Transition' });
  }

  deleteTransition(id: Id): void {
    if (!confirm('Transition حذف شود؟')) return;
    this.transitionsApi.delete(id).subscribe({ next: () => this.load(), error: err => this.error = err?.message ?? 'خطا در حذف Transition' });
  }

  actionLabel(id: Id): string { const a = this.actions.find(x => x.id === id); return a ? `${a.actionKey} - ${a.titleFa || ''}` : String(id); }
  scenarioLabel(id: Id | null | undefined): string { if (!id) return '—'; const x = this.scenarios.find(s => s.id === id); return x ? `${x.scenarioKey} - ${x.titleFa || ''}` : String(id); }
  decisionLabel(id: Id | null | undefined): string { if (!id) return '—'; const x = this.decisions.find(d => d.id === id); return x ? `${x.decisionKey} - ${x.titleFa || ''}` : String(id); }
  optionLabel(id: Id | null | undefined): string { if (!id) return '—'; const x = this.options.find(o => o.id === id); return x ? `${x.optionKey} - ${x.titleFa || ''}` : String(id); }
  stateLabel(id: Id | null | undefined): string { if (!id) return '—'; const x = this.states.find(s => s.id === id); return x ? `${x.stateKey} - ${x.titleFa || ''}` : String(id); }

  private emptyForm(): any { return { artifactId: null, stateKey: '', titleFa: '', conditionJson: '[]', description: '' }; }
  private emptyTransitionForm(): any { return { scenarioId: null, actionId: null, fromStateId: null, toStateId: null, decisionId: null, decisionOptionId: null, labelFa: '', sortOrder: 0, description: '' }; }
  private reset(): void { this.form = this.emptyForm(); if (this.artifacts.length === 1) this.form.artifactId = this.artifacts[0].id; this.rows = []; }
  private ensureValidJson(): boolean { try { const p = JSON.parse(this.form.conditionJson || '[]'); if (!Array.isArray(p)) { this.error = 'ConditionJson باید آرایه JSON باشد.'; return false; } return true; } catch { this.error = 'ConditionJson معتبر نیست.'; return false; } }
  private resolveFactId(factId: any, factKey: any): Id | null { if (factId && this.facts.some(f => f.id === Number(factId))) return Number(factId); const f = this.facts.find(x => x.factKey === factKey); return f?.id ?? null; }
  private uiToValue(value: any, op: string): any { if (op === 'exists' || op === 'not exists') return null; if (value === 'true') return true; if (value === 'false') return false; return value; }
  private valueToUi(value: any): string { if (value == null) return ''; if (Array.isArray(value)) return value.join(','); return String(value); }
}
