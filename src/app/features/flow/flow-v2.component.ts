import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { StageApiService } from '../../core/api/stage-api.service';
import { TriggerApiService } from '../../core/api/trigger-api.service';
import { EventApiService } from '../../core/api/event-api.service';
import { ScenarioApiService } from '../../core/api/scenario-api.service';
import { EventTriggerLinkApiService } from '../../core/api/event-trigger-link-api.service';
import { EventDefinition, EventTriggerLink, Scenario, Stage, TriggerDefinition } from '../../core/types';

type NodeType = 'trigger' | 'scenario' | 'decision' | 'event';
type NodeId = number | string; // decision: `${scenarioId}|${decisionId}`

type Node = {
  type: NodeType;
  id: NodeId;
  title: string;
  open?: { col: string; id: number; decisionId?: number };
};

type Step = { node: Node; loop: boolean };

const COL_STAGES = 'stages';
const COL_TRIGGERS = 'triggers';
const COL_EVENTS = 'events';
const COL_SCENARIOS = 'scenarios';
const COL_LINKS = 'eventTriggerLinks';

function keyOf(n: Node) { return `${n.type}:${n.id}`; }

@Component({
  selector: 'app-flow-v2',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './flow-v2.component.html',
  styleUrls: ['./flow-v2.component.scss'],
})
export class FlowV2Component implements OnInit
{
  error: string | null = null;
  stages: Stage[] = [];
  triggers: TriggerDefinition[] = [];
  events: EventDefinition[] = [];
  scenarios: Scenario[] = [];
  links: EventTriggerLink[] = [];

  stageFilter: number | null = null; // stageId
  startTriggerId: number | null = null;
  depth = 10;
  maxPaths = 40;

  paths: Step[][] = [];

  constructor(
    private stagesApi: StageApiService,
    private triggersApi: TriggerApiService,
    private eventsApi: EventApiService,
    private scenariosApi: ScenarioApiService,
    private linksApi: EventTriggerLinkApiService,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload() {
    this.error = null;

    forkJoin({
      stages: this.stagesApi.list(),
      triggers: this.triggersApi.list(),
      events: this.eventsApi.list(),
      scenarios: this.scenariosApi.list(),
      links: this.linksApi.list(),
    }).subscribe({
      next: res => {
        this.stages = res.stages ?? [];
        this.triggers = res.triggers ?? [];
        this.events = res.events ?? [];
        this.scenarios = res.scenarios ?? [];
        this.links = res.links ?? [];

        this.build();
      },
      error: err => {
        this.error = (err?.message ?? 'خطا در ارتباط با API');
      },
    });
  }

  build()
  {
    this.paths = [];
    if (this.startTriggerId === null) return;

    const trigById = new Map<number, TriggerDefinition>(this.triggers.map(x => [x.id, x]));
    const eventById = new Map<number, EventDefinition>(this.events.map(x => [x.id, x]));

    // index: triggerId -> scenarios
    const scByTrigger = new Map<number, Scenario[]>();
    for (const s of this.scenarios)
    {
      const tid = (s as any).triggerId;
      if (!tid) continue;
      if (this.stageFilter !== null && s.stageId !== this.stageFilter) continue;

      const arr = scByTrigger.get(tid) ?? [];
      arr.push(s);
      scByTrigger.set(tid, arr);
    }

    // index: eventId -> triggers
    const trigByEvent = new Map<number, number[]>();
    for (const l of this.links)
    {
      const arr = trigByEvent.get(l.eventId) ?? [];
      arr.push(l.triggerId);
      trigByEvent.set(l.eventId, arr);
    }

    const mkTriggerNode = (id: number): Node =>
    {
      const t = trigById.get(id);
      return {
        type: 'trigger',
        id,
        title: t ? `Trigger: ${t.triggerKey}` : `Trigger: ${id}`,
        open: { col: 'triggers', id },
      };
    };

    const mkScenarioNode = (s: Scenario): Node => ({
      type: 'scenario',
      id: s.id,
      title: `Scenario: ${s.scenarioKey}`,
      open: { col: 'scenarios', id: s.id },
    });

    const mkDecisionNode = (s: Scenario, d: any): Node => ({
      type: 'decision',
      id: `${s.id}|${d.id}`,
      title: `Decision: ${d.decisionKey}${d.uiActionKey ? ` (ui=${d.uiActionKey})` : ''}`,
      open: { col: 'scenarios', id: s.id, decisionId: d.id },
    });

    const mkEventNode = (id: number): Node =>
    {
      const e = eventById.get(id);
      return {
        type: 'event',
        id,
        title: e ? `Event: ${e.eventKey}` : `Event: ${id}`,
        open: { col: 'events', id },
      };
    };

    // DFS paths
    const start = mkTriggerNode(this.startTriggerId!);

    const dfs = (current: Node, path: Step[], visited: Set<string>, depthLeft: number) =>
    {
      if (this.paths.length >= this.maxPaths) return;

      const k = keyOf(current);
      const isLoop = visited.has(k);
      const step: Step = { node: current, loop: isLoop };
      const nextPath = [...path, step];

      if (isLoop || depthLeft <= 0)
      {
        this.paths.push(nextPath);
        return;
      }

      const nextVisited = new Set(visited);
      nextVisited.add(k);

      // expand based on type
      if (current.type === 'trigger')
      {
        const scenarios = scByTrigger.get(current.id as number) ?? [];
        if (!scenarios.length)
        {
          this.paths.push(nextPath);
          return;
        }
        for (const s of scenarios)
        {
          dfs(mkScenarioNode(s), nextPath, nextVisited, depthLeft - 1);
        }
        return;
      }

      if (current.type === 'scenario')
      {
        const s = this.scenarios.find(x => x.id === current.id);
        if (!s) { this.paths.push(nextPath); return; }

        const decs: any[] = (s as any).decisions ?? [];
        if (!decs.length)
        {
          // اگر decision نداری، از producedEventIds سناریو استفاده کن
          const evs: number[] = (s as any).producedEventIds ?? [];
          if (!evs.length) { this.paths.push(nextPath); return; }
          for (const eid of evs) dfs(mkEventNode(eid), nextPath, nextVisited, depthLeft - 1);
          return;
        }

        for (const d of decs) dfs(mkDecisionNode(s, d), nextPath, nextVisited, depthLeft - 1);
        return;
      }

      if (current.type === 'decision')
      {
        const [sidStr, didStr] = (current.id as string).split('|');
        const sid = +sidStr;
        const did = +didStr;
        const s = this.scenarios.find(x => x.id === sid) as any;
        const d = (s?.decisions ?? []).find((x: any) => x.id === did);
        const evs: number[] = d?.producedEventIds ?? [];
        if (!evs.length) { this.paths.push(nextPath); return; }
        for (const eid of evs) dfs(mkEventNode(eid), nextPath, nextVisited, depthLeft - 1);
        return;
      }

      if (current.type === 'event')
      {
        const nextTrigs = trigByEvent.get(current.id as number) ?? [];
        if (!nextTrigs.length) { this.paths.push(nextPath); return; }
        for (const tid of nextTrigs) dfs(mkTriggerNode(tid), nextPath, nextVisited, depthLeft - 1);
        return;
      }

      this.paths.push(nextPath);
    };

    dfs(start, [], new Set<string>(), Math.max(1, this.depth));
  }

  hasLoop(p: any[]): boolean
  {
    return (p ?? []).some(s => !!s?.loop);
  }

}
