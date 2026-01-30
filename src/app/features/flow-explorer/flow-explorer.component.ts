import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  ActionDefinition,
  EventDefinition,
  EventTriggerLink,
  Process,
  Scenario,
  Stage,
  TriggerDefinition,
} from '../../core/types';

import { forkJoin } from 'rxjs';
import { ActionApiService } from '../../core/api/action-api.service';
import { EventApiService } from '../../core/api/event-api.service';
import { EventTriggerLinkApiService } from '../../core/api/event-trigger-link-api.service';
import { ProcessApiService } from '../../core/api/process-api.service';
import { ScenarioApiService } from '../../core/api/scenario-api.service';
import { StageApiService } from '../../core/api/stage-api.service';
import { TriggerApiService } from '../../core/api/trigger-api.service';

type Mode = 'Trigger' | 'Event';

@Component({
  selector: 'app-flow-explorer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flow-explorer.component.html',
  styleUrls: ['./flow-explorer.component.scss'],
})
export class FlowExplorerComponent implements OnInit {
  error: string | null = null;
  mode: Mode = 'Trigger';

  triggers: TriggerDefinition[] = [];
  events: EventDefinition[] = [];
  links: EventTriggerLink[] = [];
  scenarios: Scenario[] = [];
  stages: Stage[] = [];
  processes: Process[] = [];
  actions: ActionDefinition[] = [];

  selectedTriggerId: number | null = null;
  selectedEventId: number | null = null;

  // filters
  scenarioFilter = '';

  constructor(
    private triggersApi: TriggerApiService,
    private eventsApi: EventApiService,
    private scenariosApi: ScenarioApiService,
    private stagesApi: StageApiService,
    private processesApi: ProcessApiService,
    private actionsApi: ActionApiService,
    private linksApi: EventTriggerLinkApiService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.error = null;

    forkJoin({
      triggers: this.triggersApi.list(),
      events: this.eventsApi.list(),
      links: this.linksApi.list(),
      scenarios: this.scenariosApi.list(),
      stages: this.stagesApi.list(),
      processes: this.processesApi.list(),
      actions: this.actionsApi.list(),
    }).subscribe({
      next: (res) => {
        this.triggers = res.triggers ?? [];
        this.events = res.events ?? [];
        this.links = res.links ?? [];
        this.scenarios = res.scenarios ?? [];
        this.stages = res.stages ?? [];
        this.processes = res.processes ?? [];
        this.actions = res.actions ?? [];

        this.selectedTriggerId = this.selectedTriggerId ?? (this.triggers[0]?.id ?? null);
        this.selectedEventId = this.selectedEventId ?? (this.events[0]?.id ?? null);
      },
      error: (err: any) => {
        this.error = (err?.message ?? 'خطا در ارتباط با API');
      },
    });
  }

  // ---------- helpers ----------
  triggerKeyById(id?: number | null): string {
    if (id == null) return '—';
    return this.triggers.find((t) => t.id === id)?.triggerKey ?? '—';
  }

  eventKeyById(id?: number | null): string {
    if (id == null) return '—';
    return this.events.find((e) => e.id === id)?.eventKey ?? '—';
  }

  stageKeyById(id?: number | null): string {
    if (id == null) return '—';
    return this.stages.find((s) => s.id === id)?.stageKey ?? '—';
  }

  processKeyByStageId(stageId?: number | null): string {
    if (stageId == null) return '—';
    const stage = this.stages.find((s) => s.id === stageId);
    if (!stage) return '—';
    return this.processes.find((p) => p.id === stage.processId)?.processKey ?? '—';
  }

  actionKeyById(id?: number | null): string {
    if (id == null) return '—';
    return this.actions.find((a) => a.id === id)?.actionKey ?? '—';
  }

  scenarioAllProducedEventIds(s: Scenario): number[] {
    const set = new Set<number>();
    for (const id of (s.producedEventIds ?? [])) set.add(id);
    for (const d of (s.decisions ?? [])) {
      for (const id of (d.producedEventIds ?? [])) set.add(id);
    }
    return [...set];
  }

  scenarioProducesEvent(s: Scenario, eventId: number): boolean {
    if ((s.producedEventIds ?? []).includes(eventId)) return true;
    return (s.decisions ?? []).some((d) => (d.producedEventIds ?? []).includes(eventId));
  }

