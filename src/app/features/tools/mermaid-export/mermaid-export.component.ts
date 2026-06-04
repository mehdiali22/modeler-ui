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
import { ActionStateTransitionApiService } from '../../../core/api/action-state-transition-api.service';
import { EntityStateApiService } from '../../../core/api/entity-state-api.service';
import { ActionApiService } from '../../../core/api/action-api.service';
import {
  LevelFlowApiService,
  FlowLevel,
} from '../../../core/api/level-flow-api.service';
import { ToastService } from '../../../core/toast.service';
import {
  ActionDefinition,
  ActionFlowLink,
  ActionStateTransition,
  EntityState,
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

type MermaidMode = 'state-action-activity' | 'structure' | 'routing' | 'full';

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
  rules: KartablRoutingRule[];
  actions: ActionDefinition[];
  actionStateTransitions: ActionStateTransition[];
  entityStates: EntityState[];
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
    rules: [],
    actions: [],
    actionStateTransitions: [],
    entityStates: [],
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
    private actionStateTransitionsApi: ActionStateTransitionApiService,
    private entityStatesApi: EntityStateApiService,
    private routingRulesApi: KartablRoutingRuleApiService,
    private actionsApi: ActionApiService,
    private levelFlowApi: LevelFlowApiService,
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
      actionStateTransitions: this.actionStateTransitionsApi.list(),
      entityStates: this.entityStatesApi.list(),
      rules: this.routingRulesApi.list(),
      actions: this.actionsApi.list(),
      processPorts: this.levelFlowApi.listPorts('process'),
      processLinks: this.levelFlowApi.listLinks('process'),
      subProcessPorts: this.levelFlowApi.listPorts('sub-process'),
      subProcessLinks: this.levelFlowApi.listLinks('sub-process'),
      stagePorts: this.levelFlowApi.listPorts('stage'),
      stageLinks: this.levelFlowApi.listLinks('stage'),
      scenarioPorts: this.levelFlowApi.listPorts('scenario'),
      scenarioLinks: this.levelFlowApi.listLinks('scenario'),
      actionPorts: this.levelFlowApi.listPorts('action'),
      actionLinks: this.levelFlowApi.listLinks('action'),
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
          actionStateTransitions: [...data.actionStateTransitions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id),
          entityStates: this.sortByTitle(data.entityStates),
          rules: [...data.rules].sort(
            (a, b) =>
              (a.priority ?? 0) - (b.priority ?? 0) ||
              a.ruleKey.localeCompare(b.ruleKey),
          ),
          actions: this.sortByTitle(data.actions),
          levelFlows: {
            process: {
              ports: this.sortPorts(data.processPorts),
              links: this.sortLinks(data.processLinks),
            },
            'sub-process': {
              ports: this.sortPorts(data.subProcessPorts),
              links: this.sortLinks(data.subProcessLinks),
            },
            stage: {
              ports: this.sortPorts(data.stagePorts),
              links: this.sortLinks(data.stageLinks),
            },
            scenario: {
              ports: this.sortPorts(data.scenarioPorts),
              links: this.sortLinks(data.scenarioLinks),
            },
            action: {
              ports: this.sortPorts(data.actionPorts),
              links: this.sortLinks(data.actionLinks),
            },
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
      this.mermaid = this.buildScenarioBehaviorMermaid();
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
    a.download = 'modeler-mermaid-export.mmd';
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

  private buildScenarioBehaviorMermaid(): string {
    const lines: string[] = [
      'flowchart TB',
      '  %% Generated by Modeler State-based Activity Export',
      '  classDef scenarioNode fill:#EEF2FF,stroke:#4F46E5,stroke-width:2px;',
      '  classDef stateNode fill:#E8F1FF,stroke:#2F6FDB,stroke-width:2px;',
      '  classDef actionNode fill:#FFFFFF,stroke:#555,stroke-width:1px;',
      '  classDef decisionNode fill:#FFF7E6,stroke:#D48806,stroke-width:2px;',
      '  classDef optionNode fill:#F8FAFC,stroke:#94A3B8,stroke-width:1px;',
    ];

    const emitted = new Set<string>();
    const emit = (line: string) => {
      if (emitted.has(line)) return;
      emitted.add(line);
      lines.push(line);
    };

    const scenarios = this.filteredScenarios.filter((scenario) => {
      if (this.selectedScenarioId !== '') {
        return scenario.id === Number(this.selectedScenarioId);
      }
      return true;
    });

    for (const scenario of scenarios) {
      const scenarioLabel = this.typedLabel('Scenario', scenario.scenarioKey, scenario.titleFa);
      emit(`  subgraph SG_${scenario.id}["${this.escape(scenarioLabel)}"]`);
      emit('    direction TB');

      const scenarioTransitions = this.data.actionStateTransitions
        .filter((t) => t.scenarioId === scenario.id)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);

      const decisions = this.data.decisions.filter((d) => d.scenarioId === scenario.id);
      const decisionIds = new Set(decisions.map((d) => d.id));

      // 1) Draw ordinary flow segments, including the action before a decision.
      // A transition with decisionId and without decisionOptionId is the point that reaches the decision state.
      for (const t of scenarioTransitions.filter((x) => x.decisionOptionId == null)) {
        if (this.selectedActionId !== '' && t.actionId !== Number(this.selectedActionId)) continue;

        const actionNode = this.actionNodeId(t.actionId);
        if (t.fromStateId) {
          const fromStateNode = this.stateNodeId(t.fromStateId);
          this.emitStateNode(emit, t.fromStateId);
          emit(`    ${fromStateNode} --> ${actionNode}`);
        }

        emit(`    ${actionNode}(["${this.escape(this.actionLabelById(t.actionId))}"]):::actionNode`);

        if (t.toStateId) {
          const toStateNode = this.stateNodeId(t.toStateId);
          this.emitStateNode(emit, t.toStateId);
          emit(`    ${actionNode} --> ${toStateNode}`);

          if (t.decisionId && decisionIds.has(t.decisionId)) {
            const decisionNode = this.decisionNodeId(t.decisionId);
            this.emitDecisionNode(emit, t.decisionId);
            emit(`    ${toStateNode} --> ${decisionNode}`);
          }
        }
      }

      // 2) Draw decisions and option branches. Option transitions must start from the decision node,
      // not directly from the previous state; otherwise the graph shows two parallel meanings.
      for (const decision of decisions) {
        const decisionNode = this.decisionNodeId(decision.id);
        this.emitDecisionNode(emit, decision.id);

        const options = this.data.options.filter((o) => o.scenarioDecisionId === decision.id);
        for (const option of options) {
          const optionLabel = this.escapeEdgeLabel(`${option.optionKey}${option.titleFa ? ' / ' + option.titleFa : ''}`);
          const optionTransitions = scenarioTransitions.filter((t) => t.decisionOptionId === option.id);

          if (optionTransitions.length > 0) {
            for (const t of optionTransitions) {
              if (this.selectedActionId !== '' && t.actionId !== Number(this.selectedActionId)) continue;

              const actionNode = this.actionNodeId(t.actionId);
              emit(`    ${actionNode}(["${this.escape(this.actionLabelById(t.actionId))}"]):::actionNode`);
              emit(`    ${decisionNode} -->|"${optionLabel}"| ${actionNode}`);

              if (t.toStateId) {
                const toStateNode = this.stateNodeId(t.toStateId);
                this.emitStateNode(emit, t.toStateId);
                emit(`    ${actionNode} --> ${toStateNode}`);
              }
            }
            continue;
          }

          // Fallback for old data that only stores option actionIdsJson.
          const actionIds = this.parseIdsJson(option.actionIdsJson);
          if (actionIds.length === 0) {
            const optionNode = `OPT_${option.id}`;
            emit(`    ${decisionNode} -->|"${optionLabel}"| ${optionNode}["${this.escape(option.optionKey)}"]:::optionNode`);
            continue;
          }

          for (const actionId of actionIds) {
            if (this.selectedActionId !== '' && actionId !== Number(this.selectedActionId)) continue;
            const actionNode = this.actionNodeId(actionId);
            emit(`    ${actionNode}(["${this.escape(this.actionLabelById(actionId))}"]):::actionNode`);
            emit(`    ${decisionNode} -->|"${optionLabel}"| ${actionNode}`);
          }
        }
      }

      // 3) Fallback for legacy scenario action refs that have no state transitions.
      const transitionedActionIds = new Set(scenarioTransitions.map((t) => t.actionId));
      const directActionIds = (scenario.actions ?? [])
        .map((a) => Number(a.actionId))
        .filter((id) => Number.isFinite(id) && id > 0 && !transitionedActionIds.has(id));
      for (const actionId of directActionIds) {
        if (this.selectedActionId !== '' && actionId !== Number(this.selectedActionId)) continue;
        const actionNode = this.actionNodeId(actionId);
        emit(`    ${actionNode}(["${this.escape(this.actionLabelById(actionId))}"]):::actionNode`);
      }

      emit('  end');
    }

    if (lines.length <= 9) {
      lines.push('  Empty["برای فیلتر انتخاب‌شده Scenario/Action/Decision پیدا نشد"]');
    }

    return lines.join('\n');
  }

  private stateNodeId(stateId: number): string {
    return `STATE_${stateId}`;
  }

  private decisionNodeId(decisionId: number): string {
    return `DEC_${decisionId}`;
  }

  private emitStateNode(emit: (line: string) => void, stateId: number): void {
    const state = this.data.entityStates.find((x) => x.id === stateId);
    const label = state
      ? this.typedLabel('State', state.stateKey, state.titleFa)
      : this.typedLabel('State', `#${stateId}`);
    emit(`    ${this.stateNodeId(stateId)}["${this.escape(label)}"]:::stateNode`);
  }

  private emitDecisionNode(emit: (line: string) => void, decisionId: number): void {
    const decision = this.data.decisions.find((x) => x.id === decisionId);
    const label = decision
      ? this.typedLabel('Decision', decision.decisionKey, decision.titleFa)
      : this.typedLabel('Decision', `#${decisionId}`);
    emit(`    ${this.decisionNodeId(decisionId)}{"${this.escape(label)}"}:::decisionNode`);
  }

  private actionNodeId(actionId: number): string {
    return `ACT_${actionId}`;
  }

  private actionLabelById(actionId: number): string {
    const action = this.data.actions.find((a) => a.id === actionId);
    return this.typedLabel('Action', action?.actionKey ?? `#${actionId}`, action?.titleFa);
  }

  private buildActionLevelMermaid(): string {
    const level: FlowLevel = 'action';
    const flow = this.data.levelFlows.action;
    let ports = this.filterLevelPorts('action', flow.ports);
    let links = this.filterLevelLinks('action', flow.links, ports);

    const portIds = new Set(ports.map((p) => p.id));
    links = links.filter(
      (l) => portIds.has(l.fromPortId) && portIds.has(l.toPortId),
    );

    const lines: string[] = [
      'flowchart TB',
      '  %% Generated by Modeler Level Flow Export: action',
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
        emit(`  ${portNode}["${this.escape(this.portLabel(port))}"]`);

        if (this.isOutPort(port)) {
          emit(`  ${actionNode} --> ${portNode}`);
        } else {
          emit(`  ${portNode} --> ${actionNode}`);
        }
      }
    }

    for (const link of links) {
      const from = this.portNodeId(level, link.fromPortId);
      const to = this.portNodeId(level, link.toPortId);
      const label = link.labelFa ? `|"${this.escape(link.labelFa)}"|` : '';
      emit(`  ${from} -->${label} ${to}`);
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
      emit(`  ${portNode}["${this.escape(this.portLabel(port))}"]`);

      if (ownerId != null) {
        const ownerNode = this.ownerNodeId(level, ownerId);
        if (this.isOutPort(port)) {
          emit(`  ${ownerNode} --> ${portNode}`);
        } else {
          emit(`  ${portNode} --> ${ownerNode}`);
        }
      }
    }

    for (const link of links) {
      const from = this.portNodeId(level, link.fromPortId);
      const to = this.portNodeId(level, link.toPortId);
      const label = link.labelFa ? `|"${this.escape(link.labelFa)}"|` : '';
      emit(`  ${from} -->${label} ${to}`);
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

  private escapeEdgeLabel(value: string | null | undefined): string {
    return this.escape(value);
  }

  private escape(value: string | null | undefined): string {
    return String(value ?? '')
      .replace(/"/g, "'")
      .replace(/\r?\n/g, '<br/>');
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
