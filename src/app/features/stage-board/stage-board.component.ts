import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import {
  EventDefinition,
  EventTriggerLink,
  Process,
  Scenario,
  Stage,
  TriggerDefinition,
} from '../../core/types';

import { forkJoin } from 'rxjs';
import { ProcessApiService } from '../../core/api/process-api.service';
import { StageApiService } from '../../core/api/stage-api.service';
import { ScenarioApiService } from '../../core/api/scenario-api.service';
import { TriggerApiService } from '../../core/api/trigger-api.service';
import { EventApiService } from '../../core/api/event-api.service';
import { EventTriggerLinkApiService } from '../../core/api/event-trigger-link-api.service';

@Component({
  selector: 'app-stage-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stage-board.component.html',
  styleUrls: ['./stage-board.component.scss'],
})
export class StageBoardComponent implements OnInit {
  error: string | null = null;

  processes: Process[] = [];
  stages: Stage[] = [];
  scenarios: Scenario[] = [];
  triggers: TriggerDefinition[] = [];
  events: EventDefinition[] = [];
  links: EventTriggerLink[] = [];

  selectedProcessId: number | null = null;
  selectedStageId: number | null = null;

  stageFilter = '';
  scenarioFilter = '';

  constructor(
    private processesApi: ProcessApiService,
    private stagesApi: StageApiService,
    private scenariosApi: ScenarioApiService,
    private triggersApi: TriggerApiService,
    private eventsApi: EventApiService,
    private linksApi: EventTriggerLinkApiService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.error = null;

    forkJoin({
      processes: this.processesApi.list(),
      stages: this.stagesApi.list(),
      scenarios: this.scenariosApi.list(),
      triggers: this.triggersApi.list(),
      events: this.eventsApi.list(),
      links: this.linksApi.list(),
    }).subscribe({
      next: res => {
        this.processes = res.processes ?? [];
        this.stages = res.stages ?? [];
        this.scenarios = res.scenarios ?? [];
        this.triggers = res.triggers ?? [];
        this.events = res.events ?? [];
        this.links = res.links ?? [];

        if (this.selectedProcessId == null) this.selectedProcessId = this.processes[0]?.id ?? null;

        const stageIdsInProcess = new Set(this.stagesInSelectedProcess.map(s => s.id));
        if (this.selectedStageId == null || !stageIdsInProcess.has(this.selectedStageId)) {
          this.selectedStageId = this.stagesInSelectedProcess[0]?.id ?? null;
        }
      },
      error: (err: any) => {
        this.error = (err?.message ?? 'خطا در ارتباط با API');
      },
    });
  }

  // ---------- computed ----------
  get stagesInSelectedProcess(): Stage[] {
    const pid = this.selectedProcessId;
    const q = (this.stageFilter || '').trim().toLowerCase();

    let list = pid !== null ? this.stages.filter(s => s.processId === pid) : [...this.stages];
    list = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (!q) return list;
    return list.filter(s =>
      s.stageKey.toLowerCase().includes(q) ||
      (s.titleFa ?? '').toLowerCase().includes(q),
    );
  }

  get scenariosInSelectedStage(): Scenario[] {
    const sid = this.selectedStageId;
    const q = (this.scenarioFilter || '').trim().toLowerCase();

    let list = sid !== null ? this.scenarios.filter(s => s.stageId === sid) : [...this.scenarios];

    // مرتب‌سازی پیشنهادی: اول by scenarioKey
    list = [...list].sort((a, b) => (a.scenarioKey ?? '').localeCompare(b.scenarioKey ?? ''));

    if (!q) return list;
    return list.filter(s =>
      (s.scenarioKey ?? '').toLowerCase().includes(q) ||
      (s.titleFa ?? '').toLowerCase().includes(q) ||
      (s.ownerSubdomain ?? '').toLowerCase().includes(q),
    );
  }

  // ---------- handlers ----------
  onStageChanged(sidRaw: string) {
    const sid = (sidRaw ?? '').toString().trim() === '' ? null : +sidRaw;
    this.selectedStageId = (sid !== null && Number.isFinite(sid)) ? sid : null;
  }

