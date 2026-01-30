import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CatalogStoreService } from '../../core/catalog-store.service';
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
} from '../../core/types';

const COL_ARTIFACTS = 'artifacts';
const COL_FACTS = 'facts';
const COL_CONDS = 'conditions';
const COL_ACTORS = 'actors';
const COL_ACTIONS = 'actions';
const COL_PROCESSES = 'processes';
const COL_STAGES = 'stages';
const COL_TRIGGERS = 'triggers';
const COL_EVENTS = 'events';
const COL_SCENARIOS = 'scenarios';
const COL_LINKS = 'eventTriggerLinks';

@Component({
  selector: 'app-seed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seed.component.html',
  styleUrls: ['./seed.component.scss'],
})
export class SeedComponent
{
  log: string[] = [];

  constructor(private store: CatalogStoreService) { }

  // ---------- helpers ----------
  private write(msg: string)
  {
    this.log = [msg, ...this.log];
  }

  private saveIfEmpty<T>(col: string, rows: T[], overwrite: boolean)
  {
    const current = this.store.list<T>(col);
    if (!overwrite && current.length)
    {
      this.write(`SKIP ${col} (already has ${current.length})`);
      return;
    }
    this.store.save(col, rows);
    this.write(`SAVE ${col} = ${rows.length}`);
  }

