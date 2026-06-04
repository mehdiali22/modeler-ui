import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

type HomeLink = {
  label: string;
  route: string;
  icon: string;
  description: string;
};

type HomeGroup = {
  title: string;
  subtitle: string;
  icon: string;
  links: HomeLink[];
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  groups: HomeGroup[] = [
    {
      title: 'Model Structure',
      subtitle: 'ساختار اصلی مدل از Process تا Scenario',
      icon: '🧭',
      links: [
        { label: 'Processes', route: '/catalogs/processes', icon: '🧭', description: 'فرایندهای کلان مدل' },
        { label: 'SubProcesses', route: '/catalogs/sub-processes', icon: '🧩', description: 'زیر‌فرایندهای هر Process' },
        { label: 'Stages', route: '/catalogs/stages', icon: '🧱', description: 'مرحله‌ها و ایستگاه‌های کاری' },
        { label: 'Scenarios', route: '/scenarios', icon: '🎬', description: 'سناریوهای کاری داخل Stage' },
      ],
    },
    {
      title: 'Entity Model',
      subtitle: 'موجودیت، فکت‌ها، وضعیت‌ها و شرط‌ها',
      icon: '📦',
      links: [
        { label: 'Artifacts', route: '/catalogs/artifacts', icon: '📦', description: 'موجودیت‌های مدل مثل Adm' },
        { label: 'Facts', route: '/catalogs/facts', icon: '🧷', description: 'فکت‌ها و داده‌های قابل ارزیابی' },
        { label: 'Conditions', route: '/catalogs/conditions', icon: '⛳', description: 'شرط‌های قابل استفاده در مدل' },
      ],
    },
    {
      title: 'Behavior',
      subtitle: 'اکشن، تصمیم و مسیرهای رفتاری',
      icon: '⚙️',
      links: [
        { label: 'Actions', route: '/catalogs/actions', icon: '🛠️', description: 'اکشن‌های کاربر یا سیستم' },
        { label: 'Decisions', route: '/decisions', icon: '🔘', description: 'نقطه تصمیم و گزینه‌ها' },
      ],
    },
    {
      title: 'Work Routing',
      subtitle: 'نقش‌ها، کارتابل‌ها و قواعد مسیردهی',
      icon: '🗂️',
      links: [
        { label: 'Roles', route: '/catalogs/actors', icon: '👤', description: 'نقش‌های کاری مدل' },
        { label: 'Kartabls', route: '/catalogs/kartabls', icon: '🗂️', description: 'کارتابل‌ها و صف‌های کاری' },
        { label: 'Kartabl Routing Rules', route: '/kartabl-routing-rules', icon: '🔀', description: 'قواعد انتقال بین کارتابل‌ها' },
      ],
    },
    {
      title: 'Runtime',
      subtitle: 'اجرای آزمایشی مدل و مشاهده صف‌ها',
      icon: '🚀',
      links: [
        { label: 'Runtime Setup', route: '/tools/runtime-setup', icon: '🚀', description: 'آماده‌سازی دیتای Runtime' },
        { label: 'WorkItems', route: '/work-items', icon: '🧾', description: 'نمونه‌های اجرایی پرونده‌ها' },
        { label: 'Kartabl Queue', route: '/kartabl-queue', icon: '📥', description: 'نمایش کارتابل‌ها و کارها' },
        { label: 'Action Outbox', route: '/action-outbox', icon: '📤', description: 'خروجی اکشن‌های در انتظار' },
      ],
    },
    {
      title: 'Tools',
      subtitle: 'ابزارهای خروجی، اعتبارسنجی و مدیریت داده',
      icon: '🧰',
      links: [
        { label: 'Mermaid Export', route: '/tools/mermaid-export', icon: '🧜', description: 'خروجی نمودار Mermaid' },
        { label: 'Validation', route: '/tools/validation', icon: '✅', description: 'اعتبارسنجی مدل' },
        { label: 'Import/Export', route: '/tools/io', icon: '📦', description: 'ورود و خروج داده‌ها' },
        { label: 'Help', route: '/help', icon: '❓', description: 'راهنمای استفاده' },
      ],
    },
  ];
}
