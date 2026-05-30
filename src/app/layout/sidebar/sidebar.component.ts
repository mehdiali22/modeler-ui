import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

export type NavLinkItem = {
  type?: 'link';
  label: string;
  icon?: string;
  route: string;
};

export type NavItem = {
  type?: 'link' | 'group';
  label: string;
  icon?: string;
  route?: string;
  children?: NavLinkItem[];
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input({ required: true }) items: NavItem[] = [];

  isGroup(item: NavItem): boolean {
    return item.type === 'group';
  }
}
