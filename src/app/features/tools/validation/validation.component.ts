import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ToolsApiService } from '../../../core/api/tools-api.service';
import { ValidationIssue } from '../../../core/types';

type Level = 'error' | 'warn';
type IssueVm = {
  level: Level;
  scope: string;
  refKey: string;
  message: string;
};

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './validation.component.html',
  styleUrls: ['./validation.component.scss'],
})
export class ValidationComponent {
  issues: IssueVm[] = [];
  level: '' | Level = '';
  q = '';
  error: string | null = null;
  isLoading = false;

  constructor(private toolsApi: ToolsApiService) { this.run(); }

  run() {
    this.error = null;
    this.isLoading = true;
    this.toolsApi.validate().subscribe({
      next: rows => {
        this.issues = (rows ?? []).map(x => this.toVm(x));
        this.isLoading = false;
      },
      error: err => {
        this.error = err?.message ?? 'خطا در اجرای validate از API';
        this.isLoading = false;
      },
    });
  }

  get filtered(): IssueVm[] {
    const q = this.q.trim().toLowerCase();
    return this.issues.filter(i => {
      if (this.level && i.level !== this.level) return false;
      if (!q) return true;
      return `${i.level} ${i.scope} ${i.refKey} ${i.message}`.toLowerCase().includes(q);
    });
  }

  private toVm(x: ValidationIssue): IssueVm {
    const raw = x.message ?? '';
    const level: Level = raw.toLowerCase().includes('warn') ? 'warn' : 'error';
    return {
      level,
      scope: x.entity ?? 'Unknown',
      refKey: x.entityId == null ? '—' : String(x.entityId),
      message: raw,
    };
  }
}
