import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type HelpItem = {
  icon: string;
  label: string;
  route: string;
  desc: string;
  tags?: string[];
};

type HelpGroup = {
  key: string;
  title: string;
  icon: string;
  items: HelpItem[];
};

type Concept = {
  key: string;
  title: string;
  icon: string;
  lines: string[];
  chips?: string[];
};

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
})
export class HelpComponent
{
  q = '';

  groups: HelpGroup[] = [
    {
      key: 'runtime',
      title: 'Runtime',
      icon: '⚙️',
      items: [
        { icon: '📥', label: 'Kartabl Queue', route: '/kartabl-queue', desc: 'صف WorkItemها در هر کارتابل و اجرای Scenario روی پرونده.', tags: ['kartabl', 'queue', 'workitem'] },
        { icon: '🧾', label: 'WorkItems', route: '/work-items', desc: 'ساخت و ویرایش پرونده‌های runtime و FactsJson.', tags: ['workitem', 'facts'] },
        { icon: '📤', label: 'Action Outbox', route: '/action-outbox', desc: 'صف Actionهای ثبت‌شده برای اجرای بیرونی یا دستی.', tags: ['outbox', 'action'] },
      ],
    },
    {
      key: 'modeling',
      title: 'Modeling',
      icon: '📚',
      items: [
        { icon: '🧭', label: 'Processes', route: '/catalogs/processes', desc: 'فرایندهای سطح بالا.', tags: ['process'] },
        { icon: '🧩', label: 'SubProcesses', route: '/catalogs/sub-processes', desc: 'زیرفرایندهای هر Process برای شکستن مدل به بخش‌های مفهومی.', tags: ['subprocess'] },
        { icon: '🧱', label: 'Stages', route: '/catalogs/stages', desc: 'مرحله‌های کاری داخل Process/SubProcess.', tags: ['stage'] },
        { icon: '🗂️', label: 'Kartabls', route: '/catalogs/kartabls', desc: 'صف‌های کاری Actorها.', tags: ['kartabl'] },
        { icon: '🔀', label: 'Routing Rules', route: '/kartabl-routing-rules', desc: 'قواعد انتقال WorkItem بین کارتابل‌ها بر اساس Fact و Condition.', tags: ['routing'] },
        { icon: '🎬', label: 'Scenarios', route: '/scenarios', desc: 'عملیات قابل اجرا روی WorkItem که Factها را تغییر می‌دهد.', tags: ['scenario'] },
        { icon: '🔘', label: 'Decisions', route: '/decisions', desc: 'گزینه‌ها و شاخه‌های تصمیم داخل Scenario.', tags: ['decision'] },
      ],
    },
    {
      key: 'catalogs',
      title: 'Catalogs',
      icon: '📦',
      items: [
        { icon: '📦', label: 'Artifacts', route: '/catalogs/artifacts', desc: 'موجودیت‌ها و خروجی‌های مدل؛ مثل Adm.', tags: ['artifact'] },
        { icon: '🧷', label: 'Facts', route: '/catalogs/facts', desc: 'داده‌ها و stateهایی که Conditionها و Scenarioها مصرف/تولید می‌کنند.', tags: ['fact', 'state'] },
        { icon: '⛳', label: 'Conditions', route: '/catalogs/conditions', desc: 'پیش‌شرط‌ها و Gateهای اجرای Scenario یا RoutingRule.', tags: ['condition'] },
        { icon: '🛠️', label: 'Actions', route: '/catalogs/actions', desc: 'Catalog عمل‌ها با executorActor و targetArtifact.', tags: ['action'] },
        { icon: '👤', label: 'Actors', route: '/catalogs/actors', desc: 'نقش‌های انسانی یا سیستمی اجراکننده Actionها.', tags: ['actor'] },
      ],
    },
    {
      key: 'tools',
      title: 'Tools',
      icon: '🧰',
      items: [
        { icon: '✅', label: 'Validation', route: '/tools/validation', desc: 'اعتبارسنجی مدل از API.', tags: ['validate'] },
        { icon: '📦', label: 'Import/Export', route: '/tools/io', desc: 'ورودی/خروجی JSON مدل.', tags: ['io'] },
        { icon: '🚀', label: 'Runtime Setup', route: '/tools/runtime-setup', desc: 'راه‌اندازی حداقل دیتای لازم برای تست Runtime.', tags: ['setup'] },
      ],
    },
  ];

