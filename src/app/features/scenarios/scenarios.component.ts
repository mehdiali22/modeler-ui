import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { ActionDefinition, Condition, Fact, Kartabl, Scenario, Stage } from '../../core/types';
import { ActionApiService } from '../../core/api/action-api.service';
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
  imports: [CommonModule, SmartSelectComponent, RefMultiSelectComponent],
  templateUrl: './scenarios.component.html',
  styleUrls: ['./scenarios.component.scss'],
})
export class ScenariosComponent implements OnInit {
  rows: Scenario[] = [];
  stages: Stage[] = [];
  kartabls: Kartabl[] = [];
  conditions: Condition[] = [];
  actions: ActionDefinition[] = [];
  facts: Fact[] = [];
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
    private stagesApi: StageApiService,
    private kartablApi: KartablApiService,
    private conditionsApi: ConditionApiService,
    private actionsApi: ActionApiService,
    private factsApi: FactApiService,
  ) {}

  ngOnInit(): void { this.reload(); }

  reload() {
    this.error = null;
    forkJoin({ scenarios: this.scenariosApi.list(), stages: this.stagesApi.list(), kartabls: this.kartablApi.list(), conditions: this.conditionsApi.list(), actions: this.actionsApi.list(), facts: this.factsApi.list() }).subscribe({
      next: res => {
        this.rows = res.scenarios ?? [];
        this.stages = res.stages ?? [];
        this.kartabls = res.kartabls ?? [];
        this.conditions = res.conditions ?? [];
        this.actions = res.actions ?? [];
        this.facts = res.facts ?? [];
        this.rebuildOptions();
        if (this.editingId != null && !this.rows.some(x => x.id === this.editingId)) this.cancelEdit();
      },
      error: err => this.error = err?.message ?? 'خطا در ارتباط با API',
    });
  }

  private rebuildOptions() {
    this.stageOptions = this.stages.map(s => ({ id: s.id, text: s.stageKey, sub: s.titleFa ?? '' }));
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
    this.scenariosApi.update(id, payload).subscribe({ next: updated => { this.rows = this.rows.map(x => x.id === id ? updated : x); this.cancelEdit(); }, error: err => this.error = err?.message ?? 'خطا در ویرایش' });
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
  actionTitle(id: number): string { return this.actions.find(a => a.id === id)?.actionKey ?? String(id); }

  removeScenario(id: number) {
    this.error = null;
    this.scenariosApi.delete(id).subscribe({ next: () => { this.rows = this.rows.filter(x => x.id !== id); if (this.editingId === id) this.cancelEdit(); }, error: err => this.error = err?.message ?? 'خطا در حذف' });
  }
}
