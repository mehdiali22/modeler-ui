import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { StageApiService } from '../../../core/api/stage-api.service';
import { TriggerApiService } from '../../../core/api/trigger-api.service';
import { EventApiService } from '../../../core/api/event-api.service';
import { ScenarioApiService } from '../../../core/api/scenario-api.service';
import { EventTriggerLinkApiService } from '../../../core/api/event-trigger-link-api.service';
import { RouterLink } from '@angular/router';
import
  {
    EventTriggerLink,
    EventDefinition,
    Scenario,
    Stage,
    TriggerDefinition,
  } from '../../../core/types';

const COL_STAGES = 'stages';
const COL_TRIGGERS = 'triggers';
const COL_EVENTS = 'events';
const COL_SCENARIOS = 'scenarios';
const COL_LINKS = 'eventTriggerLinks';

type NodeType = 'TR' | 'SC' | 'DC' | 'EV';

type NodeRef = {
  nid: string;      // unique node id: TR:.. SC:.. DC:.. EV:..
  t: NodeType;
  id: number;       // actual id in store (for DC: decisionId)
  scenarioId?: number; // for DC nodes
};

type EdgeRow = {
  from: NodeRef;
  to: NodeRef;
  kind: 'TR->SC' | 'SC->DC' | 'SC->EV' | 'DC->EV' | 'EV->TR';
  loop: boolean;
  depth: number;
};

type PathRow = {
  text: string;
  loop: boolean;
};

function nidTR(id: number) { return `TR:${id}`; }
function nidSC(id: number) { return `SC:${id}`; }
function nidEV(id: number) { return `EV:${id}`; }
function nidDC(scenarioId: number, decisionId: number) { return `DC:${scenarioId}:${decisionId}`; }

@Component({
  selector: 'app-flow-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './flow-view.component.html',
  styleUrls: ['./flow-view.component.scss'],
})
export class FlowViewComponent implements OnInit
{
  error: string | null = null;
  stages: Stage[] = [];
  triggers: TriggerDefinition[] = [];
  events: EventDefinition[] = [];
  scenarios: Scenario[] = [];
  links: EventTriggerLink[] = [];

  // UI state
  startMode: 'trigger' | 'scenario' = 'trigger';
  startTriggerId: number | null = null;
  startScenarioId: number | null = null;
  stageId: number | null = null;
  maxDepth = 8;
  includeDecisions = true;
  showOnlySelectedStage = false;

  q = '';

  // results
  edges: EdgeRow[] = [];
  paths: PathRow[] = [];
  loopsCount = 0;
  nodesCount = 0;

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

