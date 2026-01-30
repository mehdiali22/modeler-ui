import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { Artifact } from '../../../core/types';
import { ArtifactApiService } from '../../../core/api/artifact-api.service';

type ArtifactDraft = {
  artifactKey: string;
  titleFa: string;
  description: string;
  isChildOfCase: boolean;
};

@Component({
  selector: 'app-artifacts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './artifacts.component.html',
  styleUrls: ['./artifacts.component.scss'],
})
export class ArtifactsComponent implements OnInit {
  rows: Artifact[] = [];
  editingId: number | null = null;
  error: string | null = null;

  draft: ArtifactDraft = this.newDraft();

  constructor(private api: ArtifactApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.error = null;
    this.api.list().subscribe({
      next: (rows) => {
        this.rows = rows ?? [];
      },
      error: (err: any) => {
        this.error = err?.message ?? 'خطا در ارتباط با API';
      },
    });
  }

  private newDraft(): ArtifactDraft {
    return { artifactKey: '', titleFa: '', description: '', isChildOfCase: false };
  }

  reset() {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
  }

  edit(r: Artifact) {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      artifactKey: r.artifactKey,
      titleFa: r.titleFa ?? '',
      description: r.description ?? '',
      isChildOfCase: r.isChildOfCase ?? false,
    };
  }

  remove(r: Artifact) {
    this.error = null;
    this.api.delete(r.id).subscribe({
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

    const artifactKey = (this.draft.artifactKey || '').trim();
    if (!artifactKey) {
      this.error = 'ArtifactKey اجباری است.';
      return;
    }

    const dup = this.rows.find(
      (x) => x.artifactKey.toLowerCase() === artifactKey.toLowerCase() && x.id !== this.editingId,
    );
    if (dup) {
      this.error = 'ArtifactKey تکراری است.';
      return;
    }

    const payload: Omit<Artifact, 'id'> = {
      artifactKey,
      titleFa: (this.draft.titleFa || '').trim() || undefined,
      description: (this.draft.description || '').trim() || undefined,
      isChildOfCase: !!this.draft.isChildOfCase,
    };

    if (this.editingId !== null) {
      const id = this.editingId;
      this.api.update(id, payload).subscribe({
        next: (updated) => {
          this.rows = this.rows.map((r) => (r.id === id ? updated : r));
          this.reset();
        },
        error: (err: any) => {
          this.error = err?.message ?? 'خطا در ویرایش';
        },
      });
    } else {
      this.api.create(payload).subscribe({
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
}