  concepts: Concept[] = [
    {
      key: 'scenario',
      title: 'Scenario',
      icon: '🎬',
      chips: ['Scenario', 'FactChanges', 'RoutingRule'],
      lines: [
        'به‌جای “Rule” از “Scenario” استفاده می‌کنیم.',
        'هر Scenario روی WorkItem اجرا می‌شود، Preconditions را چک می‌کند و FactChanges/Actions را اعمال می‌کند.',
        'بعد از تغییر Factها، KartablRoutingRule مسیر بعدی WorkItem را تعیین می‌کند.',
      ],
    },
    {
      key: 'condition',
      title: 'Condition / Gate / Formula',
      icon: '⛳',
      chips: ['Condition', 'Gate', 'Formula'],
      lines: [
        '“Condition” مفهوم اصلیِ پیش‌شرط/قابلیت انجام عمل است.',
        '“Gate” نوعی Condition است که خروجی‌اش Boolean است (اجازه/عدم اجازه).',
        '“Formula” زیرمجموعه‌ای از Condition برای محاسبات عددی/ارزشی و تولید Fact/DerivedState است.',
      ],
    },
    {
      key: 'decision',
      title: 'Decision',
      icon: '🔀',
      chips: ['Decision', 'uiActionKey'],
      lines: [
        'Decision شاخه‌های سناریو است (خصوصاً برای UI).',
        'هر Decision/Option معمولاً conditionIdsJson، actionIdsJson و factChanges دارد.',
        'Option برای مدل‌کردن انتخاب‌هایی مثل تایید، ابطال یا عودت استفاده می‌شود.',
      ],
    },
    {
      key: 'contexts',
      title: 'Main Contexts',
      icon: '🧩',
      chips: ['Adm', 'Daramad', 'BimehGar', 'Kartabl'],
      lines: [
        'Adm: پرونده الکترونیک پذیرش از XML تا خاتمه.',
        'Daramad: بررسی اولیه، تایید، ابطال یا انصراف از پذیرش.',
        'BimehGar/Moghavem: رسیدگی، تایید یا عودت پرونده.',
      ],
    },
    {
      key: 'ksr',
      title: 'KSR Modeling Notes',
      icon: '🧾',
      chips: ['KSR Execution', 'KSR Definition/Policy'],
      lines: [
        'KSR به‌علت پیچیدگی جدا مدل می‌شود.',
        'KSR Execution داخل Adm Context می‌ماند.',
        'KSR Definition/Policy (شرط/فرمول/نسخه‌ها) مدل/صفحات جدا دارد.',
        'Condition سناریو فقط Gate/پیش‌شرط مرحله است؛ Formula کسور داخل مدل KSR تعریف می‌شود و سناریو فقط از آن استفاده می‌کند.',
      ],
    },
    {
      key: 'ksrstates',
      title: 'KSR Summary States',
      icon: '🧱',
      chips: ['AutoKsrState', 'ManualKsrState', 'KsrGateState'],
      lines: [
        'AutoKsrState: NotCalculated / Calculated / Approved / Rejected',
        'ManualKsrState: None / Draft / Submitted / Finalized',
        'KsrGateState: Open / Ready / Blocked',
        'Ready وقتی است که AutoKsrState=Approved و ManualKsrState در {None, Finalized} باشد.',
        'مثال: تایید پرونده نیازمند TotalsValidated=true و KsrGateState=Ready است.',
      ],
    },
    {
      key: 'ownership',
      title: 'Ownership',
      icon: '🔒',
      chips: ['Lock', 'Owner'],
      lines: [
        '«باز کردن پرونده» و «شروع فعالیت» برای کاربر درآمد یکی هستند (یک دکمه).',
        'با کلیک، کاربر درآمد مالک رسیدگی اولیه پرونده می‌شود.',
        'سایر کاربران درآمد نمی‌توانند روی آن پرونده اقدام کنند تا وقتی مالکیت آزاد/برگردانده شود.',
      ],
    },
    {
      key: 'jamande',
      title: 'جامانده (Monthly Performance)',
      icon: '🗓️',
      chips: ['Lagging Cases', 'X+1'],
      lines: [
        'پس از بستن ماه‌عملکرد ماه X توسط مدیر بیمارستان:',
        'هر پرونده‌ای که بعداً آماده شود و ماه ترخیصش X یا قبل‌تر باشد، در ماه‌عملکرد ماه بعد (X+1) قرار می‌گیرد.',
        'این پرونده‌ها به عنوان «جامانده» شناخته می‌شوند.',
      ],
    },
  ];

  get filteredGroups(): HelpGroup[]
  {
    const q = (this.q || '').trim().toLowerCase();
    if (!q) return this.groups;

    const match = (it: HelpItem) =>
    {
      const hay = [it.label, it.route, it.desc, (it.tags || []).join(' ')].join(' ').toLowerCase();
      return hay.includes(q);
    };

    return this.groups
      .map(g => ({ ...g, items: g.items.filter(match) }))
      .filter(g => g.items.length > 0);
  }

  get filteredConcepts(): Concept[]
  {
    const q = (this.q || '').trim().toLowerCase();
    if (!q) return this.concepts;

    return this.concepts.filter(c =>
    {
      const hay = [c.title, (c.chips || []).join(' '), c.lines.join(' ')].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  get resultsCount(): number
  {
    const g = this.filteredGroups.reduce((sum, x) => sum + x.items.length, 0);
    const c = this.filteredConcepts.length;
    return g + c; // تقریبی برای نمایش
  }
}
