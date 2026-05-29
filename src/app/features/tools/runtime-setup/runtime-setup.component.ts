import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin, of, switchMap } from 'rxjs';

import { Artifact, Fact, FactValueType, Kartabl } from '../../../core/types';
import { ArtifactApiService } from '../../../core/api/artifact-api.service';
import { FactApiService } from '../../../core/api/fact-api.service';
import { KartablApiService } from '../../../core/api/kartabl-api.service';

@Component({ selector: 'app-runtime-setup', standalone: true, imports: [CommonModule], templateUrl: './runtime-setup.component.html', styleUrls: ['./runtime-setup.component.scss'] })
export class RuntimeSetupComponent implements OnInit {
  artifacts: Artifact[] = [];
  facts: Fact[] = [];
  kartabls: Kartabl[] = [];
  error: string | null = null;
  message: string | null = null;
  busy = false;

  constructor(private artifactApi: ArtifactApiService, private factApi: FactApiService, private kartablApi: KartablApiService) {}
  ngOnInit(): void { this.reload(); }

  reload() {
    this.error = null;
    forkJoin({ artifacts: this.artifactApi.list(), facts: this.factApi.list(), kartabls: this.kartablApi.list() }).subscribe({
      next: r => { this.artifacts = r.artifacts ?? []; this.facts = r.facts ?? []; this.kartabls = r.kartabls ?? []; },
      error: err => this.error = err?.error ?? err?.message ?? 'خطا در دریافت وضعیت اولیه',
    });
  }

  hasFact(key: string): boolean { return this.facts.some(f => f.factKey.toLowerCase() === key.toLowerCase()); }
  get okFacts(): boolean { return this.hasFact('CaseStatus') && this.hasFact('CurrentKartablId'); }
  get hasCaseArtifact(): boolean { return this.artifacts.some(a => a.artifactKey.toLowerCase() === 'case'); }
  get hasKartabl(): boolean { return this.kartabls.length > 0; }

  createMinimum() {
    this.busy = true; this.error = null; this.message = null;
    const caseArtifact = this.artifacts.find(a => a.artifactKey.toLowerCase() === 'case');
    const ensureArtifact$ = caseArtifact ? of(caseArtifact) : this.artifactApi.create({ artifactKey: 'Case', titleFa: 'پرونده', description: 'Runtime case/work item artifact', isChildOfCase: false });

    ensureArtifact$.pipe(
      switchMap(artifact => {
        const jobs = [] as any[];
        if (!this.hasFact('CaseStatus')) jobs.push(this.factApi.create({ artifactId: artifact.id, factKey: 'CaseStatus', valueType: FactValueType.String, meaning: 'وضعیت فعلی پرونده' }));
        if (!this.hasFact('CurrentKartablId')) jobs.push(this.factApi.create({ artifactId: artifact.id, factKey: 'CurrentKartablId', valueType: FactValueType.Int, meaning: 'شناسه کارتابل فعلی پرونده' }));
        if (!this.kartabls.length) jobs.push(this.kartablApi.create({ kartablKey: 'income', titleFa: 'کارتابل درآمد', ownerSubdomain: 'case', description: 'کارتابل شروع تست Runtime' }));
        return jobs.length ? forkJoin(jobs) : of([]);
      })
    ).subscribe({
      next: () => { this.busy = false; this.message = 'حداقل داده‌های Runtime ساخته شد.'; this.reload(); },
      error: err => { this.busy = false; this.error = err?.error ?? err?.message ?? 'خطا در ساخت داده‌های پایه'; },
    });
  }
}
