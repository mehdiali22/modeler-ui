import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent, NavItem } from '../sidebar/sidebar.component';
import { ToastHostComponent } from '../../shared/toast-host/toast-host.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterModule, SidebarComponent, ToastHostComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent
{
  @Input() appTitle = 'RasaBiz.UI';
  @Input() navItems: NavItem[] = [];
}
