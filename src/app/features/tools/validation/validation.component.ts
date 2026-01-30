import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ActionApiService } from '../../../core/api/action-api.service';
import { ActorApiService } from '../../../core/api/actor-api.service';
import { ArtifactApiService } from '../../../core/api/artifact-api.service';
import { ConditionApiService } from '../../../core/api/condition-api.service';
import { EventApiService } from '../../../core/api/event-api.service';
import { EventTriggerLinkApiService } from '../../../core/api/event-trigger-link-api.service';
import { FactApiService } from '../../../core/api/fact-api.service';
import { ProcessApiService } from '../../../core/api/process-api.service';
import { ScenarioApiService } from '../../../core/api/scenario-api.service';
import { StageApiService } from '../../../core/api/stage-api.service';
import { TriggerApiService } from '../../../core/api/trigger-api.service';
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
  id: number;
  decisionId?: number;
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

  error: string | null = null;
  isLoading = false;

  constructor(
    private processesApi: ProcessApiService,
    private stagesApi: StageApiService,
    private artifactsApi: ArtifactApiService,
    private factsApi: FactApiService,
    private conditionsApi: ConditionApiService,
    private actorsApi: ActorApiService,
    private actionsApi: ActionApiService,
    private triggersApi: TriggerApiService,
    private eventsApi: EventApiService,
    private scenariosApi: ScenarioApiService,
    private linksApi: EventTriggerLinkApiService,
  ) {
    this.run();
  }

  run()
  {
    this.error = null;
    this.isLoading = true;

    forkJoin({
      processes: this.processesApi.list(),
      stages: this.stagesApi.list(),
      artifacts: this.artifactsApi.list(),
      facts: this.factsApi.list(),
      conditions: this.conditionsApi.list(),
      actors: this.actorsApi.list(),
      actions: this.actionsApi.list(),
      triggers: this.triggersApi.list(),
      events: this.eventsApi.list(),
      scenarios: this.scenariosApi.list(),
      links: this.linksApi.list(),
    }).subscribe({
      next: (res) => {
        const processes: Process[] = res.processes ?? [];
        const stages: Stage[] = res.stages ?? [];
        const artifacts: Artifact[] = res.artifacts ?? [];
        const facts: Fact[] = res.facts ?? [];
        const conds: Condition[] = (res.conditions ?? []) as Condition[];
        const actors: ActorDefinition[] = res.actors ?? [];
        const actions: ActionDefinition[] = res.actions ?? [];
        const triggers: TriggerDefinition[] = res.triggers ?? [];
        const events: EventDefinition[] = res.events ?? [];
        const scenarios: Scenario[] = res.scenarios ?? [];
        const links: EventTriggerLink[] = res.links ?? [];

        // (processes currently unused, but kept here for completeness)
        void processes;

        const stageById = new Map<number, Stage>(stages.map((x) => [x.id, x]));
        const artifactById = new Map<number, Artifact>(artifacts.map((x) => [x.id, x]));
        const factById = new Map<number, Fact>(facts.map((x) => [x.id, x]));
        const condById = new Map<number, Condition>(conds.map((x) => [x.id, x]));
        const actorById = new Map<number, ActorDefinition>(actors.map((x) => [x.id, x]));
        const actionById = new Map<number, ActionDefinition>(actions.map((x) => [x.id, x]));
        const triggerById = new Map<number, TriggerDefinition>(triggers.map((x) => [x.id, x]));
        const eventById = new Map<number, EventDefinition>(events.map((x) => [x.id, x]));

        const linkedEventIds = new Set<number>(links.map((l) => l.eventId));

        const out: Issue[] = [];
        const add = (issue: Issue) => out.push(issue);

        // Facts
        for (const f of facts) {
          const ref = f.factKey ?? f.id;

          if (!f.artifactId) {
            add({ level: 'error', scope: 'Fact', refKey: String(ref), message: 'artifactId ندارد', open: { col: COLS.facts, id: f.id } });
          } else if (!artifactById.has(f.artifactId)) {
            add({ level: 'error', scope: 'Fact', refKey: String(ref), message: `artifactId نامعتبر: ${f.artifactId}`, open: { col: COLS.facts, id: f.id } });
          }
        }

        // Conditions
        for (const c of conds) {
          const ref = c.conditionKey ?? c.id;

          if (!(c.expression ?? '').trim()) {
            add({ level: 'error', scope: 'Condition', refKey: String(ref), message: 'expression خالی است', open: { col: COLS.conditions, id: c.id } });
          }

          const used = (c.factIdsUsed ?? []);
          if (!used.length) {
            add({ level: 'warn', scope: 'Condition', refKey: String(ref), message: 'factIdsUsed خالی است (برای تحلیل/Refactor بهتر است پر شود)', open: { col: COLS.conditions, id: c.id } });
          }
          for (const fid of used) {
            if (!factById.has(fid)) {
              add({ level: 'error', scope: 'Condition', refKey: String(ref), message: `factIdsUsed شامل Fact نامعتبر است: ${fid}`, open: { col: COLS.conditions, id: c.id } });
            }
          }
        }

        // Actions
        for (const a of actions) {
          const ref = a.actionKey ?? a.id;

          if (!a.targetArtifactId) {
            add({ level: 'error', scope: 'Action', refKey: String(ref), message: 'targetArtifactId ندارد', open: { col: COLS.actions, id: a.id } });
          } else if (!artifactById.has(a.targetArtifactId)) {
            add({ level: 'error', scope: 'Action', refKey: String(ref), message: `targetArtifactId نامعتبر: ${a.targetArtifactId}`, open: { col: COLS.actions, id: a.id } });
          }

          if (a.executorKind === 'Human' && a.executorActorId && !actorById.has(a.executorActorId)) {
            add({ level: 'error', scope: 'Action', refKey: String(ref), message: `executorActorId نامعتبر: ${a.executorActorId}`, open: { col: COLS.actions, id: a.id } });
          }
          if (a.executorKind === 'Human' && !a.executorActorId) {
            add({ level: 'warn', scope: 'Action', refKey: String(ref), message: 'executorKind=Human ولی executorActorId خالی است', open: { col: COLS.actions, id: a.id } });
          }
        }

        // Links
        for (const l of links) {
          const ref = l.id ?? `${l.eventId}->${l.triggerId}`;

          if (!eventById.has(l.eventId)) {
            add({ level: 'error', scope: 'EventTriggerLink', refKey: String(ref), message: `eventId نامعتبر: ${l.eventId}`, open: { col: COLS.links, id: l.id } });
          }
          if (!triggerById.has(l.triggerId)) {
            add({ level: 'error', scope: 'EventTriggerLink', refKey: String(ref), message: `triggerId نامعتبر: ${l.triggerId}`, open: { col: COLS.links, id: l.id } });
          }
        }

        // Scenarios + Decisions
        for (const s of scenarios) {
          const ref = s.scenarioKey ?? s.id;

          if (!s.stageId || !stageById.has(s.stageId)) {
            add({ level: 'error', scope: 'Scenario', refKey: String(ref), message: `stageId نامعتبر/خالی: ${s.stageId}`, open: { col: COLS.scenarios, id: s.id } });
          }
          if (!s.triggerId || !triggerById.has(s.triggerId)) {
            add({ level: 'warn', scope: 'Scenario', refKey: String(ref), message: `triggerId خالی/نامعتبر: ${s.triggerId}`, open: { col: COLS.scenarios, id: s.id } });
          }

          for (const cid of (s.preconditionIds ?? [])) {
            if (!condById.has(cid)) {
              add({ level: 'error', scope: 'Scenario', refKey: String(ref), message: `preconditionId نامعتبر: ${cid}`, open: { col: COLS.scenarios, id: s.id } });
            }
          }

          for (const ar of (s.actions ?? [])) {
            if (!actionById.has(ar.actionId)) {
              add({ level: 'error', scope: 'Scenario', refKey: String(ref), message: `actionRef نامعتبر: ${ar.actionId}`, open: { col: COLS.scenarios, id: s.id } });
            }
          }

          for (const eid of (s.producedEventIds ?? [])) {
            if (!eventById.has(eid)) {
              add({ level: 'error', scope: 'Scenario', refKey: String(ref), message: `producedEventId نامعتبر: ${eid}`, open: { col: COLS.scenarios, id: s.id } });
            } else if (!linkedEventIds.has(eid)) {
              add({ level: 'warn', scope: 'Scenario', refKey: String(ref), message: `Event بدون Link: ${eventById.get(eid)!.eventKey}`, open: { col: COLS.scenarios, id: s.id } });
            }
          }

          for (const d of (s.decisions ?? [])) {
            const dref = `${ref}::${d.decisionKey || d.id}`;

            if (!(d.decisionKey ?? '').trim()) {
              add({ level: 'error', scope: 'Decision', refKey: dref, message: 'decisionKey خالی است', open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
            }

            if (!((d.uiActionKey ?? '').trim())) {
              add({ level: 'warn', scope: 'Decision', refKey: dref, message: 'uiActionKey ندارد (به دکمه UI وصل نیست)', open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
            }

            for (const cid of (d.conditionIds ?? [])) {
              if (!condById.has(cid)) {
                add({ level: 'error', scope: 'Decision', refKey: dref, message: `conditionId نامعتبر: ${cid}`, open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
              }
            }

            for (const ar of (d.actions ?? [])) {
              if (!actionById.has(ar.actionId)) {
                add({ level: 'error', scope: 'Decision', refKey: dref, message: `actionRef نامعتبر: ${ar.actionId}`, open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
              }
            }

            for (const eid of (d.producedEventIds ?? [])) {
              if (!eventById.has(eid)) {
                add({ level: 'error', scope: 'Decision', refKey: dref, message: `producedEventId نامعتبر: ${eid}`, open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
              } else if (!linkedEventIds.has(eid)) {
                add({ level: 'warn', scope: 'Decision', refKey: dref, message: `Event بدون Link: ${eventById.get(eid)!.eventKey}`, open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
              }
            }

            const hasAnyEffect =
              (d.actions?.length ?? 0) +
              (d.factChanges?.length ?? 0) +
              (d.producedEventIds?.length ?? 0) > 0;

            if (!hasAnyEffect) {
              add({ level: 'warn', scope: 'Decision', refKey: dref, message: 'Decision هیچ خروجی ندارد (action/factChange/event خالی)', open: { col: COLS.scenarios, id: s.id, decisionId: d.id } });
            }
          }
        }

        // مرتب‌سازی
        out.sort((a, b) => (a.level === b.level ? a.scope.localeCompare(b.scope) : a.level === 'error' ? -1 : 1));

        this.issues = out;
        this.isLoading = false;
      },
      error: (err: unknown) => {
        const msg = (err as { message?: string } | null)?.message;
        this.error = msg ?? 'خطا در ارتباط با API';
        this.issues = [];
        this.isLoading = false;
      },
    });
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
