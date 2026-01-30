import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';

import {
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

type OpenMode = 'row' | 'decision';

type ColName =
  | 'processes'
  | 'stages'
  | 'artifacts'
  | 'facts'
  | 'conditions'
  | 'actors'
  | 'actions'
  | 'triggers'
  | 'events'
  | 'scenarios'
  | 'eventTriggerLinks';

@Component({
  selector: 'app-open-entity',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './open-entity.component.html',
  styleUrls: ['./open-entity.component.scss'],
})
export class OpenEntityComponent {
  col: ColName | '' = '';
  id: number | null = null;
  decisionId: number | null = null;
  mode: OpenMode = 'row';

  title = '';
  error = '';
  jsonText = '';

  private scenarioCache: Scenario | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,

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
    this.route.queryParamMap.subscribe((q) => {
      this.col = ((q.get('col') ?? '').trim() as any) || '';
      this.id = this.toId(q.get('id'));
      this.decisionId = this.toId(q.get('decisionId'));
      this.mode = this.decisionId ? 'decision' : 'row';
      this.load();
    });
  }

  private toId(v: string | null): number | null {
    const s = (v ?? '').toString().trim();
    if (!s) return null;
    const n = +s;
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  load(): void {
    this.error = '';
    this.title = '';
    this.jsonText = '';
    this.scenarioCache = null;

    if (!this.col || this.id == null) {
      this.error = 'پارامترهای col و id لازم است.';
      return;
    }

    // decision داخل scenario
    if (this.mode === 'decision') {
      if (this.col !== 'scenarios') {
        this.error = 'Decision فقط داخل scenarios پشتیبانی می‌شود.';
        return;
      }

      this.scenariosApi.getById(this.id).subscribe({
        next: (scenario: Scenario) => {
          this.scenarioCache = scenario;
          const decisions = scenario.decisions ?? [];
          const did = this.decisionId;
          const dec = did ? decisions.find((d) => d?.id === did) : undefined;

          if (!dec) {
            this.error = `Decision با id=${this.decisionId} داخل Scenario پیدا نشد.`;
            return;
          }

          this.title = `Open Decision | scenarios/${scenario.id} :: ${dec.decisionKey ?? dec.id}`;
          this.jsonText = JSON.stringify(dec, null, 2);
        },
        error: (err: any) => {
          this.error = err?.message ?? 'خطا در دریافت Scenario';
        },
      });
      return;
    }

    // row مستقیم
    this.getRowByCol(this.col, this.id).subscribe({
      next: (row: any) => {
        const key =
          row?.scenarioKey ??
          row?.triggerKey ??
          row?.eventKey ??
          row?.conditionKey ??
          row?.factKey ??
          row?.actionKey ??
          row?.actorKey ??
          row?.artifactKey ??
          row?.stageKey ??
          row?.processKey ??
          row?.id;

        this.title = `Open ${this.col} | ${key ?? this.id}`;
        this.jsonText = JSON.stringify(row, null, 2);
      },
      error: (err: any) => {
        this.error = err?.message ?? 'خطا در دریافت';
      },
    });
  }

  save(): void {
    this.error = '';

    if (!this.col || this.id == null) return;

    let obj: any;
    try {
      obj = JSON.parse(this.jsonText);
    } catch {
      this.error = 'JSON نامعتبر است.';
      return;
    }

    // Decision save => update Scenario
    if (this.mode === 'decision') {
      if (this.col !== 'scenarios') return;
      if (!this.scenarioCache) {
        this.error = 'Scenario در حافظه نیست؛ یکبار Reload بزن.';
        return;
      }

      const scenarioId = this.scenarioCache.id;
      const did = this.decisionId;
      if (!did) {
        this.error = 'decisionId لازم است.';
        return;
      }

      const decisions = [...(this.scenarioCache.decisions ?? [])];
      const idx = decisions.findIndex((d) => d?.id === did);
      if (idx < 0) {
        this.error = 'Decision دیگر وجود ندارد.';
        return;
      }

      // id را خراب نکن
      obj.id = did;
      decisions[idx] = obj;

      const updatedScenario: Scenario = {
        ...this.scenarioCache,
        decisions,
      };

      const payload: Omit<Scenario, 'id'> = {
        scenarioKey: updatedScenario.scenarioKey,
        titleFa: updatedScenario.titleFa,
        description: updatedScenario.description,
        ownerSubdomain: updatedScenario.ownerSubdomain,
        stageId: updatedScenario.stageId,
        triggerId: updatedScenario.triggerId,
        preconditionIds: updatedScenario.preconditionIds ?? [],
        actions: updatedScenario.actions ?? [],
        factChanges: updatedScenario.factChanges ?? [],
        producedEventIds: updatedScenario.producedEventIds ?? [],
        decisions: updatedScenario.decisions ?? [],
      };

      this.scenariosApi.update(scenarioId, payload).subscribe({
        next: (saved: Scenario) => {
          this.scenarioCache = saved;
          this.load();
        },
        error: (err: any) => {
          this.error = err?.message ?? 'خطا در ذخیره Scenario';
        },
      });

      return;
    }

    // Row save
    obj.id = this.id; // id ثابت
    this.updateRowByCol(this.col, this.id, obj).subscribe({
      next: () => this.load(),
      error: (err: any) => {
        this.error = err?.message ?? 'خطا در ذخیره';
      },
    });
  }

  copy(): void {
    navigator.clipboard?.writeText(this.jsonText);
  }

  back(): void {
    this.router.navigateByUrl('/');
  }

  // ---------- API routers ----------
  private getRowByCol(col: ColName, id: number): Observable<any> {
    switch (col) {
      case 'processes':
        return this.processesApi.getById(id) as unknown as Observable<Process>;
      case 'stages':
        return this.stagesApi.getById(id) as unknown as Observable<Stage>;
      case 'artifacts':
        return this.artifactsApi.getById(id) as unknown as Observable<Artifact>;
      case 'facts':
        return this.factsApi.getById(id) as unknown as Observable<Fact>;
      case 'conditions':
        return this.conditionsApi.getById(id) as unknown as Observable<Condition>;
      case 'actors':
        return this.actorsApi.getById(id) as unknown as Observable<ActorDefinition>;
      case 'actions':
        return this.actionsApi.getById(id) as unknown as Observable<ActionDefinition>;
      case 'triggers':
        return this.triggersApi.getById(id) as unknown as Observable<TriggerDefinition>;
      case 'events':
        return this.eventsApi.getById(id) as unknown as Observable<EventDefinition>;
      case 'scenarios':
        return this.scenariosApi.getById(id) as unknown as Observable<Scenario>;
      case 'eventTriggerLinks':
        return this.linksApi.getById(id) as unknown as Observable<EventTriggerLink>;
      default:
        return of(null);
    }
  }

  private updateRowByCol(col: ColName, id: number, obj: any): Observable<any> {
    switch (col) {
      case 'processes': {
        const payload: Omit<Process, 'id'> = {
          processKey: (obj.processKey ?? '').toString(),
          titleFa: obj.titleFa ?? undefined,
          description: obj.description ?? undefined,
          order: obj.order ?? undefined,
        };
        return this.processesApi.update(id, payload) as unknown as Observable<Process>;
      }

      case 'stages': {
        const payload: Omit<Stage, 'id'> = {
          processId: Number(obj.processId) || 0,
          stageKey: (obj.stageKey ?? '').toString(),
          titleFa: obj.titleFa ?? undefined,
          description: obj.description ?? undefined,
          order: obj.order ?? undefined,
        };
        return this.stagesApi.update(id, payload) as unknown as Observable<Stage>;
      }

      case 'artifacts': {
        const payload: Omit<Artifact, 'id'> = {
          artifactKey: (obj.artifactKey ?? '').toString(),
          titleFa: obj.titleFa ?? undefined,
          description: obj.description ?? undefined,
          isChildOfCase: !!obj.isChildOfCase,
        };
        return this.artifactsApi.update(id, payload) as unknown as Observable<Artifact>;
      }

      case 'facts': {
        const payload: Omit<Fact, 'id'> = {
          artifactId: Number(obj.artifactId) || 0,
          factKey: (obj.factKey ?? '').toString(),
          valueType: Number(obj.valueType) || 0,
          meaning: obj.meaning ?? undefined,
        };
        return this.factsApi.update(id, payload) as unknown as Observable<Fact>;
      }

      case 'conditions': {
        const payload: Omit<Condition, 'id'> = {
          conditionKey: (obj.conditionKey ?? '').toString(),
          titleFa: obj.titleFa ?? undefined,
          expression: (obj.expression ?? '').toString(),
          failMessage: obj.failMessage ?? undefined,
          factIdsUsed: Array.isArray(obj.factIdsUsed) ? obj.factIdsUsed.map((x: any) => +x) : [],
        };
        return this.conditionsApi.update(id, payload) as unknown as Observable<Condition>;
      }

      case 'actors': {
        const payload: Omit<ActorDefinition, 'id'> = {
          actorKey: (obj.actorKey ?? '').toString(),
          titleFa: obj.titleFa ?? undefined,
          kind: (obj.kind ?? 'Human').toString(),
          description: obj.description ?? undefined,
        };
        return this.actorsApi.update(id, payload) as unknown as Observable<ActorDefinition>;
      }

      case 'actions': {
        const payload: Omit<ActionDefinition, 'id'> = {
          actionKey: (obj.actionKey ?? '').toString(),
          titleFa: obj.titleFa ?? undefined,
          targetArtifactId: Number(obj.targetArtifactId) || 0,
          executorKind: (obj.executorKind ?? 'System').toString(),
          executorActorId: obj.executorActorId == null ? undefined : Number(obj.executorActorId),
          description: obj.description ?? undefined,
          defaultParamsJson: obj.defaultParamsJson ?? undefined,
        };
        return this.actionsApi.update(id, payload) as unknown as Observable<ActionDefinition>;
      }

      case 'triggers': {
        const payload: Omit<TriggerDefinition, 'id'> = {
          triggerKey: (obj.triggerKey ?? '').toString(),
          titleFa: obj.titleFa ?? undefined,
          description: obj.description ?? undefined,
        };
        return this.triggersApi.update(id, payload) as unknown as Observable<TriggerDefinition>;
      }

      case 'events': {
        const payload: Omit<EventDefinition, 'id'> = {
          eventKey: (obj.eventKey ?? '').toString(),
          titleFa: obj.titleFa ?? undefined,
          description: obj.description ?? undefined,
        };
        return this.eventsApi.update(id, payload) as unknown as Observable<EventDefinition>;
      }

      case 'eventTriggerLinks': {
        const payload: Omit<EventTriggerLink, 'id'> = {
          eventId: Number(obj.eventId) || 0,
          triggerId: Number(obj.triggerId) || 0,
        };
        return this.linksApi.update(id, payload) as unknown as Observable<EventTriggerLink>;
      }

      case 'scenarios': {
        const payload: Omit<Scenario, 'id'> = {
          scenarioKey: (obj.scenarioKey ?? '').toString(),
          titleFa: obj.titleFa ?? undefined,
          description: obj.description ?? undefined,
          ownerSubdomain: obj.ownerSubdomain ?? undefined,
          stageId: Number(obj.stageId) || 0,
          triggerId: obj.triggerId == null ? undefined : Number(obj.triggerId),
          preconditionIds: Array.isArray(obj.preconditionIds) ? obj.preconditionIds.map((x: any) => +x) : [],
          actions: Array.isArray(obj.actions) ? obj.actions : [],
          factChanges: Array.isArray(obj.factChanges) ? obj.factChanges : [],
          producedEventIds: Array.isArray(obj.producedEventIds) ? obj.producedEventIds.map((x: any) => +x) : [],
          decisions: Array.isArray(obj.decisions) ? obj.decisions : [],
        };
        return this.scenariosApi.update(id, payload) as unknown as Observable<Scenario>;
      }

      default:
        return of(null);
    }
  }
}