  // ---------- actions ----------
  seed(overwrite: boolean)
  {
    this.log = [];
    this.write(`SEED START (overwrite=${overwrite})`);

    // --- IDs (fixed for references) ---
    // Processes
    const P_MAIN = 1;

    // Stages
    const ST_INTAKE = 10;
    const ST_INCOME = 11;
    const ST_DIST = 12;
    const ST_CLIN = 13;
    const ST_DRUG = 14;
    const ST_FINAL = 15;
    const ST_MANAGER = 16;

    // Artifacts
    const A_CASE = 100;
    const A_KSR = 101;
    const A_MONTH = 102;

    // Facts
    const F_CASE_STATUS = 200;
    const F_CASE_LOCKED = 201;
    const F_HAS_CLIN = 202;
    const F_HAS_DRUG = 203;
    const F_CLIN_DONE = 204;
    const F_DRUG_DONE = 205;
    const F_FINAL_DONE = 206;
    const F_KSR_GATE = 207;
    const F_TOTALS_OK = 208;
    const F_MONTH_CLOSED = 209;

    // Conditions
    const C_CAN_START = 300;
    const C_CAN_APPROVE_INCOME = 301;
    const C_NEED_DIST = 302;
    const C_CLIN_REQUIRED = 303;
    const C_DRUG_REQUIRED = 304;
    const C_READY_FINAL = 305;
    const C_READY_MANAGER = 306;

    // Actors
    const ACT_SYSTEM = 400;
    const ACT_INCOME = 401;
    const ACT_DISTR = 402;
    const ACT_CLIN = 403;
    const ACT_DRUG = 404;
    const ACT_FINAL = 405;
    const ACT_MANAGER = 406;

    // Actions
    const AC_IMPORT_XML = 450;
    const AC_CALC_AUTO_KSR = 451;
    const AC_START_ACTIVITY = 452;
    const AC_INCOME_APPROVE = 453;
    const AC_INCOME_REJECT = 454;
    const AC_ASSIGN_REVIEWERS = 455;
    const AC_CLOSE_CLIN = 456;
    const AC_CLOSE_DRUG = 457;
    const AC_CLOSE_FINAL = 458;
    const AC_CLOSE_MONTH = 459;

    // Triggers
    const TR_XML_RECEIVED = 500;
    const TR_INCOME_START = 501;
    const TR_INCOME_DECISION = 502;
    const TR_DISTRIBUTE = 503;
    const TR_CLIN_CLOSE = 504;
    const TR_DRUG_CLOSE = 505;
    const TR_FINAL_CLOSE = 506;
    const TR_MANAGER_CLOSE_MONTH = 507;

    // Events
    const EV_IMPORTED = 550;
    const EV_READY_FOR_INCOME = 551;
    const EV_ACTIVITY_STARTED = 552;
    const EV_INCOME_APPROVED = 553;
    const EV_INCOME_REJECTED = 554;
    const EV_DISTRIBUTED = 555;
    const EV_CLIN_CLOSED = 556;
    const EV_DRUG_CLOSED = 557;
    const EV_FINAL_CLOSED = 558;
    const EV_MONTH_CLOSED = 559;

    // --- seed payloads ---
    const processes: Process[] = [
      { id: P_MAIN, processKey: 'RASA_MAIN', titleFa: 'فرآیند کلی رسا', order: 10 },
    ];

    const stages: Stage[] = [
      { id: ST_INTAKE, processId: P_MAIN, stageKey: 'STAGE_01_INTAKE', titleFa: 'دریافت/پردازش اولیه (اتومات)', order: 10 },
      { id: ST_INCOME, processId: P_MAIN, stageKey: 'STAGE_03_INCOME', titleFa: 'درآمد: شروع فعالیت/تایید/ابطال', order: 30 },
      { id: ST_DIST, processId: P_MAIN, stageKey: 'STAGE_04_DISTRIBUTE', titleFa: 'توزیع به رسیدگی‌کننده‌ها', order: 40 },
      { id: ST_CLIN, processId: P_MAIN, stageKey: 'STAGE_05_CLINICAL', titleFa: 'رسیدگی بالینی', order: 50 },
      { id: ST_DRUG, processId: P_MAIN, stageKey: 'STAGE_05_DRUG', titleFa: 'رسیدگی دارویی', order: 55 },
      { id: ST_FINAL, processId: P_MAIN, stageKey: 'STAGE_06_FINAL', titleFa: 'رسیدگی نهایی', order: 60 },
      { id: ST_MANAGER, processId: P_MAIN, stageKey: 'STAGE_07_MANAGER', titleFa: 'مدیر بیمارستان: بستن ماه عملکرد', order: 70 },
    ];

    const artifacts: Artifact[] = [
      { id: A_CASE, artifactKey: 'Case', titleFa: 'پرونده', isChildOfCase: false, description: '' },
      // ✅ طبق تصمیم پروژه: KSR زیرمجموعه Case است
      { id: A_KSR, artifactKey: 'CaseKsr', titleFa: 'کسورات پرونده (KSR)', isChildOfCase: true, description: '' },
      { id: A_MONTH, artifactKey: 'MonthlyPerformance', titleFa: 'ماه عملکرد', isChildOfCase: false, description: '' },
    ];

    // ✅ FIX: artifactId برای Factها
    const facts: Fact[] = [
      { id: F_CASE_STATUS, artifactId: A_CASE, factKey: 'Case.Status', valueType: 0 as any, meaning: 'وضعیت پرونده (Draft/Approved/Rejected/...)' },
      { id: F_CASE_LOCKED, artifactId: A_CASE, factKey: 'Case.LockedByIncome', valueType: 0 as any, meaning: 'پرونده در اختیار یک کاربر درآمد است یا نه' },

      { id: F_HAS_CLIN, artifactId: A_CASE, factKey: 'Case.HasClinicalItems', valueType: 0 as any, meaning: 'پرونده اقلام بالینی دارد؟' },
      { id: F_HAS_DRUG, artifactId: A_CASE, factKey: 'Case.HasDrugItems', valueType: 0 as any, meaning: 'پرونده اقلام دارویی دارد؟' },

      { id: F_CLIN_DONE, artifactId: A_CASE, factKey: 'Case.ClinicalDone', valueType: 0 as any, meaning: 'رسیدگی بالینی تمام شده؟' },
      { id: F_DRUG_DONE, artifactId: A_CASE, factKey: 'Case.DrugDone', valueType: 0 as any, meaning: 'رسیدگی دارویی تمام شده؟' },
      { id: F_FINAL_DONE, artifactId: A_CASE, factKey: 'Case.FinalDone', valueType: 0 as any, meaning: 'رسیدگی نهایی تمام شده؟' },

      { id: F_KSR_GATE, artifactId: A_KSR, factKey: 'CaseKsr.KsrGateState', valueType: 0 as any, meaning: 'Gate کسورات (Open/Ready/Blocked)' },
      { id: F_TOTALS_OK, artifactId: A_CASE, factKey: 'Case.TotalsValidated', valueType: 0 as any, meaning: 'جمع‌ها/توتال‌ها معتبر است؟' },

      { id: F_MONTH_CLOSED, artifactId: A_MONTH, factKey: 'MonthlyPerformance.Closed', valueType: 0 as any, meaning: 'ماه عملکرد بسته شده؟' },
    ];

    // ✅ FIX: factIdsUsed برای Conditionها
    const conditions: Condition[] = [
      {
        id: C_CAN_START,
        conditionKey: 'CanStartActivity',
        titleFa: 'اجازه شروع فعالیت',
        expression: 'Case.LockedByIncome == false',
        factIdsUsed: [F_CASE_LOCKED],
      },
      {
        id: C_CAN_APPROVE_INCOME,
        conditionKey: 'CanIncomeApprove',
        titleFa: 'اجازه تایید درآمد',
        expression: 'Case.TotalsValidated == true AND CaseKsr.KsrGateState == Ready',
        factIdsUsed: [F_TOTALS_OK, F_KSR_GATE],
      },
      {
        id: C_NEED_DIST,
        conditionKey: 'NeedDistribution',
        titleFa: 'نیاز به توزیع دارد',
        expression: 'Case.Status == Approved',
        factIdsUsed: [F_CASE_STATUS],
      },
      {
        id: C_CLIN_REQUIRED,
        conditionKey: 'ClinicalReviewRequired',
        titleFa: 'رسیدگی بالینی لازم است',
        expression: 'Case.HasClinicalItems == true',
        factIdsUsed: [F_HAS_CLIN],
      },
      {
        id: C_DRUG_REQUIRED,
        conditionKey: 'DrugReviewRequired',
        titleFa: 'رسیدگی دارویی لازم است',
        expression: 'Case.HasDrugItems == true',
        factIdsUsed: [F_HAS_DRUG],
      },
      {
        id: C_READY_FINAL,
        conditionKey: 'ReadyForFinalReview',
        titleFa: 'آماده رسیدگی نهایی',
        expression: '(Case.HasClinicalItems == false OR Case.ClinicalDone == true) AND (Case.HasDrugItems == false OR Case.DrugDone == true)',
        factIdsUsed: [F_HAS_CLIN, F_CLIN_DONE, F_HAS_DRUG, F_DRUG_DONE],
      },
      {
        id: C_READY_MANAGER,
        conditionKey: 'ReadyForManagerMonthClose',
        titleFa: 'آماده بستن ماه عملکرد',
        expression: 'Case.FinalDone == true',
        factIdsUsed: [F_FINAL_DONE],
      },
    ];

    const actors: ActorDefinition[] = [
      { id: ACT_SYSTEM, actorKey: 'System', titleFa: 'سیستم', kind: 'System' },
      { id: ACT_INCOME, actorKey: 'IncomeUser', titleFa: 'کاربر درآمد', kind: 'Human' },
      { id: ACT_DISTR, actorKey: 'Distributor', titleFa: 'توزیع‌کننده', kind: 'Human' },
      { id: ACT_CLIN, actorKey: 'ClinicalReviewer', titleFa: 'رسیدگی‌کننده بالینی', kind: 'Human' },
      { id: ACT_DRUG, actorKey: 'DrugReviewer', titleFa: 'رسیدگی‌کننده دارویی', kind: 'Human' },
      { id: ACT_FINAL, actorKey: 'FinalReviewer', titleFa: 'رسیدگی‌کننده نهایی', kind: 'Human' },
      { id: ACT_MANAGER, actorKey: 'HospitalManager', titleFa: 'مدیر بیمارستان', kind: 'Human' },
    ];

    const actions: ActionDefinition[] = [
      {
        id: AC_IMPORT_XML,
        actionKey: 'ImportXml',
        titleFa: 'پارس XML و استخراج دیتا',
        targetArtifactId: A_CASE,
        executorKind: 'System',
        defaultParamsJson: '{"source":"Sepas"}',
      },
      {
        id: AC_CALC_AUTO_KSR,
        actionKey: 'CalculateAutoDeductions',
        titleFa: 'محاسبه کسور اتومات',
        targetArtifactId: A_KSR,
        executorKind: 'System',
      },
      {
        id: AC_START_ACTIVITY,
        actionKey: 'StartActivity',
        titleFa: 'شروع فعالیت/قفل درآمد روی پرونده',
        targetArtifactId: A_CASE,
        executorKind: 'Human',
        executorActorId: ACT_INCOME,
        defaultParamsJson: '{"lock":true}',
      },
      {
        id: AC_INCOME_APPROVE,
        actionKey: 'IncomeApprove',
        titleFa: 'تایید درآمد',
        targetArtifactId: A_CASE,
        executorKind: 'Human',
        executorActorId: ACT_INCOME,
      },
      {
        id: AC_INCOME_REJECT,
        actionKey: 'IncomeReject',
        titleFa: 'ابطال/عدم تایید درآمد',
        targetArtifactId: A_CASE,
        executorKind: 'Human',
        executorActorId: ACT_INCOME,
      },
      {
        id: AC_ASSIGN_REVIEWERS,
        actionKey: 'AssignReviewers',
        titleFa: 'تخصیص رسیدگی‌کننده بالینی/دارویی',
        targetArtifactId: A_CASE,
        executorKind: 'Human',
        executorActorId: ACT_DISTR,
        defaultParamsJson: '{"clinicalReviewerId":null,"drugReviewerId":null}',
      },
      {
        id: AC_CLOSE_CLIN,
        actionKey: 'CloseClinicalReview',
        titleFa: 'بستن رسیدگی بالینی',
        targetArtifactId: A_CASE,
        executorKind: 'Human',
        executorActorId: ACT_CLIN,
      },
      {
        id: AC_CLOSE_DRUG,
        actionKey: 'CloseDrugReview',
        titleFa: 'بستن رسیدگی دارویی',
        targetArtifactId: A_CASE,
        executorKind: 'Human',
        executorActorId: ACT_DRUG,
      },
      {
        id: AC_CLOSE_FINAL,
        actionKey: 'CloseFinalReview',
        titleFa: 'بستن رسیدگی نهایی',
        targetArtifactId: A_CASE,
        executorKind: 'Human',
        executorActorId: ACT_FINAL,
      },
      {
        id: AC_CLOSE_MONTH,
        actionKey: 'CloseMonthlyPerformance',
        titleFa: 'بستن ماه عملکرد',
        targetArtifactId: A_MONTH,
        executorKind: 'Human',
        executorActorId: ACT_MANAGER,
      },
    ];

    const triggers: TriggerDefinition[] = [
      { id: TR_XML_RECEIVED, triggerKey: 'OnXmlReceived', titleFa: 'دریافت XML خام از سپاس' },
      { id: TR_INCOME_START, triggerKey: 'OnIncomeStartActivity', titleFa: 'کلیک شروع فعالیت توسط درآمد' },
      { id: TR_INCOME_DECISION, triggerKey: 'OnIncomeDecision', titleFa: 'تایید/ابطال توسط درآمد' },
      { id: TR_DISTRIBUTE, triggerKey: 'OnDistribute', titleFa: 'توزیع پرونده' },
      { id: TR_CLIN_CLOSE, triggerKey: 'OnClinicalClose', titleFa: 'بستن رسیدگی بالینی' },
      { id: TR_DRUG_CLOSE, triggerKey: 'OnDrugClose', titleFa: 'بستن رسیدگی دارویی' },
      { id: TR_FINAL_CLOSE, triggerKey: 'OnFinalClose', titleFa: 'بستن رسیدگی نهایی' },
      { id: TR_MANAGER_CLOSE_MONTH, triggerKey: 'OnManagerCloseMonth', titleFa: 'بستن ماه عملکرد توسط مدیر' },
    ];

    const events: EventDefinition[] = [
      { id: EV_IMPORTED, eventKey: 'CaseImported', titleFa: 'پرونده وارد شد' },
      { id: EV_READY_FOR_INCOME, eventKey: 'CaseReadyForIncome', titleFa: 'آماده برای درآمد' },
      { id: EV_ACTIVITY_STARTED, eventKey: 'ActivityStarted', titleFa: 'شروع فعالیت انجام شد' },
      { id: EV_INCOME_APPROVED, eventKey: 'IncomeApproved', titleFa: 'تایید درآمد' },
      { id: EV_INCOME_REJECTED, eventKey: 'IncomeRejected', titleFa: 'ابطال/عدم تایید درآمد' },
      { id: EV_DISTRIBUTED, eventKey: 'CaseDistributed', titleFa: 'توزیع انجام شد' },
      { id: EV_CLIN_CLOSED, eventKey: 'ClinicalClosed', titleFa: 'رسیدگی بالینی بسته شد' },
      { id: EV_DRUG_CLOSED, eventKey: 'DrugClosed', titleFa: 'رسیدگی دارویی بسته شد' },
      { id: EV_FINAL_CLOSED, eventKey: 'FinalClosed', titleFa: 'رسیدگی نهایی بسته شد' },
      { id: EV_MONTH_CLOSED, eventKey: 'MonthlyPerformanceClosed', titleFa: 'ماه عملکرد بسته شد' },
    ];

    // Event → Trigger links (زنجیره‌سازی ساده)
    const links: EventTriggerLink[] = [
      { id: 800, eventId: EV_READY_FOR_INCOME, triggerId: TR_INCOME_START },
      { id: 801, eventId: EV_ACTIVITY_STARTED, triggerId: TR_INCOME_DECISION },
      { id: 802, eventId: EV_INCOME_APPROVED, triggerId: TR_DISTRIBUTE },
      { id: 803, eventId: EV_DISTRIBUTED, triggerId: TR_CLIN_CLOSE }, // در عمل می‌تونه هم دارویی هم بالینی
      { id: 804, eventId: EV_CLIN_CLOSED, triggerId: TR_DRUG_CLOSE },
      { id: 805, eventId: EV_DRUG_CLOSED, triggerId: TR_FINAL_CLOSE },
      { id: 806, eventId: EV_FINAL_CLOSED, triggerId: TR_MANAGER_CLOSE_MONTH },
    ];

    const scenarios: Scenario[] = [
      {
        id: 600,
        scenarioKey: 'CASE_S_ImportAndAutoKsr',
        titleFa: 'پارس XML و محاسبه کسور اتومات',
        stageId: ST_INTAKE,
        ownerSubdomain: 'Case',
        triggerId: TR_XML_RECEIVED,
        description: 'وقتی XML خام می‌آید، دیتا استخراج و کسور اتومات محاسبه می‌شود.',
        preconditionIds: [],
        actions: [
          { actionId: AC_IMPORT_XML },
          { actionId: AC_CALC_AUTO_KSR },
        ],
        factChanges: [
          { factId: F_CASE_STATUS, op: 'Set', value: 'Draft' },
          { factId: F_CASE_LOCKED, op: 'Set', value: 'false' },
          { factId: F_KSR_GATE, op: 'Set', value: 'Open' },
        ],
        producedEventIds: [EV_IMPORTED, EV_READY_FOR_INCOME],
      },
      {
        id: 601,
        scenarioKey: 'CASE_S_IncomeStartActivity',
        titleFa: 'درآمد: شروع فعالیت',
        stageId: ST_INCOME,
        ownerSubdomain: 'Case',
        triggerId: TR_INCOME_START,
        preconditionIds: [C_CAN_START],
        actions: [{ actionId: AC_START_ACTIVITY }],
        factChanges: [{ factId: F_CASE_LOCKED, op: 'Set', value: 'true' }],
        producedEventIds: [EV_ACTIVITY_STARTED],
      },

      // ✅ تبدیل s3 به Decision-based + uiActionKey
      {
        id: 602,
        scenarioKey: 'CASE_S_IncomeDecision',
        titleFa: 'درآمد: تصمیم (تایید / ابطال)',
        stageId: ST_INCOME,
        ownerSubdomain: 'Case',
        triggerId: TR_INCOME_DECISION,
        description: 'سناریوی چندخروجی: خروجی از طریق decisions مشخص می‌شود.',
        preconditionIds: [],
        actions: [],
        factChanges: [],
        producedEventIds: [],
        decisions: [
          {
            id: 700,
            decisionKey: 'Approve',
            titleFa: 'تایید',
            uiActionKey: 'BTN_APPROVE',
            conditionIds: [C_CAN_APPROVE_INCOME],
            actions: [{ actionId: AC_INCOME_APPROVE, paramsJson: '{"mode":"Approve"}' }],
            factChanges: [
              { factId: F_CASE_STATUS, op: 'Set', value: 'Approved' },
              { factId: F_CASE_LOCKED, op: 'Set', value: 'false' },
            ],
            producedEventIds: [EV_INCOME_APPROVED],
          },
          {
            id: 701,
            decisionKey: 'Reject',
            titleFa: 'ابطال/عدم تایید',
            uiActionKey: 'BTN_REJECT',
            conditionIds: [],
            actions: [{ actionId: AC_INCOME_REJECT, paramsJson: '{"mode":"Reject"}' }],
            factChanges: [
              { factId: F_CASE_STATUS, op: 'Set', value: 'Rejected' },
              { factId: F_CASE_LOCKED, op: 'Set', value: 'false' },
            ],
            producedEventIds: [EV_INCOME_REJECTED],
          },
        ],
      },

      {
        id: 603,
        scenarioKey: 'CASE_S_Distribute',
        titleFa: 'توزیع پرونده به رسیدگی‌کننده‌ها',
        stageId: ST_DIST,
        ownerSubdomain: 'Case',
        triggerId: TR_DISTRIBUTE,
        preconditionIds: [C_NEED_DIST],
        actions: [{ actionId: AC_ASSIGN_REVIEWERS }],
        factChanges: [],
        producedEventIds: [EV_DISTRIBUTED],
      },
      {
        id: 604,
        scenarioKey: 'CASE_S_CloseClinical',
        titleFa: 'بستن رسیدگی بالینی',
        stageId: ST_CLIN,
        ownerSubdomain: 'Case',
        triggerId: TR_CLIN_CLOSE,
        preconditionIds: [],
        actions: [{ actionId: AC_CLOSE_CLIN }],
        factChanges: [{ factId: F_CLIN_DONE, op: 'Set', value: 'true' }],
        producedEventIds: [EV_CLIN_CLOSED],
      },
      {
        id: 605,
        scenarioKey: 'CASE_S_CloseDrug',
        titleFa: 'بستن رسیدگی دارویی',
        stageId: ST_DRUG,
        ownerSubdomain: 'Case',
        triggerId: TR_DRUG_CLOSE,
        preconditionIds: [],
        actions: [{ actionId: AC_CLOSE_DRUG }],
        factChanges: [{ factId: F_DRUG_DONE, op: 'Set', value: 'true' }],
        producedEventIds: [EV_DRUG_CLOSED],
      },
      {
        id: 606,
        scenarioKey: 'CASE_S_CloseFinal',
        titleFa: 'بستن رسیدگی نهایی',
        stageId: ST_FINAL,
        ownerSubdomain: 'Case',
        triggerId: TR_FINAL_CLOSE,
        preconditionIds: [C_READY_FINAL],
        actions: [{ actionId: AC_CLOSE_FINAL }],
        factChanges: [{ factId: F_FINAL_DONE, op: 'Set', value: 'true' }],
        producedEventIds: [EV_FINAL_CLOSED],
      },
      {
        id: 607,
        scenarioKey: 'SETTLEMENT_S_ManagerCloseMonth',
        titleFa: 'مدیر بیمارستان: بستن ماه عملکرد',
        stageId: ST_MANAGER,
        ownerSubdomain: 'Settlement',
        triggerId: TR_MANAGER_CLOSE_MONTH,
        preconditionIds: [C_READY_MANAGER],
        actions: [{ actionId: AC_CLOSE_MONTH }],
        factChanges: [{ factId: F_MONTH_CLOSED, op: 'Set', value: 'true' }],
        producedEventIds: [EV_MONTH_CLOSED],
      },
    ];

    // --- save (skip if not overwrite and already exists) ---
    this.saveIfEmpty<Process>(COL_PROCESSES, processes, overwrite);
    this.saveIfEmpty<Stage>(COL_STAGES, stages, overwrite);
    this.saveIfEmpty<Artifact>(COL_ARTIFACTS, artifacts, overwrite);

    this.saveIfEmpty<Fact>(COL_FACTS, facts, overwrite);
    this.saveIfEmpty<Condition>(COL_CONDS, conditions, overwrite);

    this.saveIfEmpty<ActorDefinition>(COL_ACTORS, actors, overwrite);
    this.saveIfEmpty<ActionDefinition>(COL_ACTIONS, actions, overwrite);

    this.saveIfEmpty<TriggerDefinition>(COL_TRIGGERS, triggers, overwrite);
    this.saveIfEmpty<EventDefinition>(COL_EVENTS, events, overwrite);

    this.saveIfEmpty<Scenario>(COL_SCENARIOS, scenarios, overwrite);
    this.saveIfEmpty<EventTriggerLink>(COL_LINKS, links, overwrite);

    this.write('SEED DONE ✅');
  }

  clearAll()
  {
    this.log = [];
    const cols = [
      COL_LINKS,
      COL_SCENARIOS,
      COL_EVENTS,
      COL_TRIGGERS,
      COL_ACTIONS,
      COL_ACTORS,
      COL_CONDS,
      COL_FACTS,
      COL_ARTIFACTS,
      COL_STAGES,
      COL_PROCESSES,
    ];

    for (const c of cols) this.store.save(c, []);
    this.write('CLEAR ALL ✅');
  }
}
