import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { forkJoin } from 'rxjs';

import { ProcessApiService } from '../../../core/api/process-api.service';
import { SubProcessApiService } from '../../../core/api/sub-process-api.service';
import { StageApiService } from '../../../core/api/stage-api.service';
import { KartablApiService } from '../../../core/api/kartabl-api.service';
import { KartablRoutingRuleApiService } from '../../../core/api/kartabl-routing-rule-api.service';
import { ScenarioApiService } from '../../../core/api/scenario-api.service';
import { ScenarioDecisionApiService } from '../../../core/api/scenario-decision-api.service';
import { ScenarioDecisionOptionApiService } from '../../../core/api/scenario-decision-option-api.service';
import { ActionApiService } from '../../../core/api/action-api.service';
import { DecisionOptionFactChangeApiService } from '../../../core/api/decision-option-fact-change-api.service';
import { FactApiService } from '../../../core/api/fact-api.service';
import { EntityStateApiService } from '../../../core/api/entity-state-api.service';
import { ActionStateTransitionApiService } from '../../../core/api/action-state-transition-api.service';
type FlowLevel = 'process' | 'sub-process' | 'stage' | 'scenario' | 'action';
import { ToastService } from '../../../core/toast.service';
import {
  ActionDefinition,
  ActionFlowLink,
  ActionStateTransition,
  DecisionOptionFactChange,
  EntityState,
  Fact,
  Kartabl,
  KartablRoutingRule,
  LevelFlowLink,
  LevelFlowPort,
  Process,
  Scenario,
  ScenarioDecision,
  ScenarioDecisionOption,
  Stage,
  SubProcess,
} from '../../../core/types';

type MermaidMode =
  | 'state-action-activity'
  | 'structure'
  | 'routing'
  | 'full';

type LevelFlowData = {
  ports: LevelFlowPort[];
  links: Array<LevelFlowLink | ActionFlowLink>;
};

type ModelData = {
  processes: Process[];
  subProcesses: SubProcess[];
  stages: Stage[];
  kartabls: Kartabl[];
  scenarios: Scenario[];
  decisions: ScenarioDecision[];
  options: ScenarioDecisionOption[];
  optionFactChanges: DecisionOptionFactChange[];
  facts: Fact[];
  rules: KartablRoutingRule[];
  actions: ActionDefinition[];
  states: EntityState[];
  actionStateTransitions: ActionStateTransition[];
  levelFlows: Record<FlowLevel, LevelFlowData>;
};

@Component({
  selector: 'app-mermaid-export',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mermaid-export.component.html',
  styleUrls: ['./mermaid-export.component.scss'],
})
export class MermaidExportComponent {
  data: ModelData = {
    processes: [],
    subProcesses: [],
    stages: [],
    kartabls: [],
    scenarios: [],
    decisions: [],
    options: [],
    optionFactChanges: [],
    facts: [],
    rules: [],
    actions: [],
    states: [],
    actionStateTransitions: [],
    levelFlows: {
      process: { ports: [], links: [] },
      'sub-process': { ports: [], links: [] },
      stage: { ports: [], links: [] },
      scenario: { ports: [], links: [] },
      action: { ports: [], links: [] },
    },
  };

  selectedProcessId: number | '' = '';
  selectedSubProcessId: number | '' = '';
  selectedStageId: number | '' = '';
  selectedScenarioId: number | '' = '';
  selectedActionId: number | '' = '';

  mode: MermaidMode = 'state-action-activity';
  mermaid = '';
  isLoading = false;
  error: string | null = null;

  constructor(
    private processesApi: ProcessApiService,
    private subProcessesApi: SubProcessApiService,
    private stagesApi: StageApiService,
    private kartablsApi: KartablApiService,
    private scenariosApi: ScenarioApiService,
    private scenarioDecisionsApi: ScenarioDecisionApiService,
    private scenarioDecisionOptionsApi: ScenarioDecisionOptionApiService,
    private decisionOptionFactChangesApi: DecisionOptionFactChangeApiService,
    private factsApi: FactApiService,
    private statesApi: EntityStateApiService,
    private actionStateTransitionsApi: ActionStateTransitionApiService,
    private routingRulesApi: KartablRoutingRuleApiService,
    private actionsApi: ActionApiService,
    private toast: ToastService,
  ) {
    this.refresh();
  }

