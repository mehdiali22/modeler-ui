import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CatalogStoreService } from '../../../core/catalog-store.service';
import
  {
    ActionDefinition,
    ActorDefinition,
    Artifact,
    Condition,
    EventDefinition,
    EventTriggerLink,
    Fact,
    Process,
    Scenario,
    Stage,
    TriggerDefinition,
  } from '../../../core/types';

const COLS = {
  processes: 'processes',
  stages: 'stages',
  artifacts: 'artifacts',
  facts: 'facts',
  conditions: 'conditions',
  actors: 'actors',
  actions: 'actions',
  triggers: 'triggers',
  events: 'events',
  scenarios: 'scenarios',
  links: 'eventTriggerLinks',
} as const;

type Level = 'error' | 'warn';

type OpenRef = {
  col: string;
  id: string;
  decisionId?: string;
};

type Issue = {
  level: Level;
  scope: string;
  refKey: string;
  message: string;
  open?: OpenRef; // ✅ اضافه شد
};

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [CommonModule, RouterModule], // ✅ RouterModule اضافه شد
  templateUrl: './validation.component.html',
  styleUrls: ['./validation.component.scss'],
})
export class ValidationComponent
{
  issues: Issue[] = [];
  level: '' | Level = '';
  q = '';

  constructor(private store: CatalogStoreService)
  {
    this.run();
  }

