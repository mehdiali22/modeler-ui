export type Id = number;

export type ModelContext = {
  projectName: string;
  versionName: string;
};

export type Artifact = {
  id: Id;
  artifactKey: string;
  titleFa?: string;
  description?: string;
  isChildOfCase: boolean;
};

export enum FactValueType {
  String = 1,
  Int = 2,
  Decimal = 3,
  Bool = 4,
  DateTime = 5,
  Enum = 6,
  Month = 7,
}

export type Fact = {
  id: Id;
  artifactId: Id;
  factKey: string;
  valueType: FactValueType;
  meaning?: string;
};

export type FactEnumValue = {
  id: Id;
  factId: Id;
  enumKey: string;
  titleFa?: string | null;
  value?: string | null;
};

export type Condition = {
  id: Id;
  conditionKey: string;
  titleFa?: string;
  expression: string;
  failMessage?: string;
  factIdsUsed: Id[];
};

export type Process = {
  id: Id;
  processKey: string;
  titleFa?: string;
  description?: string;
  order?: number;
};

export type SubProcess = {
  id: Id;
  processId: Id;
  subProcessKey: string;
  titleFa?: string;
  description?: string;
  order?: number;
};

export type Stage = {
  id: Id;
  processId: Id;
  subProcessId?: Id | null;
  stageKey: string;
  titleFa?: string;
  description?: string;
  order?: number;
};

export type ExecutorKind = 'System' | 'Human';

export type ActorDefinition = {
  id: Id;
  actorKey: string;
  titleFa?: string;
  kind: ExecutorKind;
  description?: string;
};

export type ActionDefinition = {
  id: Id;
  actionKey: string;
  titleFa?: string;
  targetArtifactId?: Id;
  executorKind?: ExecutorKind;
  executorActorId?: Id;
  description?: string;
  defaultParamsJson?: string;
};

export type Kartabl = {
  id: Id;
  kartablKey: string;
  titleFa?: string;
  description?: string;
  ownerSubdomain?: string;
  stageId?: Id | null;
};

export type KartablRoutingRule = {
  id: Id;
  ruleKey: string;
  ownerSubdomain?: string;
  priority: number;
  fromKartablId?: Id | null;
  targetKartablId: Id;
  conditionIdsJson: string;
  titleFa?: string;
  description?: string;
};

export type ScenarioActionRef = {
  actionId: Id;
  paramsJson?: string;
};

export type FactChange = {
  id?: Id;
  scenarioId?: Id;
  factId: Id;
  op: 'Set' | 'Unset' | 'Inc' | 'Dec';
  sortOrder?: number;
  value?: string;
};

export type DecisionOptionFactChange = {
  id: Id;
  scenarioDecisionOptionId: Id;
  factId: Id;
  op: 'Set' | 'Unset' | 'Inc' | 'Dec';
  sortOrder?: number;
  value?: string;
};

export type ScenarioDecision = {
  id: Id;
  scenarioId: Id;
  decisionKey: string;
  titleFa?: string;
  uiActionKey?: string;
};

export type ScenarioDecisionOption = {
  id: Id;
  scenarioDecisionId: Id;
  optionKey: string;
  titleFa?: string;
  conditionIdsJson?: string;
  actionIdsJson?: string;
};

export type Scenario = {
  id: Id;
  scenarioKey: string;
  titleFa?: string;
  description?: string;
  stageId: Id;
  ownerSubdomain?: string;
  decisions?: Decision[];
  kartablIds?: Id[];
  preconditionIds: Id[];
  actions: ScenarioActionRef[];
  factChanges: FactChange[];
};

export type WorkItem = {
  id: Id;
  workItemKey: string;
  ownerSubdomain: string;
  referenceNo?: string;
  caseId?: string;
  currentKartablId?: Id | null;
  factsJson?: string;
  caseStatus?: string;
  title?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
};

export type PagedResult<T> = {
  total: number;
  items: T[];
};

export type ExecuteScenarioOnWorkItemRequest = {
  scenarioId: Id;
  decisionOptionId?: Id | null;
};

export type ExecuteScenarioOnWorkItemResponse = {
  workItemId: Id;
  scenarioId: Id;
  decisionOptionId?: Id | null;
  beforeKartablId?: Id | null;
  afterKartablId?: Id | null;
  beforeFacts?: Record<string, unknown>;
  afterFacts?: Record<string, unknown>;
};

export type WorkItemAction = {
  id: Id;
  workItemId: Id;
  actionId: Id;
  source: string;
  sourceScenarioId: Id;
  sourceDecisionOptionId?: Id | null;
  paramsJson?: string;
  status: 'Pending' | 'Done' | 'Failed' | string;
  attemptCount: number;
  lastAttemptAtUtc?: string | null;
  completedAtUtc?: string | null;
  failedAtUtc?: string | null;
  lastError?: string | null;
};

export type Decision = { id: Id; decisionKey: string; titleFa?: string; uiActionKey?: string; conditionIds?: Id[]; actions?: ScenarioActionRef[]; factChanges?: FactChange[] };

export type ValidationIssue = {
  entity: string;
  entityId?: number | null;
  message: string;
};


export type FlowPortDirection = 'In' | 'Out';

export type LevelFlowPort = {
  id: Id;
  ownerId: Id;
  ownerKey?: string;
  portKey: string;
  titleFa?: string | null;
  direction: FlowPortDirection | string;
  payloadSchemaJson?: string | null;
  sortOrder: number;
  description?: string | null;
};

export type LevelFlowLink = {
  id: Id;
  linkKey: string;
  fromPortId: Id;
  toPortId: Id;
  conditionIdsJson: string;
  labelFa?: string | null;
  sortOrder: number;
  description?: string | null;
};

export type ActionFlowLink = LevelFlowLink & {
  scopeType?: string | null;
  scopeId?: Id | null;
};


export type EntityState = {
  id: Id;
  artifactId: Id;
  stateKey: string;
  titleFa?: string | null;
  conditionJson: string;
  description?: string | null;
};

export type ActionStateTransition = {
  id: Id;
  scenarioId?: Id | null;
  actionId: Id;
  fromStateId?: Id | null;
  toStateId?: Id | null;
  decisionId?: Id | null;
  decisionOptionId?: Id | null;
  labelFa?: string | null;
  sortOrder: number;
  description?: string | null;
};
