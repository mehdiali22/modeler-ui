import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { ModelerFlowLink } from '../../core/types';
import { ModelerFlowLinkApiService } from '../../core/api/modeler-flow-link-api.service';

@Component({
  selector: 'app-flow-links',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flow-links.component.html',
  styleUrls: ['./flow-links.component.scss'],
})
export class FlowLinksComponent implements OnInit {
  rows: ModelerFlowLink[] = [];
  error: string | null = null;
  isLoading = false;

  constructor(private api: ModelerFlowLinkApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.error = null;
    this.api.list().subscribe({
      next: rows => { this.rows = rows; this.isLoading = false; },
      error: err => { this.error = err?.message ?? 'خطا در خواندن Flow Links'; this.isLoading = false; },
    });
  }
}