  run()
  {
    const processes = this.store.list<Process>(COLS.processes);
    const stages = this.store.list<Stage>(COLS.stages);
    const artifacts = this.store.list<Artifact>(COLS.artifacts);
    const facts = this.store.list<Fact>(COLS.facts);
    const conds = this.store.list<Condition>(COLS.conditions);
    const actors = this.store.list<ActorDefinition>(COLS.actors);
    const actions = this.store.list<ActionDefinition>(COLS.actions);
    const triggers = this.store.list<TriggerDefinition>(COLS.triggers);
    const events = this.store.list<EventDefinition>(COLS.events);
    const scenarios = this.store.list<Scenario>(COLS.scenarios);
    const links = this.store.list<EventTriggerLink>(COLS.links);

    const stageById = new Map(stages.map(x => [x.id, x]));
    const artifactById = new Map(artifacts.map(x => [x.id, x]));
    const factById = new Map(facts.map(x => [x.id, x]));
    const condById = new Map(conds.map(x => [x.id, x]));
    const actorById = new Map(actors.map(x => [x.id, x]));
    const actionById = new Map(actions.map(x => [x.id, x]));
    const triggerById = new Map(triggers.map(x => [x.id, x]));
    const eventById = new Map(events.map(x => [x.id, x]));

    const linkedEventIds = new Set(links.map(l => l.eventId));

    const out: Issue[] = [];

    const add = (issue: Issue) => out.push(issue);

    // Facts
    for (const f of facts)
    {
      const ref = f.factKey ?? f.id;

      if (!f.artifactId)
      {
        add({ level: 'error', scope: 'Fact', refKey: ref, message: 'artifactId ندارد', open: { col: COLS.facts, id: f.id } });
      } else if (!artifactById.has(f.artifactId))
      {
        add({ level: 'error', scope: 'Fact', refKey: ref, message: `artifactId نامعتبر: ${f.artifactId}`, open: { col: COLS.facts, id: f.id } });
      }
    }

    // Conditions
    for (const c of conds)
    {
      const ref = c.conditionKey ?? c.id;

      if (!(c.expression ?? '').trim())
      {
        add({ level: 'error', scope: 'Condition', refKey: ref, message: 'expression خالی است', open: { col: COLS.conditions, id: c.id } });
      }

      const used = (c.factIdsUsed ?? []);
      if (!used.length)
      {
        add({ level: 'warn', scope: 'Condition', refKey: ref, message: 'factIdsUsed خالی است (برای تحلیل/Refactor بهتر است پر شود)', open: { col: COLS.conditions, id: c.id } });
      }
      for (const fid of used)
      {
        if (!factById.has(fid))
        {
          add({ level: 'error', scope: 'Condition', refKey: ref, message: `factIdsUsed شامل Fact نامعتبر است: ${fid}`, open: { col: COLS.conditions, id: c.id } });
        }
      }
    }

    // Actions
    for (const a of actions)
    {
      const ref = a.actionKey ?? a.id;

      if (!a.targetArtifactId)
      {
        add({ level: 'error', scope: 'Action', refKey: ref, message: 'targetArtifactId ندارد', open: { col: COLS.actions, id: a.id } });
      } else if (!artifactById.has(a.targetArtifactId))
      {
        add({ level: 'error', scope: 'Action', refKey: ref, message: `targetArtifactId نامعتبر: ${a.targetArtifactId}`, open: { col: COLS.actions, id: a.id } });
      }

      if (a.executorKind === 'Human' && a.executorActorId && !actorById.has(a.executorActorId))
      {
        add({ level: 'error', scope: 'Action', refKey: ref, message: `executorActorId نامعتبر: ${a.executorActorId}`, open: { col: COLS.actions, id: a.id } });
      }
      if (a.executorKind === 'Human' && !a.executorActorId)
      {
        add({ level: 'warn', scope: 'Action', refKey: ref, message: 'executorKind=Human ولی executorActorId خالی است', open: { col: COLS.actions, id: a.id } });
      }
    }

    // Links
    for (const l of links)
    {
      const ref = l.id ?? `${l.eventId}->${l.triggerId}`;

      if (!eventById.has(l.eventId))
      {
        add({ level: 'error', scope: 'EventTriggerLink', refKey: ref, message: `eventId نامعتبر: ${l.eventId}`, open: { col: COLS.links, id: l.id } });
      }
      if (!triggerById.has(l.triggerId))
      {
        add({ level: 'error', scope: 'EventTriggerLink', refKey: ref, message: `triggerId نامعتبر: ${l.triggerId}`, open: { col: COLS.links, id: l.id } });
      }
    }

    // Scenarios + Decisions
    for (const s of scenarios)
    {
      const ref = s.scenarioKey ?? s.id;

      if (!s.stageId || !stageById.has(s.stageId))
      {
        add({ level: 'error', scope: 'Scenario', refKey: ref, message: `stageId نامعتبر/خالی: ${s.stageId}`, open: { col: COLS.scenarios, id: s.id } });
      }
      if (!s.triggerId || !triggerById.has(s.triggerId))
      {
        add({ level: 'warn', scope: 'Scenario', refKey: ref, message: `triggerId خالی/نامعتبر: ${s.triggerId}`, open: { col: COLS.scenarios, id: s.id } });
      }

      for (const cid of (s.preconditionIds ?? []))
      {
        if (!condById.has(cid))
        {
          add({ level: 'error', scope: 'Scenario', refKey: ref, message: `preconditionId نامعتبر: ${cid}`, open: { col: COLS.scenarios, id: s.id } });
        }
      }

      for (const ar of (s.actions ?? []))
      {
        if (!actionById.has(ar.actionId))
        {
          add({ level: 'error', scope: 'Scenario', refKey: ref, message: `actionRef نامعتبر: ${ar.actionId}`, open: { col: COLS.scenarios, id: s.id } });
        }
      }

      for (const eid of (s.producedEventIds ?? []))
      {
        if (!eventById.has(eid))
        {
          add({ level: 'error', scope: 'Scenario', refKey: ref, message: `producedEventId نامعتبر: ${eid}`, open: { col: COLS.scenarios, id: s.id } });
        } else if (!linkedEventIds.has(eid))
        {
          add({ level: 'warn', scope: 'Scenario', refKey: ref, message: `Event بدون Link: ${eventById.get(eid)!.eventKey}`, open: { col: COLS.scenarios, id: s.id } });
        }
      }

      // decisions (V3)
      const decisions: any[] = (s as any).decisions ?? [];
      for (const d of decisions)
      {
        const dref = `${ref}::${d.decisionKey || d.id}`;

        if (!(d.decisionKey ?? '').trim())
        {
          add({ level: 'error', scope: 'Decision', refKey: dref, message: 'decisionKey خالی است', open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
        }

        if (!((d.uiActionKey ?? '').trim()))
        {
          add({ level: 'warn', scope: 'Decision', refKey: dref, message: 'uiActionKey ندارد (به دکمه UI وصل نیست)', open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
        }

        for (const cid of (d.conditionIds ?? []))
        {
          if (!condById.has(cid))
          {
            add({ level: 'error', scope: 'Decision', refKey: dref, message: `conditionId نامعتبر: ${cid}`, open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
          }
        }

        for (const ar of (d.actions ?? []))
        {
          if (!actionById.has(ar.actionId))
          {
            add({ level: 'error', scope: 'Decision', refKey: dref, message: `actionRef نامعتبر: ${ar.actionId}`, open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
          }
        }

        for (const eid of (d.producedEventIds ?? []))
        {
          if (!eventById.has(eid))
          {
            add({ level: 'error', scope: 'Decision', refKey: dref, message: `producedEventId نامعتبر: ${eid}`, open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
          } else if (!linkedEventIds.has(eid))
          {
            add({ level: 'warn', scope: 'Decision', refKey: dref, message: `Event بدون Link: ${eventById.get(eid)!.eventKey}`, open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
          }
        }

        const hasAnyEffect =
          (d.actions?.length ?? 0) +
          (d.factChanges?.length ?? 0) +
          (d.producedEventIds?.length ?? 0) > 0;

        if (!hasAnyEffect)
        {
          add({ level: 'warn', scope: 'Decision', refKey: dref, message: 'Decision هیچ خروجی ندارد (action/factChange/event خالی)', open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
        }
      }
    }

    // مرتب‌سازی
    out.sort((a, b) =>
      (a.level === b.level ? a.scope.localeCompare(b.scope) : a.level === 'error' ? -1 : 1)
    );

    this.issues = out;
  }

  get filtered(): Issue[]
  {
    const q = this.q.trim().toLowerCase();
    return this.issues.filter(i =>
    {
      if (this.level && i.level !== this.level) return false;
      if (!q) return true;
      return (
        i.scope.toLowerCase().includes(q) ||
        i.refKey.toLowerCase().includes(q) ||
        i.message.toLowerCase().includes(q)
      );
    });
  }
}
