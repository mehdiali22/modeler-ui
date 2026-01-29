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
    const P_MAIN = 'p_main';

    // Stages
    const ST_INTAKE = 'st_intake';
    const ST_INCOME = 'st_income';
    const ST_DIST = 'st_dist';
    const ST_CLIN = 'st_clin';
    const ST_DRUG = 'st_drug';
    const ST_FINAL = 'st_final';
    const ST_MANAGER = 'st_manager';

    // Artifacts
    const A_CASE = 'a_case';
    const A_KSR = 'a_ksr';
    const A_MONTH = 'a_month';

    // Facts
    const F_CASE_STATUS = 'f_case_status';
    const F_CASE_LOCKED = 'f_case_locked';
    const F_HAS_CLIN = 'f_has_clin';
    const F_HAS_DRUG = 'f_has_drug';
    const F_CLIN_DONE = 'f_clin_done';
    const F_DRUG_DONE = 'f_drug_done';
    const F_FINAL_DONE = 'f_final_done';
    const F_KSR_GATE = 'f_ksr_gate';
    const F_TOTALS_OK = 'f_totals_ok';
    const F_MONTH_CLOSED = 'f_month_closed';

    // Conditions
    const C_CAN_START = 'c_can_start';
    const C_CAN_APPROVE_INCOME = 'c_can_income_approve';
    const C_NEED_DIST = 'c_need_dist';
    const C_CLIN_REQUIRED = 'c_clin_required';
    const C_DRUG_REQUIRED = 'c_drug_required';
    const C_READY_FINAL = 'c_ready_final';
    const C_READY_MANAGER = 'c_ready_manager';

    // Actors
    const ACT_SYSTEM = 'act_system';
    const ACT_INCOME = 'act_income';
    const ACT_DISTR = 'act_distributor';
    const ACT_CLIN = 'act_clin';
    const ACT_DRUG = 'act_drug';
    const ACT_FINAL = 'act_final';
    const ACT_MANAGER = 'act_manager';

    // Actions
    const AC_IMPORT_XML = 'ac_import_xml';
    const AC_CALC_AUTO_KSR = 'ac_calc_auto_ksr';
    const AC_START_ACTIVITY = 'ac_start_activity';
    const AC_INCOME_APPROVE = 'ac_income_approve';
    const AC_INCOME_REJECT = 'ac_income_reject';
    const AC_ASSIGN_REVIEWERS = 'ac_assign_reviewers';
    const AC_CLOSE_CLIN = 'ac_close_clin';
    const AC_CLOSE_DRUG = 'ac_close_drug';
    const AC_CLOSE_FINAL = 'ac_close_final';
    const AC_CLOSE_MONTH = 'ac_close_month';

    // Triggers
    const TR_XML_RECEIVED = 'tr_xml_received';
    const TR_INCOME_START = 'tr_income_start';
    const TR_INCOME_DECISION = 'tr_income_decision';
    const TR_DISTRIBUTE = 'tr_distribute';
    const TR_CLIN_CLOSE = 'tr_clin_close';
    const TR_DRUG_CLOSE = 'tr_drug_close';
    const TR_FINAL_CLOSE = 'tr_final_close';
    const TR_MANAGER_CLOSE_MONTH = 'tr_manager_close_month';

    // Events
    const EV_IMPORTED = 'ev_imported';
    const EV_READY_FOR_INCOME = 'ev_ready_for_income';
    const EV_ACTIVITY_STARTED = 'ev_activity_started';
    const EV_INCOME_APPROVED = 'ev_income_approved';
    const EV_INCOME_REJECTED = 'ev_income_rejected';
    const EV_DISTRIBUTED = 'ev_distributed';
    const EV_CLIN_CLOSED = 'ev_clin_closed';
    const EV_DRUG_CLOSED = 'ev_drug_closed';
    const EV_FINAL_CLOSED = 'ev_final_closed';
    const EV_MONTH_CLOSED = 'ev_month_closed';

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
      { id: 'l1', eventId: EV_READY_FOR_INCOME, triggerId: TR_INCOME_START },
      { id: 'l2', eventId: EV_ACTIVITY_STARTED, triggerId: TR_INCOME_DECISION },
      { id: 'l3', eventId: EV_INCOME_APPROVED, triggerId: TR_DISTRIBUTE },
      { id: 'l4', eventId: EV_DISTRIBUTED, triggerId: TR_CLIN_CLOSE }, // در عمل می‌تونه هم دارویی هم بالینی
      { id: 'l5', eventId: EV_CLIN_CLOSED, triggerId: TR_DRUG_CLOSE },
      { id: 'l6', eventId: EV_DRUG_CLOSED, triggerId: TR_FINAL_CLOSE },
      { id: 'l7', eventId: EV_FINAL_CLOSED, triggerId: TR_MANAGER_CLOSE_MONTH },
    ];

    const scenarios: Scenario[] = [
      {
        id: 's1',
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
        id: 's2',
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
        id: 's3',
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
            id: 'd_income_approve',
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
            id: 'd_income_reject',
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
        id: 's4',
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
        id: 's5',
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
        id: 's6',
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
        id: 's7',
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
        id: 's8',
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