  scenarioEventSources(s: Scenario, eventId: number): string[] {
    const src: string[] = [];
    if ((s.producedEventIds ?? []).includes(eventId)) src.push('Base');
    for (const d of (s.decisions ?? [])) {
      if ((d.producedEventIds ?? []).includes(eventId)) {
        src.push(`Decision:${d.decisionKey}`);
      }
    }
    return src;
  }

  // ---------- lists ----------
  get scenariosBySelectedTrigger(): Scenario[] {
    const tid = this.selectedTriggerId;
    if (!tid) return [];
    const q = (this.scenarioFilter || '').trim().toLowerCase();

    const list = this.scenarios.filter((s) => s.triggerId === tid);

    if (!q) return list;
    return list.filter(
      (s) =>
        s.scenarioKey.toLowerCase().includes(q) ||
        (s.titleFa ?? '').toLowerCase().includes(q) ||
        (s.ownerSubdomain ?? '').toLowerCase().includes(q),
    );
  }

  get scenariosProducingSelectedEvent(): Scenario[] {
    const eid = this.selectedEventId;
    if (!eid) return [];

    const q = (this.scenarioFilter || '').trim().toLowerCase();

    const list = this.scenarios.filter((s) => this.scenarioProducesEvent(s, eid));

    if (!q) return list;
    return list.filter(
      (s) =>
        s.scenarioKey.toLowerCase().includes(q) ||
        (s.titleFa ?? '').toLowerCase().includes(q) ||
        (s.ownerSubdomain ?? '').toLowerCase().includes(q),
    );
  }

  downstreamScenariosFromEvent(eventId: number): Scenario[] {
    const trigId = this.getLinkedTriggerId(eventId);
    if (trigId == null) return [];
    return this.scenarios.filter((s) => s.triggerId === trigId);
  }

  // ---------- Event → Trigger Link ----------
  getLinkedTriggerId(eventId: number): number | null {
    return this.links.find((l) => l.eventId === eventId)?.triggerId ?? null;
  }

  setEventTriggerLink(eventId: number | null, triggerIdRaw: string) {
    if (eventId == null) return;

    this.error = null;
    const tRaw = (triggerIdRaw ?? '').toString().trim();
    const triggerId = tRaw === '' ? null : +tRaw;

    const existing = this.links.find((l) => l.eventId === eventId);

    // remove if empty/invalid
    if (triggerId == null || !Number.isFinite(triggerId) || triggerId <= 0) {
      if (!existing) return;
      this.linksApi.delete(existing.id).subscribe({
        next: () => {
          this.links = this.links.filter((l) => l.eventId !== eventId);
        },
        error: (err: any) => {
          this.error = (err?.message ?? 'خطا در حذف لینک');
        },
      });
      return;
    }

    if (existing) {
      const payload = { eventId: existing.eventId, triggerId };
      this.linksApi.update(existing.id, payload).subscribe({
        next: (updated) => {
          const idx = this.links.findIndex((x) => x.id === existing.id);
          if (idx >= 0) this.links[idx] = updated;
        },
        error: (err: any) => {
          this.error = (err?.message ?? 'خطا در ذخیره لینک');
        },
      });
      return;
    }

    // create
    this.linksApi.create({ eventId, triggerId }).subscribe({
      next: (created) => {
        this.links = [created, ...this.links.filter((l) => l.eventId !== eventId)];
      },
      error: (err: any) => {
        this.error = (err?.message ?? 'خطا در ایجاد لینک');
      },
    });
  }

  // ---------- UI ----------
  switchMode(m: Mode) {
    this.mode = m;
    this.scenarioFilter = '';
  }

  statsScenario(s: Scenario): { pre: number; act: number; fc: number; ev: number; dec: number } {
    const pre = (s.preconditionIds?.length ?? 0);

    let act = (s.actions?.length ?? 0);
    let fc = (s.factChanges?.length ?? 0);

    for (const d of (s.decisions ?? [])) {
      act += (d.actions?.length ?? 0);
      fc += (d.factChanges?.length ?? 0);
    }

    const ev = this.scenarioAllProducedEventIds(s).length;
    const dec = (s.decisions?.length ?? 0);

    return { pre, act, fc, ev, dec };
  }
}
