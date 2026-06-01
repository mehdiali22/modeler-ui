import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { ActionDefinition, Condition, Fact, Kartabl, Process, Scenario, Stage, SubProcess } from '../../core/types';
import { ActionApiService } from '../../core/api/action-api.service';
import { ProcessApiService } from '../../core/api/process-api.service';
import { SubProcessApiService } from '../../core/api/sub-process-api.service';
import { ScenarioDecisionApiService, ScenarioDecisionDto } from '../../core/api/scenario-decision-api.service';
import { ScenarioDecisionOptionApiService, ScenarioDecisionOptionDto } from '../../core/api/scenario-decision-option-api.service';
import { FactApiService } from '../../core/api/fact-api.service';
import { ConditionApiService } from '../../core/api/condition-api.service';
import { KartablApiService } from '../../core/api/kartabl-api.service';
import { ScenarioApiService } from '../../core/api/scenario-api.service';
import { StageApiService } from '../../core/api/stage-api.service';
import { RefMultiSelectComponent, RefOption } from '../../shared/ref-multi-select/ref-multi-select.component';
import { SmartSelectComponent, SmartOption } from '../../shared/smart-select/smart-select.component';

type ScenarioEdit = Scenario & { stageId: number | null; [key: string]: any };

@Component({
  selector: 'app-scenarios',
  standalone: true,
  imports: [CommonModule, RouterModule, SmartSelectComponent, RefMultiSelectComponent],
  templateUrl: './scenarios.component.html',
  styleUrls: ['./scenarios.component.scss'],
})
export class ScenariosComponent implements OnInit {
  rows: Scenario[] = [];
  processes: Process[] = [];
  subProcesses: SubProcess[] = [];
  stages: Stage[] = [];
  kartabls: Kartabl[] = [];
  conditions: Condition[] = [];
  actions: ActionDefinition[] = [];
  facts: Fact[] = [];
  decisions: ScenarioDecisionDto[] = [];
  decisionOptions: ScenarioDecisionOptionDto[] = [];
  stageOptions: SmartOption[] = [];
  condOptions: RefOption[] = [];
  kartablOptions: RefOption[] = [];
  actionOptions: { id: number; text: string; sub?: string }[] = [];
  factOptions: { id: number; text: string; sub?: string }[] = [];
  q = '';
  error: string | null = null;
  editingId: number | null = null;
  edit: ScenarioEdit | null = null;
  scenarioPreconditionIds: number[] = [];
  scenarioKartablIds: number[] = [];
  factChangesJson = '[]';

  constructor(
    private scenariosApi: ScenarioApiService,
    private processesApi: ProcessApiService,
    private subProcessesApi: SubProcessApiService,
    private stagesApi: StageApiService,
    private kartablApi: KartablApiService,
    private conditionsApi: ConditionApiService,
    private actionsApi: ActionApiService,
    private factsApi: FactApiService,
    private decisionsApi: ScenarioDecisionApiService,
    private decisionOptionsApi: ScenarioDecisionOptionApiService,
  ) {}

  ngOnInit(): void { this.reload(); }

  reload() {
    this.error = null;
    forkJoin({ scenarios: this.scenariosApi.list(), processes: this.processesApi.list(), subProcesses: this.subProcessesApi.list(), stages: this.stagesApi.list(), kartabls: this.kartablApi.list(), conditions: this.conditionsApi.list(), actions: this.actionsApi.list(), facts: this.factsApi.list(), decisions: this.decisionsApi.list(), decisionOptions: this.decisionOptionsApi.list() }).subscribe({
      next: res => {
        this.rows = res.scenarios ?? [];
        this.processes = res.processes ?? [];
        this.subProcesses = res.subProcesses ?? [];
        this.stages = res.stages ?? [];
        this.kartabls = res.kartabls ?? [];
        this.conditions = res.conditions ?? [];
        this.actions = res.actions ?? [];
        this.facts = res.facts ?? [];
        this.decisions = res.decisions ?? [];
        this.decisionOptions = res.decisionOptions ?? [];
        this.rebuildOptions();
        if (this.editingId != null && !this.rows.some(x => x.id === this.editingId)) this.cancelEdit();
      },
      error: err => this.error = err?.message ?? 'خطا در ارتباط با API',
    });
  }