  refresh(): void {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      processes: this.processesApi.list(),
      subProcesses: this.subProcessesApi.list(),
      stages: this.stagesApi.list(),
      kartabls: this.kartablsApi.list(),
      scenarios: this.scenariosApi.list(),
      decisions: this.scenarioDecisionsApi.list(),
      options: this.scenarioDecisionOptionsApi.list(),
      optionFactChanges: this.decisionOptionFactChangesApi.list(),
      facts: this.factsApi.list(),
      states: this.statesApi.list(),
      actionStateTransitions: this.actionStateTransitionsApi.list(),
      rules: this.routingRulesApi.list(),
      actions: this.actionsApi.list(),
    }).subscribe({
      next: (data) => {
        this.data = {
          processes: this.sortByOrderThenTitle(data.processes),
          subProcesses: this.sortByOrderThenTitle(data.subProcesses),
          stages: this.sortByOrderThenTitle(data.stages),
          kartabls: this.sortByTitle(data.kartabls),
          scenarios: this.sortByTitle(data.scenarios),
          decisions: this.sortByTitle(data.decisions),
          options: this.sortByTitle(data.options),
          optionFactChanges: [...data.optionFactChanges].sort(
            (a, b) =>
              (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
              a.id - b.id,
          ),
          facts: this.sortFacts(data.facts),
          states: this.sortByTitle(data.states),
          actionStateTransitions: [...data.actionStateTransitions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id),
          rules: [...data.rules].sort(
            (a, b) =>
              (a.priority ?? 0) - (b.priority ?? 0) ||
              a.ruleKey.localeCompare(b.ruleKey),
          ),
          actions: this.sortByTitle(data.actions),
          levelFlows: {
            process: { ports: [], links: [] },
            'sub-process': { ports: [], links: [] },
            stage: { ports: [], links: [] },
            scenario: { ports: [], links: [] },
            action: { ports: [], links: [] },
          },
        };

        if (!this.selectedProcessId && this.data.processes.length === 1) {
          this.selectedProcessId = this.data.processes[0].id;
        }

        this.normalizeFilters();
        this.generate();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.message ?? 'خطا در خواندن داده‌ها از API';
        this.isLoading = false;
      },
    });
  }

  generate(): void {
    if (this.mode === 'state-action-activity') {
      this.mermaid = this.buildActionStateActivityMermaid();
      return;
    }

    const processId =
      this.selectedProcessId === ''
        ? undefined
        : Number(this.selectedProcessId);
    const processIds = this.getProcessIds(processId);
    const lines: string[] = [
      'flowchart TB',
      '  %% Generated by Modeler Mermaid Export',
    ];

    if (this.mode === 'structure' || this.mode === 'full') {
      this.appendStructure(lines, processIds);
    }

    if (this.mode === 'routing' || this.mode === 'full') {
      if (lines.length > 2) lines.push('');
      this.appendRouting(lines, processIds);
    }

    if (lines.length <= 2)
      lines.push('  Empty["داده‌ای برای تولید نمودار پیدا نشد"]');
    this.mermaid = lines.join('\n');
  }

  onProcessChange(value: string): void {
    this.selectedProcessId = value ? Number(value) : '';
    this.selectedSubProcessId = '';
    this.selectedStageId = '';
    this.selectedScenarioId = '';
    this.selectedActionId = '';
    this.generate();
  }

  onSubProcessChange(value: string): void {
    this.selectedSubProcessId = value ? Number(value) : '';
    this.selectedStageId = '';
    this.selectedScenarioId = '';
    this.selectedActionId = '';
    this.generate();
  }

  onStageChange(value: string): void {
    this.selectedStageId = value ? Number(value) : '';
    this.selectedScenarioId = '';
    this.selectedActionId = '';
    this.generate();
  }

  onScenarioChange(value: string): void {
    this.selectedScenarioId = value ? Number(value) : '';
    this.selectedActionId = '';
    this.generate();
  }

  onActionChange(value: string): void {
    this.selectedActionId = value ? Number(value) : '';
    this.generate();
  }

  onModeChange(value: string): void {
    this.mode = (value as MermaidMode) || 'state-action-activity';
    this.normalizeFilters();
    this.generate();
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.mermaid);
      this.toast.success('Mermaid کپی شد');
    } catch {
      this.toast.error('کپی خودکار انجام نشد؛ متن را دستی کپی کن');
    }
  }

  download(): void {
    const blob = new Blob([this.mermaid], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modeler-level-flow.mmd';
    a.click();
    URL.revokeObjectURL(url);
  }

  get filteredSubProcesses(): SubProcess[] {
    if (this.selectedProcessId === '') return this.data.subProcesses;
    return this.data.subProcesses.filter(
      (sp) => sp.processId === Number(this.selectedProcessId),
    );
  }

  get filteredStages(): Stage[] {
    let stages = this.data.stages;
    if (this.selectedProcessId !== '') {
      stages = stages.filter(
        (st) => st.processId === Number(this.selectedProcessId),
      );
    }
    if (this.selectedSubProcessId !== '') {
      stages = stages.filter(
        (st) => st.subProcessId === Number(this.selectedSubProcessId),
      );
    }
    return stages;
  }

  get filteredScenarios(): Scenario[] {
    let scenarios = this.data.scenarios;
    const stageIds = new Set(this.filteredStages.map((st) => st.id));

    if (this.selectedProcessId !== '' || this.selectedSubProcessId !== '') {
      scenarios = scenarios.filter((sc) => stageIds.has(sc.stageId));
    }
    if (this.selectedStageId !== '') {
      scenarios = scenarios.filter(
        (sc) => sc.stageId === Number(this.selectedStageId),
      );
    }
    return this.sortByTitle(scenarios);
  }

  get filteredActions(): ActionDefinition[] {
    if (this.selectedActionId !== '') {
      return this.data.actions.filter(
        (a) => a.id === Number(this.selectedActionId),
      );
    }

    const actionIds = new Set<number>();

    const addScenarioActions = (scenario: Scenario) => {
      for (const action of scenario.actions ?? []) {
        if (action.actionId != null) actionIds.add(Number(action.actionId));
      }

      const decisions = this.data.decisions.filter(
        (d) => d.scenarioId === scenario.id,
      );
      const decisionIds = new Set(decisions.map((d) => d.id));
      const options = this.data.options.filter((o) =>
        decisionIds.has(o.scenarioDecisionId),
      );
      for (const option of options) {
        for (const actionId of this.parseIdsJson(option.actionIdsJson)) {
          actionIds.add(actionId);
        }
      }
    };

    if (this.selectedScenarioId !== '') {
      const scenario = this.data.scenarios.find(
        (sc) => sc.id === Number(this.selectedScenarioId),
      );
      if (scenario) addScenarioActions(scenario);
      return this.data.actions.filter((a) => actionIds.has(a.id));
    }

    const scenarios = this.filteredScenarios;
    for (const scenario of scenarios) addScenarioActions(scenario);

    // Include actions that are explicitly part of ActionFlowLink scopes for the selected Stage/Scenario.
    const actionPorts = this.data.levelFlows.action.ports;
    const actionLinks = this.data.levelFlows.action.links as ActionFlowLink[];
    const linkedPortIds = new Set<number>();
    for (const link of actionLinks) {
      const scopeType = String(link.scopeType ?? '').toLowerCase();
      const scopeId = Number(link.scopeId);
      if (
        this.selectedScenarioId !== '' &&
        scopeType === 'scenario' &&
        scopeId === Number(this.selectedScenarioId)
      ) {
        linkedPortIds.add(link.fromPortId);
        linkedPortIds.add(link.toPortId);
      }
      if (
        this.selectedStageId !== '' &&
        scopeType === 'stage' &&
        scopeId === Number(this.selectedStageId)
      ) {
        linkedPortIds.add(link.fromPortId);
        linkedPortIds.add(link.toPortId);
      }
    }
    for (const port of actionPorts) {
      if (linkedPortIds.has(port.id)) {
        const actionId = this.getPortOwnerId('action', port);
        if (actionId != null) actionIds.add(actionId);
      }
    }

    if (
      actionIds.size === 0 &&
      this.selectedStageId === '' &&
      this.selectedScenarioId === ''
    ) {
      return this.data.actions;
    }

    return this.data.actions.filter((a) => actionIds.has(a.id));
  }

  get showProcessFilter(): boolean {
    return true;
  }

  get showSubProcessFilter(): boolean {
    return this.mode === 'state-action-activity';
  }

  get showStageFilter(): boolean {
    return this.mode === 'state-action-activity';
  }

  get showScenarioFilter(): boolean {
    return this.mode === 'state-action-activity';
  }

  get showActionFilter(): boolean {
    return this.mode === 'state-action-activity';
  }


  private buildActionStateActivityMermaid(): string {
    const selectedScenarios = this.getSelectedActionFlowScenarios();
    const scenarioIds = new Set(selectedScenarios.map((s) => s.id));

    const transitions = this.data.actionStateTransitions.filter((t) =>
      t.scenarioId == null || scenarioIds.has(t.scenarioId),
    );

    const lines: string[] = [
      'flowchart TB',
      '  %% Generated by Modeler State-based Activity Export: Action',
      '  %% UML-like notation: Scenario container, State -> Action -> State, Decision diamond',
      '  classDef actionNode fill:#FFFFFF,stroke:#555,stroke-width:1px;',
      '  classDef decisionNode fill:#FFF7E6,stroke:#D48806,stroke-width:2px;',
      '  classDef stateNode fill:#E8F1FF,stroke:#2F6FDB,stroke-width:2px;',
      '  classDef claimedState fill:#E8F1FF,stroke:#2F6FDB,stroke-width:2px;',
      '  classDef readyState fill:#FFF7E6,stroke:#D48806,stroke-width:2px;',
      '  classDef approvedState fill:#E6FFED,stroke:#2E7D32,stroke-width:2px;',
      '  classDef canceledState fill:#FFECEC,stroke:#C62828,stroke-width:2px;',
      '  classDef releasedState fill:#F5F5F5,stroke:#666,stroke-width:2px;',
    ];

    const globalEmitted = new Set(lines);
    const emitGlobal = (line: string) => {
      if (!line.trim() || globalEmitted.has(line)) return;
      globalEmitted.add(line);
      lines.push(line);
    };

    for (const scenario of this.sortByTitle(selectedScenarios)) {
      const scenarioTransitions = transitions.filter((t) => t.scenarioId === scenario.id);
      const scenarioLines: string[] = [];
      const emitted = new Set<string>();
      const emit = (line: string) => {
        if (!line.trim() || emitted.has(line)) return;
        emitted.add(line);
        scenarioLines.push(line);
      };

      for (const t of scenarioTransitions) {
        // Decision option transitions are rendered from the Decision node below.
        // Rendering them here too creates a wrong direct edge:
        // State -> Action, alongside Decision -> Action.
        if (t.decisionOptionId != null) {
          continue;
        }

        const actionNode = this.ownerNodeId('action', t.actionId);
        const actionVisible = this.selectedActionId === '' || t.actionId === Number(this.selectedActionId);

        if (t.fromStateId) {
          const state = this.stateById(t.fromStateId);
          if (state) {
            this.emitEntityStateNode(emit, state);
            if (actionVisible) {
              emit(`    ${this.entityStateNodeId(state.id)} --> ${actionNode}`);
            }
          }
        }

        if (actionVisible) {
          emit(`    ${actionNode}(["${this.escape(this.ownerLabel('action', t.actionId))}"]):::actionNode`);
        }

        if (t.toStateId && actionVisible) {
          const state = this.stateById(t.toStateId);
          if (state) {
            this.emitEntityStateNode(emit, state);
            emit(`    ${actionNode} --> ${this.entityStateNodeId(state.id)}`);
          }
        }
      }

      const decisions = this.sortByTitle(this.data.decisions.filter((d) => d.scenarioId === scenario.id));
      for (const decision of decisions) {
        const decisionNode = this.decisionNodeId(decision.id);
        emit(`    ${decisionNode}{"${this.escape(this.typedLabel('Decision', decision.decisionKey, decision.titleFa))}"}:::decisionNode`);

        const sourceTransitions = scenarioTransitions.filter((t) => t.decisionId === decision.id && t.decisionOptionId == null && t.toStateId);
        for (const t of sourceTransitions) {
          const state = t.toStateId ? this.stateById(t.toStateId) : null;
          if (state) {
            this.emitEntityStateNode(emit, state);
            emit(`    ${this.entityStateNodeId(state.id)} --> ${decisionNode}`);
          }
        }

        const options = this.sortByTitle(this.data.options.filter((o) => o.scenarioDecisionId === decision.id));
        for (const option of options) {
          const optionTransitions = scenarioTransitions.filter((t) => t.decisionOptionId === option.id);
          const optionEdgeLabel = this.escapeEdgeLabel(`${option.optionKey}<br/>${option.titleFa ?? ''}`);
          for (const t of optionTransitions) {
            if (this.selectedActionId !== '' && t.actionId !== Number(this.selectedActionId)) continue;
            const actionNode = this.ownerNodeId('action', t.actionId);
            emit(`    ${actionNode}(["${this.escape(this.ownerLabel('action', t.actionId))}"]):::actionNode`);
            emit(`    ${decisionNode} -->|"${optionEdgeLabel}"| ${actionNode}`);
            if (t.toStateId) {
              const state = this.stateById(t.toStateId);
              if (state) {
                this.emitEntityStateNode(emit, state);
                emit(`    ${actionNode} --> ${this.entityStateNodeId(state.id)}`);
              }
            }
          }
        }
      }

      if (scenarioLines.length > 0) {
        emitGlobal(`  subgraph ${this.scenarioSubgraphId(scenario.id)}["${this.escape(this.typedLabel('Scenario', scenario.scenarioKey, scenario.titleFa))}"]`);
        emitGlobal('    direction TB');
        for (const line of scenarioLines) emitGlobal(line);
        emitGlobal('  end');
      }
    }

    if (lines.length <= 11) {
      lines.push('  Empty["برای این سطح و فیلتر انتخاب‌شده State/Action قابل نمایش پیدا نشد"]');
    }

    return lines.join('\n');
  }

  private emitEntityStateNode(emit: (line: string) => void, state: EntityState): void {
    const nodeId = this.entityStateNodeId(state.id);
    emit(`    ${nodeId}["${this.escape(this.typedLabel('State', state.stateKey, state.titleFa))}"]:::${this.stateClassFromEntityState(state)}`);
    const tooltip = this.entityStateConditionsTooltip(state);
    if (tooltip) emit(`    click ${nodeId} "#" "${this.escapeTooltip(tooltip)}"`);
  }

  private stateById(id: number): EntityState | undefined {
    return this.data.states.find((s) => s.id === id);
  }

  private entityStateNodeId(id: number): string {
    return `STATE_${id}`;
  }

  private entityStateConditionsTooltip(state: EntityState): string | null {
    const text = this.conditionJsonTooltip(state.conditionJson);
    return text ? `State Conditions | ${text}` : null;
  }

  private conditionJsonTooltip(conditionJson: string | null | undefined): string | null {
    if (!conditionJson || conditionJson === '[]') return null;
    try {
      const rows = JSON.parse(conditionJson);
      if (!Array.isArray(rows) || rows.length === 0) return null;
      return rows.map((x: any) => `${x.factKey ?? this.factKeyById(x.factId)} ${x.op ?? '='} ${this.formatConditionValue(x.value)}`).join(' | ');
    } catch {
      return conditionJson;
    }
  }

  private stateClassFromEntityState(state: EntityState): string {
    const key = `${state.stateKey ?? ''} ${state.titleFa ?? ''}`.toLowerCase();
    if (key.includes('approved') || key.includes('taeid') || key.includes('تایید')) return 'approvedState';
    if (key.includes('canceled') || key.includes('ebtal') || key.includes('ابطال')) return 'canceledState';
    if (key.includes('released') || key.includes('release') || key.includes('آزاد') || key.includes('انصراف')) return 'releasedState';
    if (key.includes('ready') || key.includes('آماده')) return 'readyState';
    if (key.includes('claimed') || key.includes('پذیرش')) return 'claimedState';
    return 'stateNode';
  }

  private buildActionLevelMermaid(): string {
    const decisionRelatedActionIds = this.getDecisionRelatedActionIdsForSelectedScope();
    const rawMermaid = this.buildRawActionLevelMermaid(decisionRelatedActionIds);
    const decisionMermaid = this.buildDecisionAwareActionMermaid();

    const rawBody = this.mermaidBody(rawMermaid);
    const decisionBody = this.mermaidBody(decisionMermaid);

    const lines: string[] = [
      'flowchart TB',
      '  %% Generated by Modeler Level Flow Export: action',
      '  %% Mixed output: normal ActionFlow + Decision-aware ActionFlow',
      '  classDef inPortNode stroke-dasharray: 5 5;',
      '  classDef outPortNode stroke-width: 3px;',
    ];

    const emitted = new Set(lines);
    const emit = (line: string) => {
      if (!line.trim()) return;
      if (emitted.has(line)) return;
      emitted.add(line);
      lines.push(line);
    };

    for (const line of rawBody) emit(line);
    for (const line of decisionBody) emit(line);

    if (lines.length <= 5) {
      lines.push(
        '  Empty["برای این سطح و فیلتر انتخاب‌شده Action/Decision قابل نمایش پیدا نشد"]',
      );
    }

    return lines.join('\n');
  }

  private buildDecisionAwareActionMermaid(): string | null {
    const selectedScenarios = this.getSelectedActionFlowScenarios();
    if (selectedScenarios.length === 0) return null;

    const scenarioIds = new Set(selectedScenarios.map((s) => s.id));
    const decisions = this.sortByTitle(
      this.data.decisions.filter((d) => scenarioIds.has(d.scenarioId)),
    );
    if (decisions.length === 0) return null;

    const decisionIds = new Set(decisions.map((d) => d.id));
    let options = this.sortByTitle(
      this.data.options.filter((o) => decisionIds.has(o.scenarioDecisionId)),
    );

    if (this.selectedActionId !== '') {
      const selectedActionId = Number(this.selectedActionId);
      options = options.filter((o) =>
        this.parseIdsJson(o.actionIdsJson).includes(selectedActionId),
      );
    }

    const optionDecisionIds = new Set(options.map((o) => o.scenarioDecisionId));
    const filteredDecisions = decisions.filter((d) => optionDecisionIds.has(d.id));

    if (filteredDecisions.length === 0 || options.length === 0) return null;

    return this.buildDecisionAwareActionMermaidForData(
      selectedScenarios,
      filteredDecisions,
      options,
    );
  }

  private buildDecisionAwareActionMermaidForData(
    scenarios: Scenario[],
    decisions: ScenarioDecision[],
    options: ScenarioDecisionOption[],
  ): string {
    const level: FlowLevel = 'action';
    const lines: string[] = [
      'flowchart TB',
      '  %% Generated by Modeler Level Flow Export: action',
      '  %% Decision-aware output: Scenario as container, then Action -> Port -> Decision -> Option edge -> Action -> Port',
      '  %% FactChanges are attached as tooltips on Action OutPorts',
      '  classDef inPortNode stroke-dasharray: 5 5;',
      '  classDef outPortNode stroke-width: 3px;',
    ];

    const decisionsByScenarioId = this.groupBy(decisions, (d) => d.scenarioId);
    const optionsByDecisionId = this.groupBy(options, (o) => o.scenarioDecisionId);
    const optionIds = new Set(options.map((o) => o.id));
    const factChangesByOptionId = this.groupBy(
      this.data.optionFactChanges.filter((fc) => optionIds.has(fc.scenarioDecisionOptionId)),
      (fc) => fc.scenarioDecisionOptionId,
    );

    const allActionPorts = this.sortPorts(
      this.filterLevelPorts(level, this.data.levelFlows.action.ports),
    );
    const portsByActionId = this.groupBy(
      allActionPorts,
      (p) => this.getPortOwnerId(level, p) ?? 0,
    );

    for (const scenario of this.sortByTitle(scenarios)) {
      const scenarioDecisions = decisionsByScenarioId.get(scenario.id) ?? [];
      if (scenarioDecisions.length === 0) continue;

      const scenarioLines: string[] = [];
      const emitted = new Set<string>();
      const emit = (line: string) => {
        if (emitted.has(line)) return;
        emitted.add(line);
        scenarioLines.push(line);
      };

      for (const decision of this.sortByTitle(scenarioDecisions)) {
        const decisionNode = this.decisionNodeId(decision.id);
        emit(
          `    ${decisionNode}{"${this.escape(this.typedLabel('Decision', decision.decisionKey, decision.titleFa))}"}`,
        );

        const decisionOptions = optionsByDecisionId.get(decision.id) ?? [];
        const decisionOptionActionIds = new Set<number>();
        for (const option of decisionOptions) {
          for (const actionId of this.parseIdsJson(option.actionIdsJson)) {
            decisionOptionActionIds.add(actionId);
          }
        }

        const sourceActionIds = this.getDecisionSourceActionIdsForScenario(
          scenario,
          decisionOptionActionIds,
        );

        for (const sourceActionId of sourceActionIds) {
          const sourceActionNode = this.ownerNodeId(level, sourceActionId);
          const sourcePorts = this.sortPorts(portsByActionId.get(sourceActionId) ?? []);

          emit(
            `    ${sourceActionNode}["${this.escape(this.ownerLabel(level, sourceActionId))}"]`,
          );

          for (const port of sourcePorts) {
            const portNode = this.portNodeId(level, port.id);
            emit(this.indentMermaidLine(this.buildPortNodeLine(portNode, port), 2));
            emit(this.indentMermaidLine(this.buildPortClassLine(portNode, port), 2));
            const conditionTooltip = this.portConditionsTooltip(port);
            if (conditionTooltip) {
              emit(`    click ${portNode} "#" "${this.escapeTooltip(conditionTooltip)}"`);
            }
            emit(this.indentMermaidLine(this.buildOwnerPortEdgeLine(sourceActionNode, portNode, port), 2));
          }

          const sourceOutPorts = sourcePorts.filter((port) => this.isOutPort(port));
          for (const sourceOutPort of sourceOutPorts) {
            const sourcePortNode = this.portNodeId(level, sourceOutPort.id);
            emit(`    ${sourcePortNode} --> ${decisionNode}`);
          }
        }

        if (sourceActionIds.length === 0) {
          emit(`    DECISION_ENTRY_${decision.id}(("${this.escape('Decision Entry')}")). --> ${decisionNode}`);
        }

        for (const option of this.sortByTitle(decisionOptions)) {
          const optionFactChanges = factChangesByOptionId.get(option.id) ?? [];
          const factChangeTooltip = optionFactChanges.length > 0
            ? this.factChangesTooltip(optionFactChanges)
            : null;

          const optionEdgeLabel = this.escapeEdgeLabel(
            `${option.optionKey}<br/>${option.titleFa ?? ''}`,
          );

          for (const actionId of this.parseIdsJson(option.actionIdsJson)) {
            if (this.selectedActionId !== '' && actionId !== Number(this.selectedActionId)) continue;

            const actionNode = this.ownerNodeId(level, actionId);
            emit(
              `    ${actionNode}["${this.escape(this.ownerLabel(level, actionId))}"]`,
            );
            emit(`    ${decisionNode} -->|"${optionEdgeLabel}"| ${actionNode}`);

            const sortedPorts = this.sortPorts(portsByActionId.get(actionId) ?? [])
              .filter((port) => this.isOutPort(port));

            for (const port of sortedPorts) {
              const portNode = this.portNodeId(level, port.id);
              emit(this.indentMermaidLine(this.buildPortNodeLine(portNode, port), 2));
              emit(this.indentMermaidLine(this.buildPortClassLine(portNode, port), 2));
              const conditionTooltip = this.portConditionsTooltip(port);
              if (conditionTooltip) {
                emit(`    click ${portNode} "#" "${this.escapeTooltip(conditionTooltip)}"`);
              }
              emit(this.indentMermaidLine(this.buildOwnerPortEdgeLine(actionNode, portNode, port), 2));
            }

            if (factChangeTooltip) {
              const tooltipTargetPorts = this.getFactChangeTooltipTargetPorts(sortedPorts);
              for (const port of tooltipTargetPorts) {
                emit(
                  `    click ${this.portNodeId(level, port.id)} "#" "${this.escapeTooltip(factChangeTooltip)}"`,
                );
              }
            }
          }
        }
      }

      if (scenarioLines.length > 0) {
        lines.push(
          `  subgraph ${this.scenarioSubgraphId(scenario.id)}["${this.escape(this.typedLabel('Scenario', scenario.scenarioKey, scenario.titleFa))}"]`,
        );
        lines.push('    direction TB');
        lines.push(...scenarioLines);
        lines.push('  end');
      }
    }

    if (lines.length <= 6) {
      lines.push(
        '  Empty["برای این سناریو Decision/Option قابل نمایش پیدا نشد"]',
      );
    }

    return lines.join('\n');
  }

  private buildRawActionLevelMermaid(
    excludedActionIds: Set<number> = new Set<number>(),
  ): string {
    const level: FlowLevel = 'action';
    const flow = this.data.levelFlows.action;
    let ports = this.filterLevelPorts('action', flow.ports);
    let links = this.filterLevelLinks('action', flow.links, ports);

    if (excludedActionIds.size > 0) {
      ports = ports.filter((port) => {
        const actionId = this.getPortOwnerId('action', port);
        return actionId == null || !excludedActionIds.has(actionId);
      });
    }

    const portIds = new Set(ports.map((p) => p.id));
    links = links.filter(
      (l) => portIds.has(l.fromPortId) && portIds.has(l.toPortId),
    );

    const lines: string[] = [
      'flowchart TB',
      '  %% Generated by Modeler Level Flow Export: action',
      '  classDef inPortNode stroke-dasharray: 5 5;',
      '  classDef outPortNode stroke-width: 3px;',
    ];
    const emitted = new Set<string>();
    const emit = (line: string) => {
      if (emitted.has(line)) return;
      emitted.add(line);
      lines.push(line);
    };

    const portsByActionId = new Map<number, LevelFlowPort[]>();
    for (const port of ports) {
      const actionId = this.getPortOwnerId('action', port);
      if (actionId == null) continue;
      if (!portsByActionId.has(actionId)) portsByActionId.set(actionId, []);
      portsByActionId.get(actionId)!.push(port);
    }

    for (const [actionId, actionPorts] of portsByActionId.entries()) {
      const actionNode = this.ownerNodeId(level, actionId);
      emit(
        `  ${actionNode}["${this.escape(this.ownerLabel(level, actionId))}"]`,
      );

      const sortedPorts = this.sortPorts(actionPorts);
      for (const port of sortedPorts) {
        const portNode = this.portNodeId(level, port.id);
        emit(this.buildPortNodeLine(portNode, port));
        emit(this.buildPortClassLine(portNode, port));
        const conditionTooltip = this.portConditionsTooltip(port);
        if (conditionTooltip) {
          emit(`  click ${portNode} "#" "${this.escapeTooltip(conditionTooltip)}"`);
        }

        emit(this.buildOwnerPortEdgeLine(actionNode, portNode, port));
      }
    }

    for (const link of links) {
      const from = this.portNodeId(level, link.fromPortId);
      const to = this.portNodeId(level, link.toPortId);
      emit(this.buildFlowPortLinkLine(from, to, link.labelFa));
    }

    if (lines.length <= 2) {
      lines.push(
        '  Empty["برای این سطح و فیلتر انتخاب‌شده Port/Link پیدا نشد"]',
      );
    }

    return lines.join('\n');
  }

  private buildLevelFlowMermaid(level: FlowLevel): string {
    const flow = this.data.levelFlows[level];
    let ports = this.filterLevelPorts(level, flow.ports);
    let links = this.filterLevelLinks(level, flow.links, ports);

    const portIds = new Set(ports.map((p) => p.id));
    links = links.filter(
      (l) => portIds.has(l.fromPortId) && portIds.has(l.toPortId),
    );

    const lines: string[] = [
      'flowchart TB',
      `  %% Generated by Modeler Level Flow Export: ${level}`,
      '  classDef inPortNode stroke-dasharray: 5 5;',
      '  classDef outPortNode stroke-width: 3px;',
    ];
    const emitted = new Set<string>();
    const emit = (line: string) => {
      if (emitted.has(line)) return;
      emitted.add(line);
      lines.push(line);
    };

    const ownerIds = new Set(
      ports
        .map((p) => this.getPortOwnerId(level, p))
        .filter((x): x is number => x != null),
    );
    for (const ownerId of ownerIds) {
      emit(
        `  ${this.ownerNodeId(level, ownerId)}["${this.escape(this.ownerLabel(level, ownerId))}"]`,
      );
    }

    for (const port of ports) {
      const ownerId = this.getPortOwnerId(level, port);
      const portNode = this.portNodeId(level, port.id);
      emit(this.buildPortNodeLine(portNode, port));
      emit(this.buildPortClassLine(portNode, port));
      const conditionTooltip = this.portConditionsTooltip(port);
      if (conditionTooltip) {
        emit(`  click ${portNode} "#" "${this.escapeTooltip(conditionTooltip)}"`);
      }

      if (ownerId != null) {
        const ownerNode = this.ownerNodeId(level, ownerId);
        emit(this.buildOwnerPortEdgeLine(ownerNode, portNode, port));
      }
    }

    for (const link of links) {
      const from = this.portNodeId(level, link.fromPortId);
      const to = this.portNodeId(level, link.toPortId);
      emit(this.buildFlowPortLinkLine(from, to, link.labelFa));
    }

    if (lines.length <= 2) {
      lines.push(
        '  Empty["برای این سطح و فیلتر انتخاب‌شده Port/Link پیدا نشد"]',
      );
    }

    return lines.join('\n');
  }

  private filterLevelPorts(
    level: FlowLevel,
    ports: LevelFlowPort[],
  ): LevelFlowPort[] {
    if (level === 'process') {
      if (this.selectedProcessId === '') return ports;
      return ports.filter(
        (p) => this.getPortOwnerId(level, p) === Number(this.selectedProcessId),
      );
    }

    if (level === 'sub-process') {
      if (this.selectedSubProcessId !== '') {
        return ports.filter(
          (p) =>
            this.getPortOwnerId(level, p) === Number(this.selectedSubProcessId),
        );
      }
      const ids = new Set(this.filteredSubProcesses.map((sp) => sp.id));
      return ports.filter((p) => {
        const ownerId = this.getPortOwnerId(level, p);
        return ownerId != null && ids.has(ownerId);
      });
    }

    if (level === 'stage') {
      if (this.selectedStageId !== '') {
        return ports.filter(
          (p) => this.getPortOwnerId(level, p) === Number(this.selectedStageId),
        );
      }
      const ids = new Set(this.filteredStages.map((st) => st.id));
      return ports.filter((p) => {
        const ownerId = this.getPortOwnerId(level, p);
        return ownerId != null && ids.has(ownerId);
      });
    }

    if (level === 'scenario') {
      if (this.selectedScenarioId !== '') {
        return ports.filter(
          (p) =>
            this.getPortOwnerId(level, p) === Number(this.selectedScenarioId),
        );
      }
      const ids = new Set(this.filteredScenarios.map((sc) => sc.id));
      return ports.filter((p) => {
        const ownerId = this.getPortOwnerId(level, p);
        return ownerId != null && ids.has(ownerId);
      });
    }

    if (level === 'action') {
      const actionIds = new Set(this.filteredActions.map((a) => a.id));
      return ports.filter((p) => {
        const ownerId = this.getPortOwnerId(level, p);
        return ownerId != null && actionIds.has(ownerId);
      });
    }

    return ports;
  }

  private filterLevelLinks(
    level: FlowLevel,
    links: Array<LevelFlowLink | ActionFlowLink>,
    ports: LevelFlowPort[],
  ): Array<LevelFlowLink | ActionFlowLink> {
    if (level !== 'action') {
      const portIds = new Set(ports.map((p) => p.id));
      return links.filter(
        (link) => portIds.has(link.fromPortId) && portIds.has(link.toPortId),
      );
    }

    const actionLinks = links as ActionFlowLink[];

    if (this.selectedScenarioId !== '') {
      return actionLinks.filter(
        (link) =>
          String(link.scopeType ?? '').toLowerCase() === 'scenario' &&
          Number(link.scopeId) === Number(this.selectedScenarioId),
      );
    }

    if (this.selectedStageId !== '') {
      return actionLinks.filter(
        (link) =>
          String(link.scopeType ?? '').toLowerCase() === 'stage' &&
          Number(link.scopeId) === Number(this.selectedStageId),
      );
    }

    if (this.selectedActionId !== '') {
      const portIds = new Set(ports.map((p) => p.id));
      return actionLinks.filter(
        (link) => portIds.has(link.fromPortId) || portIds.has(link.toPortId),
      );
    }

    return actionLinks;
  }

  private normalizeFilters(): void {
    if (
      this.selectedProcessId !== '' &&
      !this.data.processes.some((p) => p.id === Number(this.selectedProcessId))
    ) {
      this.selectedProcessId = '';
    }
    if (
      this.selectedSubProcessId !== '' &&
      !this.filteredSubProcesses.some(
        (sp) => sp.id === Number(this.selectedSubProcessId),
      )
    ) {
      this.selectedSubProcessId = '';
    }
    if (
      this.selectedStageId !== '' &&
      !this.filteredStages.some((st) => st.id === Number(this.selectedStageId))
    ) {
      this.selectedStageId = '';
    }
    if (
      this.selectedScenarioId !== '' &&
      !this.filteredScenarios.some(
        (sc) => sc.id === Number(this.selectedScenarioId),
      )
    ) {
      this.selectedScenarioId = '';
    }
    if (
      this.selectedActionId !== '' &&
      !this.data.actions.some((a) => a.id === Number(this.selectedActionId))
    ) {
      this.selectedActionId = '';
    }
  }

  private getSelectedActionFlowScenarios(): Scenario[] {
    if (this.selectedScenarioId !== '') {
      const scenario = this.data.scenarios.find(
        (sc) => sc.id === Number(this.selectedScenarioId),
      );
      return scenario ? [scenario] : [];
    }

    if (
      this.selectedProcessId !== '' ||
      this.selectedSubProcessId !== '' ||
      this.selectedStageId !== ''
    ) {
      return this.filteredScenarios;
    }

    return this.data.scenarios;
  }

  private scenarioNodeId(scenarioId: number): string {
    return `SC_${scenarioId}`;
  }

  private decisionNodeId(decisionId: number): string {
    return `DEC_${decisionId}`;
  }

  private optionNodeId(optionId: number): string {
    return `OPT_${optionId}`;
  }

  private portConditionsTooltip(port: LevelFlowPort): string | null {
    const raw = (port as any).conditionJson;
    if (!raw || raw === '[]') return null;

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return null;

      const labels = parsed.map((item: any) => this.portConditionLabel(item));
      return ['Port Conditions', ...labels].join(' | ');
    } catch {
      return `Port Conditions | ${raw}`;
    }
  }

  private portConditionLabel(item: any): string {
    const fact = this.data.facts.find(
      (x) => x.id === Number(item.factId) || x.factKey === String(item.factKey ?? ''),
    );
    const factKey = fact?.factKey ?? item.factKey ?? `Fact#${item.factId}`;
    const op = item.op ?? item.operator ?? '=';
    const value = this.formatConditionValue(item.value);
    return `${factKey} ${op}${value !== '' ? ' ' + value : ''}`;
  }


  private factKeyById(id: any): string {
    const fact = this.data.facts.find((x) => x.id === Number(id));
    return fact?.factKey ?? `Fact#${id}`;
  }

  private formatConditionValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return `[${value.join(', ')}]`;
    return String(value);
  }

  private factChangeLabel(factChange: DecisionOptionFactChange): string {
    const fact = this.data.facts.find((x) => x.id === factChange.factId);
    const factKey = fact?.factKey ?? `Fact#${factChange.factId}`;
    const value = factChange.value != null && factChange.value !== ''
      ? ` = ${factChange.value}`
      : '';
    return this.typedLabel('FactChange', `${factKey} ${factChange.op}${value}`);
  }

  private factChangesTooltip(factChanges: DecisionOptionFactChange[]): string {
    const labels = [...factChanges]
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          a.id - b.id,
      )
      .map((fc) => this.factChangeLabel(fc));

    return ['FactChanges', ...labels].join(' | ');
  }

  private groupBy<T, K>(items: T[], keySelector: (item: T) => K): Map<K, T[]> {
    const result = new Map<K, T[]>();
    for (const item of items) {
      const key = keySelector(item);
      const group = result.get(key) ?? [];
      group.push(item);
      result.set(key, group);
    }
    return result;
  }

  private parseIdsJson(value?: string | null): number[] {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x) && x > 0);
    } catch {
      return [];
    }
  }

  private getDecisionRelatedActionIdsForSelectedScope(): Set<number> {
    const result = new Set<number>();
    const selectedScenarios = this.getSelectedActionFlowScenarios();
    if (selectedScenarios.length === 0) return result;

    const scenarioIds = new Set(selectedScenarios.map((s) => s.id));
    const decisions = this.data.decisions.filter((d) => scenarioIds.has(d.scenarioId));
    if (decisions.length === 0) return result;

    const decisionsByScenarioId = this.groupBy(decisions, (d) => d.scenarioId);
    const decisionIds = new Set(decisions.map((d) => d.id));
    const allOptions = this.data.options.filter((o) => decisionIds.has(o.scenarioDecisionId));

    for (const scenario of selectedScenarios) {
      const scenarioDecisions = decisionsByScenarioId.get(scenario.id) ?? [];
      if (scenarioDecisions.length === 0) continue;

      const scenarioDecisionIds = new Set(scenarioDecisions.map((d) => d.id));
      const scenarioOptions = allOptions.filter((o) => scenarioDecisionIds.has(o.scenarioDecisionId));
      const optionActionIds = new Set<number>();

      for (const option of scenarioOptions) {
        for (const actionId of this.parseIdsJson(option.actionIdsJson)) {
          if (this.selectedActionId === '' || actionId === Number(this.selectedActionId)) {
            result.add(actionId);
          }
          optionActionIds.add(actionId);
        }
      }

      for (const actionId of this.getDecisionSourceActionIdsForScenario(scenario, optionActionIds)) {
        result.add(actionId);
      }
    }

    return result;
  }

  private mermaidBody(mermaid: string | null): string[] {
    if (!mermaid) return [];

    return mermaid
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim();

        if (!trimmed) return false;
        if (trimmed === 'flowchart TB') return false;
        if (trimmed.startsWith('%% Generated by Modeler')) return false;
        if (trimmed.startsWith('%% Decision-aware output')) return false;
        if (trimmed.startsWith('%% FactChanges are attached')) return false;
        if (trimmed.startsWith('classDef ')) return false;
        if (trimmed.startsWith('Empty[')) return false;
        if (trimmed.includes('Empty["')) return false;

        return true;
      });
  }

  private buildPortNodeLine(nodeId: string, port: LevelFlowPort): string {
    const label = this.escape(this.portLabel(port));

    return `  ${nodeId}["${label}"]`;
  }

  private buildPortClassLine(nodeId: string, port: LevelFlowPort): string {
    if (this.isOutPort(port)) {
      return `  class ${nodeId} outPortNode`;
    }

    return `  class ${nodeId} inPortNode`;
  }

  private buildOwnerPortEdgeLine(
    ownerNodeId: string,
    portNodeId: string,
    port: LevelFlowPort,
  ): string {
    if (this.isOutPort(port)) {
      return `  ${ownerNodeId} -.-> ${portNodeId}`;
    }

    return `  ${portNodeId} -.-> ${ownerNodeId}`;
  }

  private buildFlowPortLinkLine(
    fromNodeId: string,
    toNodeId: string,
    label?: string | null,
  ): string {
    if (label?.trim()) {
      return `  ${fromNodeId} ==>|"${this.escapeEdgeLabel(label)}"| ${toNodeId}`;
    }

    return `  ${fromNodeId} ==> ${toNodeId}`;
  }

  private escapeEdgeLabel(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '&quot;')
      .replace(/\r?\n/g, ' / ')
      .replace(/<br\s*\/?>(?![^<]*>)/gi, ' / ')
      .replace(/\|/g, '/');
  }

  private getFactChangeTooltipTargetPorts(ports: LevelFlowPort[]): LevelFlowPort[] {
    const outPorts = ports.filter((port) => this.isOutPort(port));
    if (outPorts.length > 0) return outPorts;

    return ports.filter((port) => !this.isOutPort(port));
  }

  private getDecisionSourceActionIdsForScenario(
    scenario: Scenario,
    decisionOptionActionIds: Set<number>,
  ): number[] {
    const scenarioActionIds: number[] = [];
    const seen = new Set<number>();

    for (const action of scenario.actions ?? []) {
      if (action.actionId == null) continue;
      const actionId = Number(action.actionId);
      if (decisionOptionActionIds.has(actionId)) continue;
      if (seen.has(actionId)) continue;

      seen.add(actionId);
      scenarioActionIds.push(actionId);
    }

    return scenarioActionIds.sort((a, b) => a - b);
  }

  private scenarioSubgraphId(scenarioId: number): string {
    return `SG_SC_${scenarioId}`;
  }

  private indentMermaidLine(line: string, spaces: number): string {
    const normalized = line.replace(/^\s+/, '');
    return `${' '.repeat(spaces)}${normalized}`;
  }

  private getPortOwnerId(level: FlowLevel, port: any): number | null {
    if (typeof port.ownerId === 'number') return port.ownerId;
    if (level === 'process')
      return typeof port.processId === 'number' ? port.processId : null;
    if (level === 'sub-process')
      return typeof port.subProcessId === 'number' ? port.subProcessId : null;
    if (level === 'stage')
      return typeof port.stageId === 'number' ? port.stageId : null;
    if (level === 'scenario')
      return typeof port.scenarioId === 'number' ? port.scenarioId : null;
    if (level === 'action')
      return typeof port.actionId === 'number' ? port.actionId : null;
    return null;
  }

  private ownerLabel(level: FlowLevel, ownerId: number): string {
    if (level === 'process') {
      const item = this.data.processes.find((x) => x.id === ownerId);
      return this.typedLabel(
        'Process',
        item?.processKey ?? `#${ownerId}`,
        item?.titleFa,
      );
    }
    if (level === 'sub-process') {
      const item = this.data.subProcesses.find((x) => x.id === ownerId);
      return this.typedLabel(
        'SubProcess',
        item?.subProcessKey ?? `#${ownerId}`,
        item?.titleFa,
      );
    }
    if (level === 'stage') {
      const item = this.data.stages.find((x) => x.id === ownerId);
      return this.typedLabel(
        'Stage',
        item?.stageKey ?? `#${ownerId}`,
        item?.titleFa,
      );
    }
    if (level === 'scenario') {
      const item = this.data.scenarios.find((x) => x.id === ownerId);
      return this.typedLabel(
        'Scenario',
        item?.scenarioKey ?? `#${ownerId}`,
        item?.titleFa,
      );
    }
    const item = this.data.actions.find((x) => x.id === ownerId);
    return this.typedLabel(
      'Action',
      item?.actionKey ?? `#${ownerId}`,
      item?.titleFa,
    );
  }

  private ownerNodeId(level: FlowLevel, ownerId: number): string {
    return `OWN_${level.replace('-', '_')}_${ownerId}`;
  }

  private portNodeId(level: FlowLevel, portId: number): string {
    return `PORT_${level.replace('-', '_')}_${portId}`;
  }

  private portLabel(port: LevelFlowPort): string {
    const direction = this.isOutPort(port) ? 'Out Port' : 'In Port';
    return this.typedLabel(direction, port.portKey, port.titleFa ?? undefined);
  }

  private isOutPort(port: LevelFlowPort): boolean {
    return String(port.direction ?? '').toLowerCase() === 'out';
  }

  private appendStructure(lines: string[], processIds: Set<number>): void {
    const selectedProcesses = this.data.processes.filter((p) =>
      processIds.has(p.id),
    );
    const selectedSubProcesses = this.data.subProcesses.filter((sp) =>
      processIds.has(sp.processId),
    );
    const selectedSubProcessIds = new Set(
      selectedSubProcesses.map((sp) => sp.id),
    );
    const selectedStages = this.data.stages.filter((st) =>
      processIds.has(st.processId),
    );

    for (const process of selectedProcesses) {
      lines.push(
        `  subgraph P_${process.id}["${this.escape(this.typedLabel('Process', process.processKey, process.titleFa))}"]`,
      );
      lines.push('    direction TB');

      for (const sp of selectedSubProcesses.filter(
        (x) => x.processId === process.id,
      )) {
        lines.push(
          `    subgraph SP_${sp.id}["${this.escape(this.typedLabel('SubProcess', sp.subProcessKey, sp.titleFa))}"]`,
        );
        lines.push('      direction TB');
        for (const st of selectedStages.filter(
          (x) => x.subProcessId === sp.id,
        )) {
          lines.push(
            `      ST_${st.id}["${this.escape(this.typedLabel('Stage', st.stageKey, st.titleFa))}"]`,
          );
        }
        lines.push('    end');
      }

      for (const st of selectedStages.filter(
        (x) => !x.subProcessId || !selectedSubProcessIds.has(x.subProcessId),
      )) {
        lines.push(
          `    ST_${st.id}["${this.escape(this.typedLabel('Stage', st.stageKey, st.titleFa))}"]`,
        );
      }

      lines.push('  end');
    }
  }

  private appendRouting(lines: string[], processIds: Set<number>): void {
    const stageIds = new Set(
      this.data.stages
        .filter((st) => processIds.has(st.processId))
        .map((st) => st.id),
    );
    const kartabls = this.data.kartabls.filter(
      (k) => !k.stageId || stageIds.has(k.stageId),
    );
    const kartablIds = new Set(kartabls.map((k) => k.id));
    const rules = this.data.rules.filter(
      (r) =>
        kartablIds.has(r.targetKartablId) ||
        (r.fromKartablId != null && kartablIds.has(r.fromKartablId)),
    );

    for (const k of kartabls) {
      lines.push(
        `  K_${k.id}["${this.escape(this.typedLabel('Kartabl', k.kartablKey, k.titleFa))}"]`,
      );
    }

    for (const rule of rules) {
      if (rule.fromKartablId == null) continue;
      if (
        !kartablIds.has(rule.fromKartablId) ||
        !kartablIds.has(rule.targetKartablId)
      )
        continue;
      lines.push(
        `  K_${rule.fromKartablId} -->|"${this.escape(rule.titleFa || rule.ruleKey)}"| K_${rule.targetKartablId}`,
      );
    }
  }

  private getProcessIds(processId?: number): Set<number> {
    if (processId) return new Set([processId]);
    return new Set(this.data.processes.map((p) => p.id));
  }

  private typedLabel(type: string, key: string, title?: string | null): string {
    return [type, key, title].filter(Boolean).join('<br/>');
  }

  private escape(value: string | null | undefined): string {
    return String(value ?? '')
      .replace(/"/g, "'")
      .replace(/\r?\n/g, '<br/>');
  }

  private escapeTooltip(value: string | null | undefined): string {
    return String(value ?? '')
      .replace(/"/g, "'")
      .replace(/\r?\n/g, ' ');
  }


  private sortFacts(items: Fact[]): Fact[] {
    return [...items].sort((a, b) => a.factKey.localeCompare(b.factKey));
  }

  private sortByTitle<T extends { titleFa?: string | null }>(items: T[]): T[] {
    return [...items].sort((a, b) =>
      String(a.titleFa ?? '').localeCompare(String(b.titleFa ?? ''), 'fa'),
    );
  }

  private sortByOrderThenTitle<
    T extends { order?: number; sortOrder?: number; titleFa?: string | null },
  >(items: T[]): T[] {
    return [...items].sort(
      (a, b) =>
        (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0) ||
        String(a.titleFa ?? '').localeCompare(String(b.titleFa ?? ''), 'fa'),
    );
  }

  private sortPorts<T extends LevelFlowPort>(items: T[]): T[] {
    return [...items].sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.portKey.localeCompare(b.portKey),
    );
  }

  private sortLinks<T extends LevelFlowLink | ActionFlowLink>(items: T[]): T[] {
    return [...items].sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.linkKey.localeCompare(b.linkKey),
    );
  }
}
