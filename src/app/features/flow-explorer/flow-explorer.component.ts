import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CatalogStoreService } from '../../core/catalog-store.service';
import
  {
    ActionDefinition,
    EventDefinition,
    EventTriggerLink,
    Process,
    Scenario,
    Stage,
    TriggerDefinition,
  } from '../../core/types';

const COL_SCENARIOS = 'scenarios';
const COL_TRIGGERS = 'triggers';
const COL_EVENTS = 'events';
const COL_LINKS = 'eventTriggerLinks';
const COL_STAGES = 'stages';
const COL_PROCESSES = 'processes';
const COL_ACTIONS = 'actions';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

type Mode = 'Trigger' | 'Event';

@Component({
  selector: 'app-flow-explorer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flow-explorer.component.html',
  styleUrls: ['./flow-explorer.component.scss'],
})
export class FlowExplorerComponent
{
  mode: Mode = 'Trigger';

  triggers: TriggerDefinition[] = [];
  events: EventDefinition[] = [];
  links: EventTriggerLink[] = [];
  scenarios: Scenario[] = [];
  stages: Stage[] = [];
  processes: Process[] = [];
  actions: ActionDefinition[] = [];

  selectedTriggerId = '';
  selectedEventId = '';

  // filters
  scenarioFilter = '';

  constructor(private store: CatalogStoreService)
  {
    // init in constructor ✅
    this.triggers = this.store.list<TriggerDefinition>(COL_TRIGGERS);
    this.events = this.store.list<EventDefinition>(COL_EVENTS);
    this.links = this.store.list<EventTriggerLink>(COL_LINKS);
    this.scenarios = this.store.list<Scenario>(COL_SCENARIOS);
    this.stages = this.store.list<Stage>(COL_STAGES);
    this.processes = this.store.list<Process>(COL_PROCESSES);
    this.actions = this.store.list<ActionDefinition>(COL_ACTIONS);

    this.selectedTriggerId = this.triggers[0]?.id ?? '';
    this.selectedEventId = this.events[0]?.id ?? '';
  }

  // ---------- helpers ----------
  triggerKeyById(id?: string): string
  {
    if (!id) return '—';
    return this.triggers.find(t => t.id === id)?.triggerKey ?? '—';
  }

  eventKeyById(id?: string): string
  {
    if (!id) return '—';
    return this.events.find(e => e.id === id)?.eventKey ?? '—';
  }

  stageKeyById(id?: string): string
  {
    if (!id) return '—';
    return this.stages.find(s => s.id === id)?.stageKey ?? '—';
  }

  processKeyByStageId(stageId?: string): string
  {
    if (!stageId) return '—';
    const stage = this.stages.find(s => s.id === stageId);
    if (!stage) return '—';
    return this.processes.find(p => p.id === stage.processId)?.processKey ?? '—';
  }

  actionKeyById(id?: string): string
  {
    if (!id) return '—';
    return this.actions.find(a => a.id === id)?.actionKey ?? '—';
  }

  scenarioAllProducedEventIds(s: Scenario): string[]
  {
    const set = new Set<string>();
    for (const id of (s.producedEventIds ?? [])) set.add(id);
    for (const d of (s.decisions ?? []))
    {
      for (const id of (d.producedEventIds ?? [])) set.add(id);
    }
    return [...set];
  }

  scenarioProducesEvent(s: Scenario, eventId: string): boolean
  {
    if ((s.producedEventIds ?? []).includes(eventId)) return true;
    return (s.decisions ?? []).some(d => (d.producedEventIds ?? []).includes(eventId));
  }

  scenarioEventSources(s: Scenario, eventId: string): string[]
  {
    const src: string[] = [];
    if ((s.producedEventIds ?? []).includes(eventId)) src.push('Base');
    for (const d of (s.decisions ?? []))
    {
      if ((d.producedEventIds ?? []).includes(eventId))
      {
        src.push(`Decision:${d.decisionKey}`);
      }
    }
    return src;
  }


  // ---------- lists ----------
  get scenariosBySelectedTrigger(): Scenario[]
  {
    const tid = this.selectedTriggerId;
    if (!tid) return [];
    const q = (this.scenarioFilter || '').trim().toLowerCase();

    const list = this.scenarios.filter(s => s.triggerId === tid);

    if (!q) return list;
    return list.filter(s =>
      s.scenarioKey.toLowerCase().includes(q) ||
      (s.titleFa ?? '').toLowerCase().includes(q) ||
      (s.ownerSubdomain ?? '').toLowerCase().includes(q)
    );
  }

  get scenariosProducingSelectedEvent(): Scenario[]
  {
    const eid = this.selectedEventId;
    if (!eid) return [];

    const q = (this.scenarioFilter || '').trim().toLowerCase();

    const list = this.scenarios.filter(s => this.scenarioProducesEvent(s, eid));

    if (!q) return list;
    return list.filter(s =>
      s.scenarioKey.toLowerCase().includes(q) ||
      (s.titleFa ?? '').toLowerCase().includes(q) ||
      (s.ownerSubdomain ?? '').toLowerCase().includes(q)
    );
  }


  downstreamScenariosFromEvent(eventId: string): Scenario[]
  {
    const trigId = this.getLinkedTriggerId(eventId);
    if (!trigId) return [];
    return this.scenarios.filter(s => s.triggerId === trigId);
  }

  // ---------- Event → Trigger Link ----------
  getLinkedTriggerId(eventId: string): string
  {
    return this.links.find(l => l.eventId === eventId)?.triggerId ?? '';
  }

  setEventTriggerLink(eventId: string, triggerId: string)
  {
    const eId = (eventId || '').trim();
    const tId = (triggerId || '').trim();

    // remove if empty
    if (!tId)
    {
      this.links = this.links.filter(l => l.eventId !== eId);
      this.store.save(COL_LINKS, this.links);
      return;
    }

    // upsert (unique per event)
    const existing = this.links.find(l => l.eventId === eId);
    if (existing)
    {
      this.links = this.links.map(l => l.eventId === eId ? ({ ...l, triggerId: tId }) : l);
    } else
    {
      this.links = [{ id: uid(), eventId: eId, triggerId: tId }, ...this.links];
    }

    this.store.save(COL_LINKS, this.links);
  }

  // ---------- UI ----------
  switchMode(m: Mode)
  {
    this.mode = m;
    this.scenarioFilter = '';
  }

  statsScenario(s: Scenario)
  {
    const pre = (s.preconditionIds?.length ?? 0);

    let act = (s.actions?.length ?? 0);
    let fc = (s.factChanges?.length ?? 0);

    for (const d of (s.decisions ?? []))
    {
      act += (d.actions?.length ?? 0);
      fc += (d.factChanges?.length ?? 0);
    }

    const ev = this.scenarioAllProducedEventIds(s).length;
    const dec = (s.decisions?.length ?? 0);

    return { pre, act, fc, ev, dec };
  }

}
