import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent, NavItem } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterModule, SidebarComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent
{
  @Input() appTitle = 'RasaBiz.UI';
  @Input() navItems: NavItem[] = [];
}