  onProcessChanged(pidRaw: string) {
    const pid = (pidRaw ?? '').toString().trim() === '' ? null : +pidRaw;
    this.selectedProcessId = (pid !== null && Number.isFinite(pid)) ? pid : null;
    const firstStage = this.stagesInSelectedProcess[0];
    this.selectedStageId = firstStage?.id ?? null;
  }

  // ---------- helpers ----------
  processKeyById(id?: number | null): string {
    if (id == null) return '—';
    return this.processes.find(p => p.id === id)?.processKey ?? '—';
  }

  stageKeyById(id?: number | null): string {
    if (id == null) return '—';
    return this.stages.find(s => s.id === id)?.stageKey ?? '—';
  }

  stageTitleById(id?: number | null): string {
    if (id == null) return '—';
    return this.stages.find(s => s.id === id)?.titleFa ?? '—';
  }

  triggerKeyById(id?: number | null): string {
    if (id == null) return '—';
    return this.triggers.find(t => t.id === id)?.triggerKey ?? '—';
  }

  eventKeyById(id?: number | null): string {
    if (id == null) return '—';
    return this.events.find(e => e.id === id)?.eventKey ?? '—';
  }

  eventLinkedTriggerKey(eventId: number): string {
    const tid = this.links.find(l => l.eventId === eventId)?.triggerId;
    if (tid == null) return '';
    return this.triggerKeyById(tid);
  }

  summaryStage() {
    const list = this.scenariosInSelectedStage ?? [];

    let noTrigger = 0, noAction = 0, noEvent = 0;
    let decisions = 0;

    for (const s of list as any[]) {
      const st = this.statsScenario(s);

      if (!s.triggerId) noTrigger++;
      if ((st.act ?? 0) === 0) noAction++;
      if ((st.ev ?? 0) === 0) noEvent++;

      decisions += (st.dec ?? 0);
    }

    return {
      total: list.length,
      noTrigger,
      noAction,
      noEvent,
      decisions,
    };
  }

  statsScenario(s: any) {
    const pre = (s.preconditionIds?.length ?? 0);
    const act = (s.actions?.length ?? 0);
    const fc = (s.factChanges?.length ?? 0);
    const ev = (s.producedEventIds?.length ?? 0);

    const dec = (s.decisions?.length ?? 0);
    const decAct = (s.decisions ?? []).reduce((a: number, d: any) => a + (d.actions?.length ?? 0), 0);
    const decEv = (s.decisions ?? []).reduce((a: number, d: any) => a + (d.producedEventIds?.length ?? 0), 0);

    return { pre, act, fc, ev, dec, decAct, decEv };
  }

  warningsScenario(s: Scenario): string[] {
    const w: string[] = [];
    if (!s.triggerId) w.push('Trigger ندارد');
    if (this.scenarioTotalActions(s) === 0) w.push('Action ندارد');
    if (this.scenarioAllProducedEventIds(s).length === 0) w.push('Event تولید نمی‌کند');
    return w;
  }

  scenarioAllProducedEventIds(s: Scenario): number[] {
    const set = new Set<number>();
    for (const id of (s.producedEventIds ?? [])) set.add(id);
    for (const d of (s.decisions ?? [])) {
      for (const id of (d.producedEventIds ?? [])) set.add(id);
    }
    return [...set];
  }

  scenarioEventSources(s: Scenario, eventId: number): string[] {
    const src: string[] = [];
    if ((s.producedEventIds ?? []).includes(eventId)) src.push('Base');
    for (const d of (s.decisions ?? [])) {
      if ((d.producedEventIds ?? []).includes(eventId)) src.push(`Decision:${d.decisionKey}`);
    }
    return src;
  }

  scenarioTotalActions(s: Scenario): number {
    let n = (s.actions?.length ?? 0);
    for (const d of (s.decisions ?? [])) n += (d.actions?.length ?? 0);
    return n;
  }

  scenarioTotalFactChanges(s: Scenario): number {
    let n = (s.factChanges?.length ?? 0);
    for (const d of (s.decisions ?? [])) n += (d.factChanges?.length ?? 0);
    return n;
  }
}