  private rebuildOptions() {
    this.stageOptions = this.stages.map(s => ({ id: s.id, text: s.stageKey, sub: `${this.processKey(s.processId)}${s.subProcessId ? ' / ' + this.subProcessKey(s.subProcessId) : ''}${s.titleFa ? ' — ' + s.titleFa : ''}` }));
    this.kartablOptions = this.kartabls.map(k => ({ id: k.id, text: k.kartablKey, sub: k.titleFa ?? '' }));
    this.condOptions = this.conditions.map(c => ({ id: c.id, text: c.conditionKey, sub: c.titleFa ?? '' }));
    this.actionOptions = this.actions.map(a => ({ id: a.id, text: a.actionKey, sub: a.titleFa ?? '' }));
    this.factOptions = this.facts.map(f => ({ id: f.id, text: f.factKey, sub: f.meaning ?? '' }));
  }

  get filtered(): Scenario[] {
    const q = this.q.trim().toLowerCase();
    if (!q) return this.rows;
    return this.rows.filter(r => `${r.scenarioKey} ${r.titleFa ?? ''} ${r.ownerSubdomain ?? ''}`.toLowerCase().includes(q));
  }

  stageTitle(stageId: number | null | undefined): string {
    if (!stageId) return '—';
    const s = this.stages.find(x => x.id === stageId);
    return s ? `${s.stageKey}${s.titleFa ? ' — ' + s.titleFa : ''}` : '—';
  }

  kartablTitles(ids: number[] | null | undefined): string {
    const list = ids ?? [];
    if (!list.length) return '—';
    return list.map(id => this.kartabls.find(k => k.id === id)?.kartablKey ?? String(id)).join(', ');
  }


  processKey(processId: number | null | undefined): string {
    if (!processId) return '—';
    return this.processes.find(x => x.id === processId)?.processKey ?? String(processId);
  }

  processTitle(processId: number | null | undefined): string {
    if (!processId) return '—';
    const p = this.processes.find(x => x.id === processId);
    return p ? `${p.processKey}${p.titleFa ? ' — ' + p.titleFa : ''}` : '—';
  }

  subProcessKey(subProcessId: number | null | undefined): string {
    if (!subProcessId) return '—';
    return this.subProcesses.find(x => x.id === subProcessId)?.subProcessKey ?? String(subProcessId);
  }

  subProcessTitle(subProcessId: number | null | undefined): string {
    if (!subProcessId) return '—';
    const sp = this.subProcesses.find(x => x.id === subProcessId);
    return sp ? `${sp.subProcessKey}${sp.titleFa ? ' — ' + sp.titleFa : ''}` : '—';
  }

  stageById(stageId: number | null | undefined): Stage | undefined {
    if (!stageId) return undefined;
    return this.stages.find(x => x.id === stageId);
  }

  scenarioProcessTitle(s: Scenario | ScenarioEdit | null | undefined): string {
    const stage = this.stageById(s?.stageId);
    return this.processTitle(stage?.processId);
  }

  scenarioSubProcessTitle(s: Scenario | ScenarioEdit | null | undefined): string {
    const stage = this.stageById(s?.stageId);
    return this.subProcessTitle(stage?.subProcessId ?? null);
  }

  actionTitle(actionId: number | null | undefined): string {
    if (!actionId) return '—';
    const a = this.actions.find(x => x.id === actionId);
    return a ? `${a.actionKey}${a.titleFa ? ' — ' + a.titleFa : ''}` : String(actionId);
  }

  scenarioDecisions(scenarioId: number | null | undefined): ScenarioDecisionDto[] {
    if (!scenarioId) return [];
    return this.decisions.filter(x => x.scenarioId === scenarioId);
  }

  scenarioDecisionCount(scenarioId: number | null | undefined): number {
    return this.scenarioDecisions(scenarioId).length;
  }

  decisionOptionsOf(decisionId: number | null | undefined): ScenarioDecisionOptionDto[] {
    if (!decisionId) return [];
    return this.decisionOptions.filter(x => x.scenarioDecisionId === decisionId);
  }

  optionActionTitles(option: ScenarioDecisionOptionDto): string {
    const ids = this.parseIdsJson(option.actionIdsJson);
    if (!ids.length) return '—';
    return ids.map(id => this.actionTitle(id)).join(' | ');
  }


  actionIdsOf(option: ScenarioDecisionOptionDto): number[] {
    return this.parseIdsJson(option.actionIdsJson);
  }

  actionDetailParams(actionId: number | null | undefined): { id?: number } {
    return actionId ? { id: actionId } : {};
  }