  openQuery(n: any)
  {
    if (n.t === 'TR') return { col: 'triggers', id: n.id };
    if (n.t === 'EV') return { col: 'events', id: n.id };
    if (n.t === 'SC') return { col: 'scenarios', id: n.id };
    // Decision
    return { col: 'scenarios', id: n.scenarioId, decisionId: n.id };
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

        if (this.startTriggerId === null && this.triggers.length) this.startTriggerId = this.triggers[0].id;
        if (this.startScenarioId === null && this.scenarios.length) this.startScenarioId = this.scenarios[0].id;

        this.rebuild();
      },
      error: err => {
        this.error = (err?.message ?? 'خطا در ارتباط با API');
      },
    });
  }

  // ---------- label helpers ----------
  stageById(id: number) { return this.stages.find(x => x.id === id); }

  triggerLabel(id: number)
  {
    const t = this.triggers.find(x => x.id === id);
    return t ? `${t.triggerKey}${t.titleFa ? ' — ' + t.titleFa : ''}` : '—';
  }

  eventLabel(id: number)
  {
    const e = this.events.find(x => x.id === id);
    return e ? `${e.eventKey}${e.titleFa ? ' — ' + e.titleFa : ''}` : '—';
  }

  scenarioLabel(id: number)
  {
    const s = this.scenarios.find(x => x.id === id);
    return s ? `${s.scenarioKey}${s.titleFa ? ' — ' + s.titleFa : ''}` : '—';
  }

  decisionLabel(scenarioId: number, decisionId: number)
  {
    const s: any = this.scenarios.find(x => x.id === scenarioId) as any;
    const d: any = (s?.decisions ?? []).find((x: any) => x.id === decisionId);
    if (!d) return '—';
    const k = (d.decisionKey ?? d.id) as string;
    const t = (d.titleFa ?? '') as string;
    return t ? `${k} — ${t}` : k;
  }

  uiActionKeyOfDecision(scenarioId: number, decisionId: number): string
  {
    const s: any = this.scenarios.find(x => x.id === scenarioId) as any;
    const d: any = (s?.decisions ?? []).find((x: any) => x.id === decisionId);
    return (d?.uiActionKey ?? '').trim();
  }

  scenarioStageId(scenarioId: number): number | null
  {
    const s = this.scenarios.find(x => x.id === scenarioId);
    return s?.stageId ?? null;
  }

  isDimScenario(scenarioId: number): boolean
  {
    if (this.stageId === null) return false;
    const sid = this.scenarioStageId(scenarioId);
    return sid !== this.stageId;
  }

  // ---------- build graph ----------
  rebuild()
  {
    const triggerToScenarios = new Map<number, number[]>();
    for (const s of this.scenarios)
    {
      const tr = (s as any).triggerId as number | undefined;
      if (!tr) continue;
      const arr = triggerToScenarios.get(tr) ?? [];
      arr.push(s.id);
      triggerToScenarios.set(tr, arr);
    }

    const eventToTriggers = new Map<number, number[]>();
    for (const l of this.links)
    {
      const arr = eventToTriggers.get(l.eventId) ?? [];
      arr.push(l.triggerId);
      eventToTriggers.set(l.eventId, arr);
    }

    const edges: EdgeRow[] = [];
    const edgeKey = new Set<string>();
    const paths: PathRow[] = [];
if (this.startTriggerId === null && this.triggers.length) this.startTriggerId = this.triggers[0].id;
if (this.startScenarioId === null && this.scenarios.length) this.startScenarioId = this.scenarios[0].id;

if (this.startMode === 'trigger' && this.startTriggerId === null)
{
  this.edges = [];
  this.paths = [];
  this.loopsCount = 0;
  this.nodesCount = 0;
  return;
}

if (this.startMode === 'scenario' && this.startScenarioId === null)
{
  this.edges = [];
  this.paths = [];
  this.loopsCount = 0;
  this.nodesCount = 0;
  return;
}


    const addEdge = (from: NodeRef, to: NodeRef, kind: EdgeRow['kind'], loop: boolean, depth: number) =>
    {
      const k = `${from.nid}=>${to.nid}:${kind}`;
      if (edgeKey.has(k)) return;
      edgeKey.add(k);
      edges.push({ from, to, kind, loop, depth });
    };

    const expandScenario = (scenarioId: number) =>
    {
      const s: any = this.scenarios.find(x => x.id === scenarioId) as any;
      const producedBase: number[] = (s?.producedEventIds ?? []) as number[];
      const decisions: any[] = (s?.decisions ?? []) as any[];

      if (this.includeDecisions && decisions.length)
      {
        return { decisions, producedBase: [] as number[] };
      }
      // اگر decisions را نمایش نمی‌دهیم: union از base + تصمیم‌ها
      const producedFromDecisions: number[] = [];
      for (const d of decisions)
      {
        for (const ev of (d?.producedEventIds ?? [])) producedFromDecisions.push(ev);
      }
      const allEvents = [...producedBase, ...producedFromDecisions];
      return { decisions: [] as any[], producedBase: allEvents };
    };

    // DFS (با loop detection در path)
    type Frame = {
      node: NodeRef;
      depth: number;
      path: NodeRef[];
      pathSet: Set<string>;
    };

    const startNode: NodeRef =
      this.startMode === 'trigger'
        ? { nid: nidTR(this.startTriggerId!), t: 'TR', id: this.startTriggerId! }
        : { nid: nidSC(this.startScenarioId!), t: 'SC', id: this.startScenarioId! };

    const stack: Frame[] = [{ node: startNode, depth: 0, path: [startNode], pathSet: new Set([startNode.nid]) }];

    const maxDepth = Math.max(1, Math.min(20, Number(this.maxDepth) || 8));

    while (stack.length)
    {
      const fr = stack.pop()!;
      const { node, depth, path, pathSet } = fr;

      if (depth >= maxDepth)
      {
        paths.push({ text: this.pathToText(path), loop: false });
        continue;
      }

      // apply showOnlySelectedStage (soft gate for expansion)
      const allowExpandScenario = (scenarioId: number) =>
      {
        if (this.stageId === null) return true;
        if (!this.showOnlySelectedStage) return true;
        return this.scenarioStageId(scenarioId) === this.stageId;
      };

      if (node.t === 'TR')
      {
        const scenarioIds = triggerToScenarios.get(node.id) ?? [];
        if (!scenarioIds.length)
        {
          paths.push({ text: this.pathToText(path), loop: false });
          continue;
        }

        for (const sid of scenarioIds)
        {
          if (!allowExpandScenario(sid)) continue;

          const to: NodeRef = { nid: nidSC(sid), t: 'SC', id: sid };
          const isLoop = pathSet.has(to.nid);
          addEdge(node, to, 'TR->SC', isLoop, depth + 1);

          if (isLoop)
          {
            paths.push({ text: this.pathToText([...path, to]), loop: true });
            continue;
          }

          const ns = new Set(pathSet); ns.add(to.nid);
          stack.push({ node: to, depth: depth + 1, path: [...path, to], pathSet: ns });
        }
      }

      else if (node.t === 'SC')
      {
        const exp = expandScenario(node.id);

        // SC -> DC (if includeDecisions)
        if (this.includeDecisions && exp.decisions.length)
        {
          for (const d of exp.decisions)
          {
            const did = d.id as number;
            const to: NodeRef = { nid: nidDC(node.id as number, did), t: 'DC', id: did, scenarioId: node.id as number };
            const isLoop = pathSet.has(to.nid);
            addEdge(node, to, 'SC->DC', isLoop, depth + 1);

            if (isLoop)
            {
              paths.push({ text: this.pathToText([...path, to]), loop: true });
              continue;
            }

            const ns = new Set(pathSet); ns.add(to.nid);
            stack.push({ node: to, depth: depth + 1, path: [...path, to], pathSet: ns });
          }
        }
        // SC -> EV (base)
        else
        {
          const produced = exp.producedBase ?? [];
          if (!produced.length)
          {
            paths.push({ text: this.pathToText(path), loop: false });
            continue;
          }

          for (const evId of produced)
          {
            const to: NodeRef = { nid: nidEV(evId), t: 'EV', id: evId };
            const isLoop = pathSet.has(to.nid);
            addEdge(node, to, 'SC->EV', isLoop, depth + 1);

            if (isLoop)
            {
              paths.push({ text: this.pathToText([...path, to]), loop: true });
              continue;
            }

            const ns = new Set(pathSet); ns.add(to.nid);
            stack.push({ node: to, depth: depth + 1, path: [...path, to], pathSet: ns });
          }
        }
      }

      else if (node.t === 'DC')
      {
        const s: any = this.scenarios.find(x => x.id === node.scenarioId) as any;
        const d: any = (s?.decisions ?? []).find((x: any) => x.id === node.id);
        const produced: number[] = (d?.producedEventIds ?? []) as number[];

        if (!produced.length)
        {
          paths.push({ text: this.pathToText(path), loop: false });
          continue;
        }

        for (const evId of produced)
        {
          const to: NodeRef = { nid: nidEV(evId), t: 'EV', id: evId };
          const isLoop = pathSet.has(to.nid);
          addEdge(node, to, 'DC->EV', isLoop, depth + 1);

          if (isLoop)
          {
            paths.push({ text: this.pathToText([...path, to]), loop: true });
            continue;
          }

          const ns = new Set(pathSet); ns.add(to.nid);
          stack.push({ node: to, depth: depth + 1, path: [...path, to], pathSet: ns });
        }
      }

      else if (node.t === 'EV')
      {
        const nextTriggers = eventToTriggers.get(node.id) ?? [];
        if (!nextTriggers.length)
        {
          paths.push({ text: this.pathToText(path), loop: false });
          continue;
        }

        for (const trId of nextTriggers)
        {
          const to: NodeRef = { nid: nidTR(trId), t: 'TR', id: trId };
          const isLoop = pathSet.has(to.nid);
          addEdge(node, to, 'EV->TR', isLoop, depth + 1);

          if (isLoop)
          {
            paths.push({ text: this.pathToText([...path, to]), loop: true });
            continue;
          }

          const ns = new Set(pathSet); ns.add(to.nid);
          stack.push({ node: to, depth: depth + 1, path: [...path, to], pathSet: ns });
        }
      }
    }

    // summary
    const nodeSet = new Set<string>();
    for (const e of edges) { nodeSet.add(e.from.nid); nodeSet.add(e.to.nid); }

    this.edges = edges.sort((a, b) => a.depth - b.depth || a.kind.localeCompare(b.kind));
    this.paths = this.uniquePaths(paths).slice(0, 80);
    this.loopsCount = edges.filter(e => e.loop).length;
    this.nodesCount = nodeSet.size;
  }

  private uniquePaths(rows: PathRow[]): PathRow[]
  {
    const map = new Map<string, PathRow>();
    for (const r of rows)
    {
      const k = r.text;
      if (!map.has(k)) map.set(k, r);
    }
    // loop paths first
    return [...map.values()].sort((a, b) => Number(b.loop) - Number(a.loop) || a.text.localeCompare(b.text));
  }

  private pathToText(path: NodeRef[]): string
  {
    return path.map(n => this.nodeText(n)).join('  →  ');
  }

  nodeText(n: NodeRef): string
  {
    if (n.t === 'TR') return `TR:${this.triggers.find(x => x.id === n.id)?.triggerKey ?? n.id}`;
    if (n.t === 'EV') return `EV:${this.events.find(x => x.id === n.id)?.eventKey ?? n.id}`;
    if (n.t === 'SC') return `SC:${(this.scenarios.find(x => x.id === n.id) as any)?.scenarioKey ?? n.id}`;
    // Decision
    const s: any = this.scenarios.find(x => x.id === n.scenarioId) as any;
    const d: any = (s?.decisions ?? []).find((x: any) => x.id === n.id);
    return `DC:${(d?.decisionKey ?? n.id)}`;
  }

  // UI helpers
  edgeFromLabel(e: EdgeRow): string
  {
    return this.nodeHumanLabel(e.from);
  }
  edgeToLabel(e: EdgeRow): string
  {
    return this.nodeHumanLabel(e.to);
  }

  nodeHumanLabel(n: NodeRef): string
  {
    if (n.t === 'TR') return this.triggerLabel(n.id);
    if (n.t === 'EV') return this.eventLabel(n.id);
    if (n.t === 'SC') return this.scenarioLabel(n.id);
    return this.decisionLabel(n.scenarioId!, n.id);
  }

  nodeStageBadge(n: NodeRef): string
  {
    const sid = n.t === 'SC' ? this.scenarioStageId(n.id) : (n.t === 'DC' ? this.scenarioStageId(n.scenarioId!) : '');
    if (!sid) return '';
    const st = this.stageById(sid);
    return st?.stageKey ?? '';
  }

  isDimNode(n: NodeRef): boolean
  {
    if (this.stageId === null) return false;
    if (n.t === 'SC') return this.isDimScenario(n.id);
    if (n.t === 'DC') return this.isDimScenario(n.scenarioId!);
    return false;
  }

  get filteredEdges(): EdgeRow[]
  {
    const q = this.q.trim().toLowerCase();
    return this.edges.filter(e =>
    {
      if (!q) return true;
      return (
        this.edgeFromLabel(e).toLowerCase().includes(q) ||
        this.edgeToLabel(e).toLowerCase().includes(q) ||
        e.kind.toLowerCase().includes(q)
      );
    });
  }

  copyPaths()
  {
    const text = this.paths.map(p => (p.loop ? '♻️ ' : '') + p.text).join('\n');
    navigator.clipboard?.writeText(text);
  }

  copyEdges()
  {
    const lines = this.filteredEdges.map(e =>
    {
      const loop = e.loop ? 'LOOP' : '';
      return `${e.kind}\t${this.edgeFromLabel(e)}\t=>\t${this.edgeToLabel(e)}\t${loop}`;
    }).join('\n');
    navigator.clipboard?.writeText(lines);
  }
}
