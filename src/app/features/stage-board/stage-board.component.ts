import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CatalogStoreService } from '../../core/catalog-store.service';
import
  {
    EventDefinition,
    EventTriggerLink,
    Process,
    Scenario,
    Stage,
    TriggerDefinition,
  } from '../../core/types';

const COL_PROCESSES = 'processes';
const COL_STAGES = 'stages';
const COL_SCENARIOS = 'scenarios';
const COL_TRIGGERS = 'triggers';
const COL_EVENTS = 'events';
const COL_LINKS = 'eventTriggerLinks';

@Component({
  selector: 'app-stage-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stage-board.component.html',
  styleUrls: ['./stage-board.component.scss'],
})
export class StageBoardComponent
{
  processes: Process[] = [];
  stages: Stage[] = [];
  scenarios: Scenario[] = [];
  triggers: TriggerDefinition[] = [];
  events: EventDefinition[] = [];
  links: EventTriggerLink[] = [];

  selectedProcessId = '';
  selectedStageId = '';

  stageFilter = '';
  scenarioFilter = '';

  constructor(private store: CatalogStoreService)
  {
    // ✅ init in constructor
    this.processes = this.store.list<Process>(COL_PROCESSES);
    this.stages = this.store.list<Stage>(COL_STAGES);
    this.scenarios = this.store.list<Scenario>(COL_SCENARIOS);
    this.triggers = this.store.list<TriggerDefinition>(COL_TRIGGERS);
    this.events = this.store.list<EventDefinition>(COL_EVENTS);
    this.links = this.store.list<EventTriggerLink>(COL_LINKS);

    this.selectedProcessId = this.processes[0]?.id ?? '';
    this.selectedStageId = this.stagesInSelectedProcess[0]?.id ?? '';
  }

  // ---------- computed ----------
  get stagesInSelectedProcess(): Stage[]
  {
    const pid = this.selectedProcessId;
    const q = (this.stageFilter || '').trim().toLowerCase();

    let list = pid ? this.stages.filter(s => s.processId === pid) : [...this.stages];
    list = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (!q) return list;
    return list.filter(s =>
      s.stageKey.toLowerCase().includes(q) ||
      (s.titleFa ?? '').toLowerCase().includes(q)
    );
  }

  get scenariosInSelectedStage(): Scenario[]
  {
    const sid = this.selectedStageId;
    const q = (this.scenarioFilter || '').trim().toLowerCase();

    let list = sid ? this.scenarios.filter(s => s.stageId === sid) : [...this.scenarios];

    // مرتب‌سازی پیشنهادی: اول by scenarioKey
    list = [...list].sort((a, b) => (a.scenarioKey ?? '').localeCompare(b.scenarioKey ?? ''));

    if (!q) return list;
    return list.filter(s =>
      s.scenarioKey.toLowerCase().includes(q) ||
      (s.titleFa ?? '').toLowerCase().includes(q) ||
      (s.ownerSubdomain ?? '').toLowerCase().includes(q)
    );
  }

  // ---------- helpers ----------
  onProcessChanged(pid: string)
  {
    this.selectedProcessId = pid;
    const firstStage = this.stagesInSelectedProcess[0];
    this.selectedStageId = firstStage?.id ?? '';
  }

  processKeyById(id?: string): string
  {
    if (!id) return '—';
    return this.processes.find(p => p.id === id)?.processKey ?? '—';
  }

  stageKeyById(id?: string): string
  {
    if (!id) return '—';
    return this.stages.find(s => s.id === id)?.stageKey ?? '—';
  }

  stageTitleById(id?: string): string
  {
    if (!id) return '—';
    return this.stages.find(s => s.id === id)?.titleFa ?? '—';
  }

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

  eventLinkedTriggerKey(eventId: string): string
  {
    const tid = this.links.find(l => l.eventId === eventId)?.triggerId;
    if (!tid) return '';
    return this.triggerKeyById(tid);
  }

  summaryStage()
  {
    const list = this.scenariosInSelectedStage ?? [];

    let noTrigger = 0, noAction = 0, noEvent = 0;
    let decisions = 0;

    for (const s of list as any[])
    {
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


  statsScenario(s: any)
  {
    const pre = (s.preconditionIds?.length ?? 0);
    const act = (s.actions?.length ?? 0);
    const fc = (s.factChanges?.length ?? 0);
    const ev = (s.producedEventIds?.length ?? 0);

    const dec = (s.decisions?.length ?? 0);

    // اگر تصمیم‌ها event/action تولید می‌کنن و می‌خوای حساب بشن:
    const decAct = (s.decisions ?? []).reduce((a: number, d: any) => a + (d.actions?.length ?? 0), 0);
    const decEv = (s.decisions ?? []).reduce((a: number, d: any) => a + (d.producedEventIds?.length ?? 0), 0);

    return { pre, act, fc, ev, dec, decAct, decEv };
  }


  warningsScenario(s: Scenario): string[]
  {
    const w: string[] = [];
    if (!s.triggerId) w.push('Trigger ندارد');

    if (this.scenarioTotalActions(s) === 0) w.push('Action ندارد');

    if (this.scenarioAllProducedEventIds(s).length === 0) w.push('Event تولید نمی‌کند');

    return w;
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

  scenarioEventSources(s: Scenario, eventId: string): string[]
  {
    const src: string[] = [];
    if ((s.producedEventIds ?? []).includes(eventId)) src.push('Base');
    for (const d of (s.decisions ?? []))
    {
      if ((d.producedEventIds ?? []).includes(eventId)) src.push(`Decision:${d.decisionKey}`);
    }
    return src;
  }

  scenarioTotalActions(s: Scenario): number
  {
    let n = (s.actions?.length ?? 0);
    for (const d of (s.decisions ?? [])) n += (d.actions?.length ?? 0);
    return n;
  }

  scenarioTotalFactChanges(s: Scenario): number
  {
    let n = (s.factChanges?.length ?? 0);
    for (const d of (s.decisions ?? [])) n += (d.factChanges?.length ?? 0);
    return n;
  }

}