  stageDetailParams(stageId: number | null | undefined): { id?: number } {
    return stageId ? { id: stageId } : {};
  }

  decisionDetailParams(decisionId: number | null | undefined): { scenarioId?: number; decisionId?: number } {
    if (!decisionId) return this.edit?.id ? { scenarioId: this.edit.id } : {};
    const decision = this.decisions.find(x => x.id === decisionId);
    return decision?.scenarioId ? { scenarioId: decision.scenarioId, decisionId } : { decisionId };
  }


  parseIdsJson(json: string | null | undefined): number[] {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) return parsed.map(x => Number(x)).filter(x => Number.isFinite(x) && x > 0);
    } catch {}
    return [];
  }


  scenarioActionNames(s: Scenario | null | undefined): string {
    const actions = s?.actions ?? [];
    if (!actions.length) return '—';
    return actions.map((a: any) => this.actionTitle(a.actionId)).join(' | ');
  }

  scenarioDecisionNames(scenarioId: number | null | undefined): string {
    const list = this.scenarioDecisions(scenarioId);
    if (!list.length) return '—';
    return list.map(d => this.decisionTitle(d.id)).join(' | ');
  }

  decisionTitle(decisionId: number | null | undefined): string {
    if (!decisionId) return '—';
    const d = this.decisions.find(x => x.id === decisionId);
    return d ? `${d.decisionKey}${d.titleFa ? ' — ' + d.titleFa : ''}` : String(decisionId);
  }

  optionTitle(option: ScenarioDecisionOptionDto | null | undefined): string {
    if (!option) return '—';
    return `${option.optionKey}${option.titleFa ? ' — ' + option.titleFa : ''}`;
  }

  scenarioActionsCount(s: Scenario | null | undefined): number {
    return (s?.actions ?? []).length;
  }

  addScenario() {
    this.error = null;
    const firstStageId = this.stages?.[0]?.id ?? null;
    if (!firstStageId) { this.error = 'حداقل یک Stage لازم است.'; return; }
    const payload: Omit<Scenario, 'id'> = { scenarioKey: 'NEW_SCENARIO', stageId: firstStageId, titleFa: 'سناریوی جدید', description: '', ownerSubdomain: '', kartablIds: [], preconditionIds: [], actions: [], factChanges: [] };
    this.scenariosApi.create(payload).subscribe({ next: created => { this.rows = [created, ...this.rows]; this.editRow(created.id); }, error: err => this.error = err?.message ?? 'خطا در ایجاد' });
  }

  editRow(id: number) {
    this.editingId = id;
    const src = this.rows.find(x => x.id === id);
    if (!src) { this.edit = null; return; }
    const clone = structuredClone(src) as Scenario;
    this.edit = { ...clone, stageId: clone.stageId ?? null, kartablIds: clone.kartablIds ?? [], preconditionIds: clone.preconditionIds ?? [], actions: clone.actions ?? [], factChanges: clone.factChanges ?? [] };
    this.scenarioPreconditionIds = [...(this.edit.preconditionIds ?? [])];
    this.scenarioKartablIds = [...(this.edit.kartablIds ?? [])];
    this.refreshFactChangesJson();
  }

  cancelEdit() { this.editingId = null; this.edit = null; this.scenarioPreconditionIds = []; this.scenarioKartablIds = []; this.factChangesJson = '[]'; }

  closeEditor() {
    this.cancelEdit();
    this.reload();
  }

  saveEdit() {
    if (!this.edit) return;
    this.error = null;
    this.edit.preconditionIds = [...this.scenarioPreconditionIds];
    this.edit.kartablIds = [...this.scenarioKartablIds];
    this.normalizeFactChangeSortOrder();
    this.edit.scenarioKey = this.edit.scenarioKey.trim();
    this.edit.titleFa = this.edit.titleFa?.trim() || undefined;
    this.edit.description = this.edit.description?.trim() || undefined;
    this.edit.ownerSubdomain = this.edit.ownerSubdomain?.trim() || undefined;
    if (!this.edit.scenarioKey) { this.error = 'Scenario Key الزامی است.'; return; }
    if (this.edit.stageId == null) { this.error = 'Stage الزامی است.'; return; }
    const id = this.edit.id;
    const payload: Omit<Scenario, 'id'> = { scenarioKey: this.edit.scenarioKey, titleFa: this.edit.titleFa, description: this.edit.description, ownerSubdomain: this.edit.ownerSubdomain, stageId: this.edit.stageId, kartablIds: this.edit.kartablIds ?? [], preconditionIds: this.edit.preconditionIds ?? [], actions: this.edit.actions ?? [], factChanges: this.edit.factChanges ?? [] };
    this.scenariosApi.update(id, payload).subscribe({ next: () => { this.cancelEdit(); this.reload(); }, error: err => this.error = err?.message ?? 'خطا در ویرایش' });
  }

  addFactChange() {
    if (!this.edit) return;
    const factId = this.facts[0]?.id;
    if (!factId) { this.error = 'برای FactChange حداقل یک Fact لازم است.'; return; }
    this.edit.factChanges = [...(this.edit.factChanges ?? []), { factId, op: 'Set', value: '', sortOrder: (this.edit.factChanges ?? []).length + 1 }];
    this.refreshFactChangesJson();
  }

  removeFactChange(index: number) {
    if (!this.edit) return;
    this.edit.factChanges = (this.edit.factChanges ?? []).filter((_: any, i: number) => i !== index);
    this.normalizeFactChangeSortOrder();
    this.refreshFactChangesJson();
  }


  onFactChangeRowChanged() {
    this.normalizeFactChangeSortOrder();
    this.refreshFactChangesJson();
  }

  refreshFactChangesJson() {
    if (!this.edit) { this.factChangesJson = '[]'; return; }
    this.factChangesJson = this.factChangesToJson(this.edit.factChanges ?? []);
  }

  applyFactChangesJson() {
    if (!this.edit) return;
    const rows = this.parseFactChangesJson(this.factChangesJson);
    if (!rows) return;
    this.edit.factChanges = rows;
    this.normalizeFactChangeSortOrder();
    this.refreshFactChangesJson();
  }

  private normalizeFactChangeSortOrder() {
    if (!this.edit) return;
    this.edit.factChanges = (this.edit.factChanges ?? []).map((x: any, i: number) => ({ ...x, sortOrder: i + 1 }));
  }

  private factChangesToJson(rows: any[]): string {
    const body = (rows ?? []).map((fc: any, index: number) => ({
      factKey: this.factKey(fc.factId),
      op: fc.op ?? 'Set',
      value: fc.value ?? '',
      sortOrder: fc.sortOrder ?? index + 1,
    }));
    return JSON.stringify(body, null, 2);
  }

  private parseFactChangesJson(json: string): any[] | null {
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

      const rows = items.map((item: any, index: number) => {
        const factId = Number(item.factId ?? this.factIdByKey(String(item.factKey ?? '')));
        if (!factId) throw new Error(`Fact not found: ${item.factKey ?? item.factId}`);
        const op = String(item.op ?? 'Set');
        if (!['Set', 'Unset', 'Inc', 'Dec'].includes(op)) throw new Error(`Invalid op: ${op}`);
        const rawValue = item.value;
        const value = rawValue == null ? '' : (typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue));
        return { factId, op: op as any, value, sortOrder: Number(item.sortOrder ?? index + 1) };
      });
      return rows;
    } catch (e: any) {
      this.error = e?.message ?? 'JSON نامعتبر است.';
      return null;
    }
  }

  private factIdByKey(key: string): number | null {
    return this.facts.find(f => f.factKey === key)?.id ?? null;
  }

  private factKey(id: number): string {
    return this.facts.find(f => f.id === id)?.factKey ?? String(id);
  }

  addActionRef() {
    if (!this.edit) return;
    const actionId = this.actions[0]?.id;
    if (!actionId) { this.error = 'برای ScenarioAction حداقل یک Action لازم است.'; return; }
    this.edit.actions = [...(this.edit.actions ?? []), { actionId, paramsJson: '{}' }];
  }

  removeActionRef(index: number) {
    if (!this.edit) return;
    this.edit.actions = (this.edit.actions ?? []).filter((_: any, i: number) => i !== index);
  }

  factTitle(id: number): string { return this.facts.find(f => f.id === id)?.factKey ?? String(id); }

  removeScenario(id: number) {
    this.error = null;
    this.scenariosApi.delete(id).subscribe({ next: () => { this.rows = this.rows.filter(x => x.id !== id); if (this.editingId === id) this.cancelEdit(); }, error: err => this.error = err?.message ?? 'خطا در حذف' });
  }
}
