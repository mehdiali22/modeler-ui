export type Id = string;

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

export enum FactValueType
{
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

export type Condition = {
  id: Id;
  conditionKey: string;
  titleFa?: string;
  expression: string;
  failMessage?: string;
  factIdsUsed: Id[]; // FactsUsed
};
 
 

export type Process = {
  id: Id;
  processKey: string;
  titleFa?: string;
  description?: string;
  order?: number;
};

export type Stage = {
  id: Id;
  processId: Id;
  stageKey: string;
  titleFa?: string;
  description?: string;
  order?: number;
}; 
 
 
 

export type ExecutorKind = 'System' | 'Human';

export type ActorDefinition = {
  id: Id;
  actorKey: string;     // مثلا IncomeUser, Distributor, ClinicalReviewer, HospitalManager, System
  titleFa?: string;
  kind: ExecutorKind;   // System یا Human
  description?: string;
};

export type ActionDefinition = {
  id: Id;
  actionKey: string;
  titleFa?: string;

  targetArtifactId?: Id;

  executorKind?: ExecutorKind;   // ✅ جدید
  executorActorId?: Id;          // اگر Human بود

  description?: string;
  defaultParamsJson?: string;
};
 

export type TriggerDefinition = {
  id: Id;
  triggerKey: string;   // مثلا OnCaseLoaded, OnIncomeDecision
  titleFa?: string;
  description?: string;
};

export type EventDefinition = {
  id: Id;
  eventKey: string;     // مثلا CaseApproved, MonthlyPerformanceCreated
  titleFa?: string;
  description?: string;
};

 
export type EventTriggerLink = {
  id: Id;
  eventId: Id;
  triggerId: Id;
};
 
 

export type ScenarioDecision = {
  id: Id;

  decisionKey: string;
  titleFa?: string;
  description?: string;

  // ✅ جدید: نگاشت تصمیم به دکمه UI
  uiActionKey?: string; // مثلا BTN_APPROVE / BTN_REJECT / BTN_RETURN / BTN_OBJECT_DRUG ...

  conditionIds: Id[];
  actions: ScenarioActionRef[];
  factChanges: FactChange[];
  producedEventIds: Id[];
};

export type ScenarioActionRef = {
  actionId: string;
  paramsJson?: string;
};

export type FactChange = {
  factId: string;
  op: 'Set' | 'Unset' | 'Inc' | 'Dec';
  value?: string;
};

export type Decision = {
  id: string;
  decisionKey: string;
  titleFa?: string;
  uiActionKey?: string;     // ✅ همون binding به دکمه UI
  conditionIds: string[];
  actions: ScenarioActionRef[];
  factChanges: FactChange[];
  producedEventIds: string[];
};

export type Scenario = {
  id: string;
  scenarioKey: string;
  titleFa?: string;
  description?: string;

  stageId: string;
  ownerSubdomain?: string;

  triggerId?: string;

  preconditionIds: string[];

  // legacy (اگر داری نگه دار)
  actions: ScenarioActionRef[];
  factChanges: FactChange[];
  producedEventIds: string[];

  // ✅ V3
  decisions?: Decision[];
};
