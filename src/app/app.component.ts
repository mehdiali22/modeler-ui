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
    // 1) Process structure
    { label: 'Processes', route: '/catalogs/processes', icon: '🧭' },
    { label: 'SubProcesses', route: '/catalogs/sub-processes', icon: '🧩' },
    { label: 'Stages', route: '/catalogs/stages', icon: '🧱' },

    // 2) Domain model
    { label: 'Artifacts', route: '/catalogs/artifacts', icon: '📦' },
    { label: 'Facts', route: '/catalogs/facts', icon: '🧷' },
    { label: 'States', route: '/catalogs/states', icon: '📍' },

    // 3) Actors and executable catalog
    { label: 'Actors', route: '/catalogs/actors', icon: '👤' },
    { label: 'Actions', route: '/catalogs/actions', icon: '🛠️' },
    { label: 'Conditions', route: '/catalogs/conditions', icon: '⛳' },

    // 4) Workflow definition
    { label: 'Kartabls', route: '/catalogs/kartabls', icon: '🗂️' },
    { label: 'Scenarios', route: '/scenarios', icon: '🎬' },
    { label: 'Decisions', route: '/decisions', icon: '🔘' },
    { label: 'Routing Rules', route: '/kartabl-routing-rules', icon: '🔀' },
    { label: 'State Transitions', route: '/state-transitions', icon: '🔁' },

    // 5) Runtime
    { label: 'WorkItems', route: '/work-items', icon: '🧾' },
    { label: 'Kartabl Queue', route: '/kartabl-queue', icon: '📥' },
    { label: 'Action Outbox', route: '/action-outbox', icon: '📤' },

    // 6) Tools
    { label: 'Runtime Setup', route: '/tools/runtime-setup', icon: '🚀' },
    { label: 'Mermaid Export', route: '/tools/mermaid-export', icon: '🧜' },
    { label: 'Validation', route: '/tools/validation', icon: '✅' },
    { label: 'Import/Export', route: '/tools/io', icon: '📦' },

    // 7) Help
    { label: 'Help', route: '/help', icon: '❓' },
  ];
}
