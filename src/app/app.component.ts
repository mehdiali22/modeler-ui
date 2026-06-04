import { Component } from '@angular/core';
import { ShellComponent } from './layout/shell/shell.component';
import { NavItem } from './layout/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent],
  template: `<app-shell [appTitle]="appTitle" [navItems]="navItems"></app-shell>`,
})
export class AppComponent {
  appTitle = 'Modeler V3';

  navItems: NavItem[] = [
    { label: 'Home', route: '/home', icon: '🏠' },
    {
      type: 'group',
      label: 'Model Structure',
      icon: '🧭',
      children: [
        { label: 'Processes', route: '/catalogs/processes', icon: '🧭' },
        { label: 'SubProcesses', route: '/catalogs/sub-processes', icon: '🧩' },
        { label: 'Stages', route: '/catalogs/stages', icon: '🧱' },
        { label: 'Scenarios', route: '/scenarios', icon: '🎬' },
      ],
    },
    {
      type: 'group',
      label: 'Entity Model',
      icon: '📦',
      children: [
        { label: 'Artifacts', route: '/catalogs/artifacts', icon: '📦' },
        { label: 'Facts', route: '/catalogs/facts', icon: '🧷' },
        { label: 'Conditions', route: '/catalogs/conditions', icon: '⛳' },
      ],
    },
    {
      type: 'group',
      label: 'Behavior',
      icon: '⚙️',
      children: [
        { label: 'Actions', route: '/catalogs/actions', icon: '🛠️' },
        { label: 'Decisions', route: '/decisions', icon: '🔘' },
      ],
    },
    {
      type: 'group',
      label: 'Work Routing',
      icon: '🗂️',
      children: [
        { label: 'Roles', route: '/catalogs/actors', icon: '👤' },
        { label: 'Kartabls', route: '/catalogs/kartabls', icon: '🗂️' },
        { label: 'Kartabl Routing Rules', route: '/kartabl-routing-rules', icon: '🔀' },
      ],
    },
    {
      type: 'group',
      label: 'Runtime',
      icon: '🚀',
      children: [
        { label: 'Runtime Setup', route: '/tools/runtime-setup', icon: '🚀' },
        { label: 'WorkItems', route: '/work-items', icon: '🧾' },
        { label: 'Kartabl Queue', route: '/kartabl-queue', icon: '📥' },
        { label: 'Action Outbox', route: '/action-outbox', icon: '📤' },
      ],
    },
    {
      type: 'group',
      label: 'Tools',
      icon: '🧰',
      children: [
        { label: 'Mermaid Export', route: '/tools/mermaid-export', icon: '🧜' },
        { label: 'Validation', route: '/tools/validation', icon: '✅' },
        { label: 'Import/Export', route: '/tools/io', icon: '📦' },
        { label: 'Help', route: '/help', icon: '❓' },
      ],
    },
  ];
}
