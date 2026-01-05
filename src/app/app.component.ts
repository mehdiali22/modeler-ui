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
    { label: 'Artifacts', route: '/catalogs/artifacts', icon: '📦' },
    { label: 'Facts', route: '/catalogs/facts', icon: '🧷' },
    { label: 'Conditions', route: '/catalogs/conditions', icon: '⛳' },
    { label: 'Scenarios', route: '/scenarios', icon: '🎬' },
    { label: 'Processes', route: '/catalogs/processes', icon: '🧭' },
    { label: 'Stages', route: '/catalogs/stages', icon: '🧱' }, 


  ];
}


