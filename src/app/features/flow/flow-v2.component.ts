import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CatalogStoreService } from '../../core/catalog-store.service';
import { EventDefinition, EventTriggerLink, Scenario, Stage, TriggerDefinition } from '../../core/types';

type NodeType = 'trigger' | 'scenario' | 'decision' | 'event';
type NodeId = string; // برای decision: scenarioId|decisionId

type Node = {
  type: NodeType;
  id: NodeId;
  title: string;
  open?: { col: string; id: string; decisionId?: string };
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
export class FlowV2Component
{
  stages: Stage[] = [];
  triggers: TriggerDefinition[] = [];
  events: EventDefinition[] = [];
  scenarios: Scenario[] = [];
  links: EventTriggerLink[] = [];

  stageFilter = ''; // stageId
  startTriggerId = '';
  depth = 10;
  maxPaths = 40;

  paths: Step[][] = [];

  constructor(private store: CatalogStoreService)
  {
    this.reload();
  }

  reload()
  {
    this.stages = this.store.list<Stage>(COL_STAGES);
    this.triggers = this.store.list<TriggerDefinition>(COL_TRIGGERS);
    this.events = this.store.list<EventDefinition>(COL_EVENTS);
    this.scenarios = this.store.list<Scenario>(COL_SCENARIOS);
    this.links = this.store.list<EventTriggerLink>(COL_LINKS);

    this.startTriggerId ||= this.triggers[0]?.id ?? '';
    this.build();
  }

  build()
  {
    this.paths = [];
    if (!this.startTriggerId) return;

    const trigById = new Map(this.triggers.map(x => [x.id, x]));
    const eventById = new Map(this.events.map(x => [x.id, x]));

    // index: triggerId -> scenarios
    const scByTrigger = new Map<string, Scenario[]>();
    for (const s of this.scenarios)
    {
      const tid = (s as any).triggerId;
      if (!tid) continue;
      if (this.stageFilter && s.stageId !== this.stageFilter) continue;

      const arr = scByTrigger.get(tid) ?? [];
      arr.push(s);
      scByTrigger.set(tid, arr);
    }

    // index: eventId -> triggers
    const trigByEvent = new Map<string, string[]>();
    for (const l of this.links)
    {
      const arr = trigByEvent.get(l.eventId) ?? [];
      arr.push(l.triggerId);
      trigByEvent.set(l.eventId, arr);
    }

    const mkTriggerNode = (id: string): Node =>
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

    const mkEventNode = (id: string): Node =>
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
    const start = mkTriggerNode(this.startTriggerId);

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
        const scenarios = scByTrigger.get(current.id) ?? [];
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
          const evs: string[] = (s as any).producedEventIds ?? [];
          if (!evs.length) { this.paths.push(nextPath); return; }
          for (const eid of evs) dfs(mkEventNode(eid), nextPath, nextVisited, depthLeft - 1);
          return;
        }

        for (const d of decs) dfs(mkDecisionNode(s, d), nextPath, nextVisited, depthLeft - 1);
        return;
      }

      if (current.type === 'decision')
      {
        const [sid, did] = current.id.split('|');
        const s = this.scenarios.find(x => x.id === sid) as any;
        const d = (s?.decisions ?? []).find((x: any) => x.id === did);
        const evs: string[] = d?.producedEventIds ?? [];
        if (!evs.length) { this.paths.push(nextPath); return; }
        for (const eid of evs) dfs(mkEventNode(eid), nextPath, nextVisited, depthLeft - 1);
        return;
      }

      if (current.type === 'event')
      {
        const nextTrigs = trigByEvent.get(current.id) ?? [];
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
