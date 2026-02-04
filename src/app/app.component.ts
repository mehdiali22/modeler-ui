import { Component } from '@angular/core';
import { ShellComponent } from './layout/shell/shell.component';
import { NavItem } from './layout/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent],
  template: `<app-shell [appTitle]="appTitle" [navItems]="navItems"></app-shell>`,
})
export class AppComponent
{
  appTitle = 'Modeler V3';

  navItems: NavItem[] = [
    { label: 'Processes', route: '/catalogs/processes', icon: '🧭' },
    { label: 'Artifacts', route: '/catalogs/artifacts', icon: '📦' },
    { label: 'Facts', route: '/catalogs/facts', icon: '🧷' },
    { label: 'Actions', route: '/catalogs/actions', icon: '🛠️' },
    { label: 'Actors', route: '/catalogs/actors', icon: '🛠️' },
    { label: 'Conditions', route: '/catalogs/conditions', icon: '⛳' },
    { label: 'Scenarios', route: '/scenarios', icon: '🎬' },
    { label: 'Stages', route: '/catalogs/stages', icon: '🧱' },

    { label: 'Stage Board', route: '/stage-board', icon: '🧱' },
    { label: 'Matrix', route: '/matrix', icon: '🧮' },

    
    { label: 'Decisions', route: '/decisions', icon: '🔘' },

    { label: 'Validation', route: '/tools/validation', icon: '✅' },
    { label: 'UI Bindings', route: '/tools/ui-bindings', icon: '🔘' },
    { label: 'Import/Export', route: '/tools/io', icon: '📦' },


    { label: 'Flow', route: '/flow', icon: '🧭' },
    { label: 'Flow v2', route: '/flow-v2', icon: '🧭' },
    { label: 'Explorer', route: '/explorer', icon: '🧩' },
    { label: 'Search', route: '/tools/search', icon: '🔎' },
    



    { label: 'Help', route: '/help', icon: '❓' },
    { label: 'Seed', route: '/seed', icon: '🌱' },
  ];
}
