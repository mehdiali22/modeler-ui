import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Artifact } from '../../../core/types';
import { CatalogStoreService } from '../../../core/catalog-store.service';

const COL = 'artifacts';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

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
export class ArtifactsComponent
{
  rows: Artifact[] = [];
  editingId: string | null = null;

  draft: ArtifactDraft = this.newDraft();
  error: string | null = null;

  constructor(private store: CatalogStoreService)
  {
    // init in constructor ✅
    this.rows = this.store.list<Artifact>(COL);
  }

  private newDraft(): ArtifactDraft
  {
    return {
      artifactKey: '',
      titleFa: '',
      description: '',
      isChildOfCase: false,
    };
  }

  reset()
  {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
  }

  edit(r: Artifact)
  {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      artifactKey: r.artifactKey,
      titleFa: r.titleFa ?? '',
      description: r.description ?? '',
      isChildOfCase: !!r.isChildOfCase,
    };
  }

  remove(r: Artifact)
  {
    this.rows = this.rows.filter(x => x.id !== r.id);
    this.store.save(COL, this.rows);
    if (this.editingId === r.id) this.reset();
  }

  submit()
  {
    this.error = null;

    const payload: Omit<Artifact, 'id'> = {
      artifactKey: (this.draft.artifactKey || '').trim(),
      titleFa: (this.draft.titleFa || '').trim() || undefined,
      description: (this.draft.description || '').trim() || undefined,
      isChildOfCase: !!this.draft.isChildOfCase,
    };

    if (!payload.artifactKey)
    {
      this.error = 'ArtifactKey اجباری است.';
      return;
    }

    // Unique ArtifactKey
    const dup = this.rows.find(x =>
      x.artifactKey.toLowerCase() === payload.artifactKey.toLowerCase() &&
      x.id !== this.editingId
    );
    if (dup)
    {
      this.error = 'ArtifactKey تکراری است.';
      return;
    }

    if (this.editingId)
    {
      this.rows = this.rows.map(r => r.id === this.editingId ? ({ ...r, ...payload }) : r);
    } else
    {
      this.rows = [{ id: uid(), ...payload }, ...this.rows];
    }

    this.store.save(COL, this.rows);
    this.reset();
  }
}
