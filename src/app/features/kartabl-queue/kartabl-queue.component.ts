import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Kartabl, Scenario, ScenarioDecision, ScenarioDecisionOption, WorkItem } from '../../core/types';
import { KartablApiService } from '../../core/api/kartabl-api.service';
import { ScenarioApiService } from '../../core/api/scenario-api.service';
import { ScenarioDecisionApiService, ScenarioDecisionDto } from '../../core/api/scenario-decision-api.service';
import { ScenarioDecisionOptionApiService, ScenarioDecisionOptionDto } from '../../core/api/scenario-decision-option-api.service';
import { WorkItemApiService } from '../../core/api/work-item-api.service';
import { SmartSelectComponent, SmartOption } from '../../shared/smart-select/smart-select.component';

type ExecuteDraft = { workItem: WorkItem; scenarioId: number | null; decisionOptionId: number | null; decisions: ScenarioDecisionDto[]; options: ScenarioDecisionOptionDto[] };

@Component({ selector: 'app-kartabl-queue', standalone: true, imports: [CommonModule, SmartSelectComponent], templateUrl: './kartabl-queue.component.html', styleUrls: ['./kartabl-queue.component.scss'] })
export class KartablQueueComponent implements OnInit {
  kartabls: Kartabl[] = [];
  scenarios: Scenario[] = [];
  rows: WorkItem[] = [];
  total = 0;
  selectedKartablId: number | null = null;
  kartablOptions: SmartOption[] = [];
  scenarioOptions: SmartOption[] = [];
  optionOptions: SmartOption[] = [];
  error: string | null = null;
  message: string | null = null;
  exec: ExecuteDraft | null = null;
  details: WorkItem | null = null;
  query = { ownerSubdomain: '', status: '', referenceNo: '', caseId: '', q: '', qField: 'all', qMode: 'contains', sort: '-updated', skip: '0', take: '100' };

  constructor(private kartablApi: KartablApiService, private scenarioApi: ScenarioApiService, private workItemApi: WorkItemApiService, private decisionApi: ScenarioDecisionApiService, private optionApi: ScenarioDecisionOptionApiService) {}
  ngOnInit(): void { this.loadLookups(); }

  loadLookups() {
    this.error = null;
    forkJoin({ kartabls: this.kartablApi.list(), scenarios: this.scenarioApi.list() }).subscribe({
      next: res => { this.kartabls = res.kartabls ?? []; this.scenarios = res.scenarios ?? []; this.kartablOptions = this.kartabls.map(k => ({ id: k.id, text: k.kartablKey, sub: k.titleFa ?? '' })); if (!this.selectedKartablId && this.kartabls.length) this.selectedKartablId = this.kartabls[0].id; this.reload(); },
      error: err => this.error = err?.message ?? 'خطا در دریافت اطلاعات پایه',
    });
  }

  reload() {
    this.error = null; this.message = null; this.exec = null;
    if (!this.selectedKartablId) { this.rows = []; this.total = 0; return; }
    this.kartablApi.workItems(this.selectedKartablId, { ownerSubdomain: this.query.ownerSubdomain, status: this.query.status, referenceNo: this.query.referenceNo, caseId: this.query.caseId, q: this.query.q, qField: this.query.qField as any, qMode: this.query.qMode as any, sort: this.query.sort, skip: Number(this.query.skip || 0), take: Number(this.query.take || 100) }).subscribe({
      next: res => { this.rows = res.items ?? []; this.total = res.total ?? this.rows.length; },
      error: err => this.error = err?.message ?? 'خطا در دریافت صف کارتابل',
    });
  }

  showDetails(w: WorkItem) { this.details = w; }
  prettyFacts(w: WorkItem | null): string { if (!w) return '{}'; try { return JSON.stringify(JSON.parse(w.factsJson || '{}'), null, 2); } catch { return w.factsJson || '{}'; } }

  kartablTitle(id: number | null | undefined) { if (!id) return '—'; const k = this.kartabls.find(x => x.id === id); return k ? `${k.kartablKey}${k.titleFa ? ' — ' + k.titleFa : ''}` : String(id); }

  startExecute(w: WorkItem) {
    const available = this.scenarios.filter(s => (s.kartablIds ?? []).includes(w.currentKartablId ?? -1));
    this.scenarioOptions = available.map(s => ({ id: s.id, text: s.scenarioKey, sub: s.titleFa ?? '' }));
    this.optionOptions = [];
    this.exec = { workItem: w, scenarioId: this.scenarioOptions[0]?.id ?? null, decisionOptionId: null, decisions: [], options: [] };
    if (this.exec.scenarioId) this.loadOptions(this.exec.scenarioId);
  }

  loadOptions(scenarioId: number | null) {
    if (!this.exec || !scenarioId) return;
    this.exec.scenarioId = scenarioId;
    this.exec.decisionOptionId = null;
    this.optionOptions = [];
    this.decisionApi.list(scenarioId).subscribe({
      next: decisions => {
        this.exec!.decisions = decisions ?? [];
        if (!decisions?.length) return;
        forkJoin(decisions.map(d => this.optionApi.list(d.id))).subscribe({
          next: groups => { this.exec!.options = groups.flat(); this.optionOptions = this.exec!.options.map(o => ({ id: o.id, text: o.optionKey, sub: o.titleFa ?? '' })); },
          error: err => this.error = err?.message ?? 'خطا در دریافت Optionها',
        });
      },
      error: err => this.error = err?.message ?? 'خطا در دریافت Decisionها',
    });
  }

  execute() {
    if (!this.exec?.scenarioId) { this.error = 'Scenario انتخاب نشده است.'; return; }
    this.workItemApi.executeScenario(this.exec.workItem.id, { scenarioId: this.exec.scenarioId, decisionOptionId: this.exec.decisionOptionId || undefined }).subscribe({
      next: res => { this.message = `اجرا شد. Kartabl: ${res.beforeKartablId ?? '—'} → ${res.afterKartablId ?? '—'}`; this.reload(); },
      error: err => this.error = err?.error ?? err?.message ?? 'خطا در اجرای سناریو',
    });
  }
}
