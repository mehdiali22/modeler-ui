import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { forkJoin } from 'rxjs';
import { ProcessApiService } from '../../core/api/process-api.service';
import { StageApiService } from '../../core/api/stage-api.service';
import { ScenarioApiService } from '../../core/api/scenario-api.service';
import { TriggerApiService } from '../../core/api/trigger-api.service';
import { EventApiService } from '../../core/api/event-api.service';
import { Process, Scenario, Stage, TriggerDefinition, EventDefinition } from '../../core/types';

@Component({
  selector: 'app-scenario-matrix',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scenario-matrix.component.html',
  styleUrls: ['./scenario-matrix.component.scss'],
})
export class ScenarioMatrixComponent implements OnInit {
  error: string | null = null;

  processes: Process[] = [];
  stages: Stage[] = [];
  scenarios: Scenario[] = [];
  triggers: TriggerDefinition[] = [];
  events: EventDefinition[] = [];

  selectedProcessId: number | null = null;
  search = '';

  constructor(
    private processesApi: ProcessApiService,
    private stagesApi: StageApiService,
    private scenariosApi: ScenarioApiService,
    private triggersApi: TriggerApiService,
    private eventsApi: EventApiService,
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
    }).subscribe({
      next: res => {
        this.processes = res.processes ?? [];
        this.stages = res.stages ?? [];
        this.scenarios = res.scenarios ?? [];
        this.triggers = res.triggers ?? [];
        this.events = res.events ?? [];

        this.selectedProcessId ??= this.processes[0]?.id ?? null;
      },
      error: (err: any) => {
        this.error = (err?.message ?? 'خطا در ارتباط با API');
      },
    });
  }

  get stagesOfProcess(): Stage[] {
    const pid = this.selectedProcessId;
    const list = pid !== null ? this.stages.filter(s => s.processId === pid) : [...this.stages];
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  scenariosOfStage(stageId: number): Scenario[] {
    const q = (this.search || '').trim().toLowerCase();
    let list = this.scenarios.filter(s => s.stageId === stageId);

    if (q) {
      list = list.filter(s =>
        (s.scenarioKey ?? '').toLowerCase().includes(q) ||
        (s.titleFa ?? '').toLowerCase().includes(q) ||
        (s.ownerSubdomain ?? '').toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => (a.scenarioKey ?? '').localeCompare(b.scenarioKey ?? ''));
  }

  triggerKeyById(id?: number | null): string {
    if (id == null) return '—';
    return this.triggers.find(t => t.id === id)?.triggerKey ?? '—';
  }

  producedEventCount(s: Scenario): number {
    const set = new Set<number>();
    for (const id of (s.producedEventIds ?? [])) set.add(id);
    for (const d of (s.decisions ?? [])) for (const id of (d.producedEventIds ?? [])) set.add(id);
    return set.size;
  }

  decisionCount(s: Scenario): number {
    return (s.decisions?.length ?? 0);
  }

  actionCount(s: Scenario): number {
    let n = (s.actions?.length ?? 0);
    for (const d of (s.decisions ?? [])) n += (d.actions?.length ?? 0);
    return n;
  }

  stageTitle(id: number): string {
    return this.stages.find(s => s.id === id)?.titleFa ?? '';
  }
}
