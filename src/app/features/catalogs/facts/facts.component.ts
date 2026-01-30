import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { forkJoin } from 'rxjs';

import { Artifact, Fact, FactValueType } from '../../../core/types';
import { ArtifactApiService } from '../../../core/api/artifact-api.service';
import { FactApiService } from '../../../core/api/fact-api.service';

type FactDraft = {
  artifactId: number;
  factKey: string;
  valueType: FactValueType;
  meaning: string;
};

@Component({
  selector: 'app-facts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facts.component.html',
  styleUrls: ['./facts.component.scss'],
})
export class FactsComponent implements OnInit {
  artifacts: Artifact[] = [];
  rows: Fact[] = [];

  editingId: number | null = null;
  error: string | null = null;

  valueTypes = [
    { id: FactValueType.String, title: 'String' },
    { id: FactValueType.Int, title: 'Int' },
    { id: FactValueType.Decimal, title: 'Decimal' },
    { id: FactValueType.Bool, title: 'Bool' },
    { id: FactValueType.DateTime, title: 'DateTime' },
    { id: FactValueType.Enum, title: 'Enum' },
    { id: FactValueType.Month, title: 'Month' },
  ];

  draft: FactDraft = this.newDraft();

  constructor(private factsApi: FactApiService, private artifactsApi: ArtifactApiService) {}

  ngOnInit(): void {
    this.load();
  }

  private newDraft(): FactDraft {
    return {
      artifactId: 0,
      factKey: '',
      valueType: FactValueType.String,
      meaning: '',
    };
  }

  load() {
    this.error = null;
    forkJoin({
      artifacts: this.artifactsApi.list(),
      facts: this.factsApi.list(),
    }).subscribe({
      next: (res) => {
        this.artifacts = res.artifacts ?? [];
        this.rows = res.facts ?? [];
        this.reset();
      },
      error: (err: any) => {
        this.error = err?.message ?? 'خطا در ارتباط با API';
      },
    });
  }

  get filtered(): Fact[] {
    // اگر تو HTML search داری، اینجا وصلش کن. فعلاً همون rows.
    return this.rows;
  }

  reset() {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
    if (this.artifacts.length) this.draft.artifactId = this.artifacts[0].id;
  }

  edit(r: Fact) {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      artifactId: r.artifactId,
      factKey: r.factKey,
      valueType: r.valueType,
      meaning: r.meaning ?? '',
    };
  }

  remove(r: Fact) {
    this.error = null;
    this.factsApi.delete(r.id).subscribe({
      next: () => {
        this.rows = this.rows.filter((x) => x.id !== r.id);
        if (this.editingId === r.id) this.reset();
      },
      error: (err: any) => {
        this.error = err?.message ?? 'خطا در حذف';
      },
    });
  }

  submit() {
    this.error = null;

    const artifactId = this.draft.artifactId;
    const factKey = (this.draft.factKey || '').trim();
    if (!artifactId) {
      this.error = 'Artifact اجباری است.';
      return;
    }
    if (!factKey) {
      this.error = 'FactKey اجباری است.';
      return;
    }

    const payload: Omit<Fact, 'id'> = {
      artifactId,
      factKey,
      valueType: this.draft.valueType,
      meaning: (this.draft.meaning || '').trim() || undefined,
    };

    if (this.editingId !== null) {
      const id = this.editingId;
      this.factsApi.update(id, payload).subscribe({
        next: (updated) => {
          this.rows = this.rows.map((r) => (r.id === id ? updated : r));
          this.reset();
        },
        error: (err: any) => {
          this.error = err?.message ?? 'خطا در ویرایش';
        },
      });
    } else {
      this.factsApi.create(payload).subscribe({
        next: (created) => {
          this.rows = [created, ...this.rows];
          this.reset();
        },
        error: (err: any) => {
          this.error = err?.message ?? 'خطا در ایجاد';
        },
      });
    }
  }

  artifactTitle(artifactId: number): string {
    return this.artifacts.find((a) => a.id === artifactId)?.artifactKey ?? '—';
  }

  valueTypeTitle(vt: FactValueType): string {
    return this.valueTypes.find((x) => x.id === vt)?.title ?? String(vt);
  }
}
