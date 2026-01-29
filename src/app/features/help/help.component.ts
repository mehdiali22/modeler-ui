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
      key: 'catalogs',
      title: 'Catalogs',
      icon: '📚',
      items: [
        { icon: '📦', label: 'Artifacts', route: '/catalogs/artifacts', desc: 'Catalog خروجی‌ها/محصولات مدل؛ برای UI/گزارش/فرآیند.', tags: ['catalog', 'artifact'] },
        { icon: '🧷', label: 'Facts', route: '/catalogs/facts', desc: 'کلیدهای داده‌ای و stateهایی که Conditionها و Scenarioها مصرف/تولید می‌کنند.', tags: ['catalog', 'fact', 'state'] },
        { icon: '⛳', label: 'Conditions', route: '/catalogs/conditions', desc: 'پیش‌شرط‌ها (Gate) و محاسبات (Formula) برای تولید Fact/DerivedState.', tags: ['catalog', 'gate', 'formula'] },
        { icon: '🛠️', label: 'Actions', route: '/catalogs/actions', desc: 'Catalog عمل‌ها؛ Scenario/Decision این‌ها را اجرا می‌کند (با paramsJson).', tags: ['catalog', 'action'] },
        { icon: '🧭', label: 'Processes', route: '/catalogs/processes', desc: 'جریان‌های سطح بالا؛ سازماندهی stageها و سناریوها در یک process.', tags: ['catalog', 'process'] },
        { icon: '🧱', label: 'Stages', route: '/catalogs/stages', desc: 'مرحله‌های کاری (Stage) که Scenarioها معمولاً به آن‌ها وابسته‌اند.', tags: ['catalog', 'stage'] },
      ],
    },
    {
      key: 'views',
      title: 'Views',
      icon: '🧠',
      items: [
        { icon: '🎬', label: 'Scenarios', route: '/scenarios', desc: 'هسته مدل: Trigger→Logic→Produced Events + Decisions (شاخه‌های UI/Condition).', tags: ['scenario', 'decision'] },
        { icon: '🧩', label: 'Explorer', route: '/explorer', desc: 'نمای اکتشافی روابط و dependencyها بین اجزا (Trigger/Scenario/Event/...).', tags: ['graph', 'explore'] },
        { icon: '🧱', label: 'Stage Board', route: '/stage-board', desc: 'نمای بورد (کانبان) براساس Stage برای دیدن توزیع سناریوها/گام‌ها.', tags: ['board', 'stage'] },
        { icon: '🧮', label: 'Matrix', route: '/matrix', desc: 'نمای ماتریسی پوشش و ارتباطات (Scenario×Stage / Trigger×Scenario / ...).', tags: ['matrix', 'coverage'] },
        { icon: '🧭', label: 'Flow', route: '/flow', desc: 'نمای زنجیره Trigger→Scenario→Event برای فهم traversal و dependencyها.', tags: ['flow', 'chain'] },
        { icon: '🧭', label: 'Flow v2', route: '/flow-v2', desc: 'Flow پیشرفته با stage filter، depth، maxPaths و loop detection.', tags: ['flow', 'loop'] },
      ],
    },
    {
      key: 'tools',
      title: 'Tools',
      icon: '🧰',
      items: [
        { icon: '🔘', label: 'UI Bindings', route: '/tools/ui-bindings', desc: 'اتصال uiActionKey دکمه‌های UI به Decisionهای سناریو (mapping).', tags: ['tools', 'ui'] },
        { icon: '✅', label: 'Validation', route: '/tools/validation', desc: 'اعتبارسنجی مدل و پیدا کردن خطاهای ساختاری/ارجاع‌های نامعتبر.', tags: ['tools', 'validate'] },
        { icon: '🔎', label: 'Search', route: '/tools/search', desc: 'جستجوی سراسری در کل مدل (کلیدها، عنوان‌ها، idها).', tags: ['tools', 'search'] },
        { icon: '📦', label: 'Import/Export', route: '/tools/import-export', desc: 'خروجی/ورودی JSON مدل. (بهتره یکی از /tools/io یا این را نگه داری).', tags: ['tools', 'io'] },
        { icon: '🌱', label: 'Seed', route: '/seed', desc: 'ساخت داده نمونه/ریست برای تست سریع UI و مدل.', tags: ['tools', 'seed'] },
      ],
    },
  ];

  concepts: Concept[] = [
    {
      key: 'scenario',
      title: 'Scenario',
      icon: '🎬',
      chips: ['Scenario', 'Trigger', 'Event'],
      lines: [
        'به‌جای “Rule” از “Scenario” استفاده می‌کنیم.',
        'هر Scenario با Trigger شروع می‌شود، منطق بیزنسی را اجرا می‌کند و در پایان Event تولید می‌کند.',
        'Event فقط Outcome/Fact را بیان می‌کند؛ Subscriber تصمیم می‌گیرد چه کار کند (زنجیره‌سازی Event→Trigger).',
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
        'هر Decision معمولاً: conditionIds + uiActionKey + actions + producedEventIds دارد.',
        'uiActionKey همان کلید دکمه‌ی UI است که در صفحه UI Bindings به Decision مپ می‌شود.',
      ],
    },
    {
      key: 'contexts',
      title: 'Main Contexts',
      icon: '🧩',
      chips: ['Case', 'Monthly Performance', 'Settlement', 'Payment/Disbursement'],
      lines: [
        'Case/Parvande: از XML تا نهایی شدن پرونده.',
        'Monthly Performance/Settlement: پس از نهایی شدن پرونده‌ها و تجمیع ماهانه.',
        'Payment/Disbursement: زیرمجموعه Settlement و چندمرحله‌ای.',
      ],
    },
    {
      key: 'ksr',
      title: 'KSR Modeling Notes',
      icon: '🧾',
      chips: ['KSR Execution', 'KSR Definition/Policy'],
      lines: [
        'KSR به‌علت پیچیدگی جدا مدل می‌شود.',
        'KSR Execution داخل Case Context می‌ماند.',
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
