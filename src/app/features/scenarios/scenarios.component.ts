import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ActionDefinition, ActionStateTransition, Condition, EntityState, Fact, Kartabl, Process, Scenario, Stage, SubProcess } from '../../core/types';
import { ActionApiService } from '../../core/api/action-api.service';
import { ActionStateTransitionApiService } from '../../core/api/action-state-transition-api.service';
import { EntityStateApiService } from '../../core/api/entity-state-api.service';
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
  actionStateTransitions: ActionStateTransition[] = [];
  entityStates: EntityState[] = [];
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
  private mermaidFrameUrlCache = new Map<string, SafeResourceUrl>();

  constructor(
    private scenariosApi: ScenarioApiService,
    private processesApi: ProcessApiService,
    private subProcessesApi: SubProcessApiService,
    private stagesApi: StageApiService,
    private kartablApi: KartablApiService,
    private conditionsApi: ConditionApiService,
    private actionsApi: ActionApiService,
    private actionStateTransitionsApi: ActionStateTransitionApiService,
    private entityStatesApi: EntityStateApiService,
    private factsApi: FactApiService,
    private decisionsApi: ScenarioDecisionApiService,
    private decisionOptionsApi: ScenarioDecisionOptionApiService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void { this.reload(); }

  reload() {
    this.error = null;
    forkJoin({ scenarios: this.scenariosApi.list(), processes: this.processesApi.list(), subProcesses: this.subProcessesApi.list(), stages: this.stagesApi.list(), kartabls: this.kartablApi.list(), conditions: this.conditionsApi.list(), actions: this.actionsApi.list(), facts: this.factsApi.list(), decisions: this.decisionsApi.list(), decisionOptions: this.decisionOptionsApi.list(), actionStateTransitions: this.actionStateTransitionsApi.list(), entityStates: this.entityStatesApi.list().pipe(catchError(() => of([] as EntityState[]))) }).subscribe({
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
        this.actionStateTransitions = res.actionStateTransitions ?? [];
        this.entityStates = res.entityStates ?? [];
        this.mermaidFrameUrlCache.clear();
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

  scenarioTitle(s: Scenario | ScenarioEdit | null | undefined): string {
    if (!s) return '—';
    return s.titleFa || s.scenarioKey || `Scenario #${s.id}`;
  }

  stageTitle(stageId: number | null | undefined): string {
    if (!stageId) return '—';
    const s = this.stages.find(x => x.id === stageId);
    return s ? (s.titleFa || s.stageKey) : '—';
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
    return p ? (p.titleFa || p.processKey) : '—';
  }

  subProcessKey(subProcessId: number | null | undefined): string {
    if (!subProcessId) return '—';
    return this.subProcesses.find(x => x.id === subProcessId)?.subProcessKey ?? String(subProcessId);
  }

  subProcessTitle(subProcessId: number | null | undefined): string {
    if (!subProcessId) return '—';
    const sp = this.subProcesses.find(x => x.id === subProcessId);
    return sp ? (sp.titleFa || sp.subProcessKey) : '—';
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
    return a ? (a.titleFa || a.actionKey) : String(actionId);
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
    const ids = this.scenarioActionIds(s?.id, s);
    if (!ids.length) return '—';
    return ids.map(id => this.actionTitle(id)).join(' | ');
  }

  scenarioActionIds(scenarioId: number | null | undefined, scenario?: Scenario | ScenarioEdit | null): number[] {
    const result: number[] = [];
    const seen = new Set<number>();
    const add = (id: number | null | undefined) => {
      const value = Number(id);
      if (!Number.isFinite(value) || value <= 0 || seen.has(value)) return;
      seen.add(value);
      result.push(value);
    };

    for (const a of (scenario?.actions ?? [])) add((a as any).actionId);

    if (scenarioId) {
      for (const t of this.actionStateTransitions.filter(x => x.scenarioId === scenarioId)) add(t.actionId);

      for (const d of this.scenarioDecisions(scenarioId)) {
        for (const o of this.decisionOptionsOf(d.id)) {
          for (const actionId of this.actionIdsOf(o)) add(actionId);
        }
      }
    }

    return result;
  }



  normalScenarioTransitions(scenarioId: number | null | undefined): ActionStateTransition[] {
    return this.scenarioTransitions(scenarioId).filter(t => !t.decisionOptionId);
  }

  decisionTransitions(scenarioId: number | null | undefined, decisionId: number | null | undefined): ActionStateTransition[] {
    if (!scenarioId || !decisionId) return [];
    return this.scenarioTransitions(scenarioId).filter(t => t.decisionId === decisionId && !!t.decisionOptionId);
  }

  firstNormalTransition(scenarioId: number | null | undefined): ActionStateTransition | null {
    return this.normalScenarioTransitions(scenarioId)[0] ?? null;
  }

  lastNormalTransition(scenarioId: number | null | undefined): ActionStateTransition | null {
    const list = this.normalScenarioTransitions(scenarioId);
    return list.length ? list[list.length - 1] : null;
  }

  hasScenarioGraph(scenarioId: number | null | undefined): boolean {
    if (!scenarioId) return false;
    return this.scenarioTransitions(scenarioId).length > 0 || this.scenarioDecisions(scenarioId).length > 0;
  }

  graphDecisionSourceStateId(scenarioId: number | null | undefined, decisionId: number | null | undefined): number | null {
    if (!scenarioId) return null;
    const entry = this.scenarioTransitions(scenarioId).find(t => t.decisionId === decisionId && !t.decisionOptionId && t.toStateId);
    if (entry?.toStateId) return entry.toStateId;
    return this.lastNormalTransition(scenarioId)?.toStateId ?? null;
  }

  optionLabelForTransition(t: ActionStateTransition): string {
    const option = this.decisionOptions.find(x => x.id === t.decisionOptionId);
    if (!option) return t.labelFa || 'Option';
    const key = option.optionKey ?? 'Option';
    return option.titleFa ? `${key} / ${option.titleFa}` : key;
  }


  scenarioMermaidSource(scenarioId: number | null | undefined): string {
    if (!scenarioId) return 'flowchart TB\n  Empty["سناریو انتخاب نشده است"]';

    const lines: string[] = [
      'flowchart TB',
      '  %% Generated inside Scenario modal',
      '  classDef stateNode fill:#EEF2FF,stroke:#4169D8,stroke-width:2px,color:#111827;',
      '  classDef actionNode fill:#FFFFFF,stroke:#64748B,stroke-width:1px,color:#111827;',
      '  classDef decisionNode fill:#FFF7E6,stroke:#D48806,stroke-width:2px,color:#111827;',
    ];

    const emitted = new Set<string>();
    const emit = (line: string) => {
      if (!emitted.has(line)) {
        emitted.add(line);
        lines.push(line);
      }
    };

    for (const t of this.normalScenarioTransitions(scenarioId)) {
      if (t.fromStateId) this.emitMermaidState(emit, t.fromStateId);
      this.emitMermaidAction(emit, t.actionId);
      if (t.toStateId) this.emitMermaidState(emit, t.toStateId);

      if (t.fromStateId) emit(`  ${this.mermaidStateId(t.fromStateId)} --> ${this.mermaidActionId(t.actionId)}`);
      if (t.toStateId) emit(`  ${this.mermaidActionId(t.actionId)} --> ${this.mermaidStateId(t.toStateId)}`);
    }

    for (const d of this.scenarioDecisions(scenarioId)) {
      this.emitMermaidDecision(emit, d.id);
      const sourceStateId = this.graphDecisionSourceStateId(scenarioId, d.id);
      if (sourceStateId) {
        this.emitMermaidState(emit, sourceStateId);
        emit(`  ${this.mermaidStateId(sourceStateId)} --> ${this.mermaidDecisionId(d.id)}`);
      }

      for (const t of this.decisionTransitions(scenarioId, d.id)) {
        this.emitMermaidAction(emit, t.actionId);
        if (t.toStateId) this.emitMermaidState(emit, t.toStateId);
        const label = this.mermaidLabel(this.optionTitle(this.decisionOptions.find(x => x.id === t.decisionOptionId)));
        emit(`  ${this.mermaidDecisionId(d.id)} -->|"${label}"| ${this.mermaidActionId(t.actionId)}`);
        if (t.toStateId) emit(`  ${this.mermaidActionId(t.actionId)} --> ${this.mermaidStateId(t.toStateId)}`);
      }
    }

    if (lines.length <= 6) lines.push('  Empty["برای این سناریو State Transition ثبت نشده است"]');
    return lines.join('\n');
  }

  scenarioMermaidFrameUrl(scenarioId: number | null | undefined): SafeResourceUrl {
    const source = this.scenarioMermaidSource(scenarioId);
    const cacheKey = `${scenarioId ?? 'none'}::${source}`;
    const cached = this.mermaidFrameUrlCache.get(cacheKey);
    if (cached) return cached;

    const html = this.scenarioMermaidIframeHtmlFromSource(source);
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
    this.mermaidFrameUrlCache.clear();
    this.mermaidFrameUrlCache.set(cacheKey, safeUrl);
    return safeUrl;
  }

  private scenarioMermaidIframeHtmlFromSource(source: string): string {
    const src = this.escapeHtml(source);
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html, body { margin: 0; padding: 0; min-height: 100%; background: #1f2233; font-family: Vazirmatn, Tahoma, Arial, sans-serif; font-size: 18px; font-weight: 400; }
  body { display: flex; align-items: flex-start; justify-content: center; }
  .wrap { width: 100%; min-height: 520px; padding: 24px; box-sizing: border-box; overflow: auto; }
  .mermaid { display: flex; justify-content: center; min-width: 900px; font-family: Vazirmatn, Tahoma, Arial, sans-serif; font-size: 18px; font-weight: 400; }
  .mermaid svg, .mermaid text, .mermaid span, .mermaid .nodeLabel, .mermaid .edgeLabel { font-family: Vazirmatn, Tahoma, Arial, sans-serif !important; font-size: 18px !important; font-weight: 400 !important; }
  .error { direction: rtl; color: #fecaca; background: #3f1d2b; border: 1px solid #fb7185; border-radius: 12px; padding: 14px; white-space: pre-wrap; }
</style>
</head>
<body>
<div class="wrap">
<pre class="mermaid">${src}</pre>
</div>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
  try {
    mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose', flowchart: { curve: 'basis', htmlLabels: true, useMaxWidth: true } });
  } catch (e) {
    document.body.innerHTML = '<div class="wrap"><div class="error">Mermaid render error\\n' + String(e) + '</div></div>';
  }
</script>
</body>
</html>`;
  }

  private emitMermaidState(emit: (line: string) => void, stateId: number): void {
    emit(`  ${this.mermaidStateId(stateId)}["${this.mermaidLabel(this.stateTitle(stateId))}"]:::stateNode`);
  }

  private emitMermaidAction(emit: (line: string) => void, actionId: number): void {
    emit(`  ${this.mermaidActionId(actionId)}(["${this.mermaidLabel(this.actionTitle(actionId))}"]):::actionNode`);
  }

  private emitMermaidDecision(emit: (line: string) => void, decisionId: number): void {
    emit(`  ${this.mermaidDecisionId(decisionId)}{"${this.mermaidLabel(this.decisionTitle(decisionId))}"}:::decisionNode`);
  }

  private mermaidStateId(id: number): string { return `STATE_${id}`; }
  private mermaidActionId(id: number): string { return `ACT_${id}`; }
  private mermaidDecisionId(id: number): string { return `DEC_${id}`; }

  private mermaidLabel(value: string | null | undefined): string {
    return String(value ?? '—')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '#quot;')
      .replace(/\n/g, '<br/>')
      .trim();
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }


  scenarioActionSources(scenarioId: number | null | undefined, actionId: number): string {
    const sources: string[] = [];
    const actionIdNumber = Number(actionId);
    const hasManual = this.edit?.actions?.some((a: any) => Number(a.actionId) === actionIdNumber);
    if (hasManual) sources.push('Scenario Action');

    if (scenarioId && this.actionStateTransitions.some(t => t.scenarioId === scenarioId && t.actionId === actionIdNumber)) {
      sources.push('State Transition');
    }

    if (scenarioId) {
      const optionTitles: string[] = [];
      for (const d of this.scenarioDecisions(scenarioId)) {
        for (const o of this.decisionOptionsOf(d.id)) {
          if (this.actionIdsOf(o).includes(actionIdNumber)) optionTitles.push(`${this.decisionTitle(d.id)}/${this.optionTitle(o)}`);
        }
      }
      if (optionTitles.length) sources.push(`Decision Option: ${optionTitles.join(', ')}`);
    }

    return sources.length ? sources.join(' | ') : '—';
  }


  scenarioTransitions(scenarioId: number | null | undefined): ActionStateTransition[] {
    if (!scenarioId) return [];
    return this.actionStateTransitions
      .filter(x => x.scenarioId === scenarioId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);
  }

  stateTitle(stateId: number | null | undefined): string {
    if (!stateId) return '—';
    const s = this.entityStates.find(x => x.id === stateId);
    if (!s) return `State #${stateId}`;
    return s.titleFa || s.stateKey;
  }

  stateKey(stateId: number | null | undefined): string {
    if (!stateId) return '—';
    return this.entityStates.find(x => x.id === stateId)?.stateKey ?? `State #${stateId}`;
  }

  transitionDecisionLabel(t: ActionStateTransition): string {
    const decision = this.decisionTitle(t.decisionId);
    if (decision === '—') return '—';
    const option = this.decisionOptions.find(x => x.id === t.decisionOptionId);
    return option ? `${decision} / ${this.optionTitle(option)}` : decision;
  }

  transitionLabel(t: ActionStateTransition): string {
    const parts = [t.labelFa, this.transitionDecisionLabel(t)].filter(x => x && x !== '—');
    return parts.length ? parts.join(' | ') : '—';
  }

  scenarioDecisionNames(scenarioId: number | null | undefined): string {
    const list = this.scenarioDecisions(scenarioId);
    if (!list.length) return '—';
    return list.map(d => this.decisionTitle(d.id)).join(' | ');
  }

  decisionTitle(decisionId: number | null | undefined): string {
    if (!decisionId) return '—';
    const d = this.decisions.find(x => x.id === decisionId);
    return d ? (d.titleFa || d.decisionKey) : String(decisionId);
  }

  optionTitle(option: ScenarioDecisionOptionDto | null | undefined): string {
    if (!option) return '—';
    return option.titleFa || option.optionKey;
  }

  scenarioActionsCount(s: Scenario | null | undefined): number {
    return this.scenarioActionIds(s?.id, s).length;
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
