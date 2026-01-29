import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CatalogStoreService } from '../../core/catalog-store.service';
import { Process, Scenario, Stage, TriggerDefinition, EventDefinition } from '../../core/types';

const COL_PROCESSES = 'processes';
const COL_STAGES = 'stages';
const COL_SCENARIOS = 'scenarios';
const COL_TRIGGERS = 'triggers';
const COL_EVENTS = 'events';

@Component({
  selector: 'app-scenario-matrix',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scenario-matrix.component.html',
  styleUrls: ['./scenario-matrix.component.scss'],
})
export class ScenarioMatrixComponent
{
  processes: Process[] = [];
  stages: Stage[] = [];
  scenarios: Scenario[] = [];
  triggers: TriggerDefinition[] = [];
  events: EventDefinition[] = [];

  selectedProcessId = '';
  search = '';

  constructor(private store: CatalogStoreService)
  {
    this.processes = this.store.list<Process>(COL_PROCESSES);
    this.stages = this.store.list<Stage>(COL_STAGES);
    this.scenarios = this.store.list<Scenario>(COL_SCENARIOS);
    this.triggers = this.store.list<TriggerDefinition>(COL_TRIGGERS);
    this.events = this.store.list<EventDefinition>(COL_EVENTS);

    this.selectedProcessId = this.processes[0]?.id ?? '';
  }

  get stagesOfProcess(): Stage[]
  {
    const pid = this.selectedProcessId;
    const list = pid ? this.stages.filter(s => s.processId === pid) : [...this.stages];
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  scenariosOfStage(stageId: string): Scenario[]
  {
    const q = (this.search || '').trim().toLowerCase();
    let list = this.scenarios.filter(s => s.stageId === stageId);

    if (q)
    {
      list = list.filter(s =>
        s.scenarioKey.toLowerCase().includes(q) ||
        (s.titleFa ?? '').toLowerCase().includes(q) ||
        (s.ownerSubdomain ?? '').toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => a.scenarioKey.localeCompare(b.scenarioKey));
  }

  triggerKeyById(id?: string): string
  {
    if (!id) return '—';
    return this.triggers.find(t => t.id === id)?.triggerKey ?? '—';
  }

  producedEventCount(s: Scenario): number
  {
    const set = new Set<string>();
    for (const id of (s.producedEventIds ?? [])) set.add(id);
    for (const d of (s.decisions ?? [])) for (const id of (d.producedEventIds ?? [])) set.add(id);
    return set.size;
  }

  decisionCount(s: Scenario): number
  {
    return (s.decisions?.length ?? 0);
  }

  actionCount(s: Scenario): number
  {
    let n = (s.actions?.length ?? 0);
    for (const d of (s.decisions ?? [])) n += (d.actions?.length ?? 0);
    return n;
  }

  stageTitle(id: string): string
  {
    return this.stages.find(s => s.id === id)?.titleFa ?? '';
  }
}
