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
