import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Artifact, Fact, FactValueType } from '../../../core/types';
import { CatalogStoreService } from '../../../core/catalog-store.service';

const COL_FACTS = 'facts';
const COL_ARTIFACTS = 'artifacts';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

type FactDraft = {
  artifactId: string;
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
export class FactsComponent
{
  artifacts: Artifact[] = [];
  rows: Fact[] = [];
  editingId: string | null = null;

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
  error: string | null = null;

  constructor(private store: CatalogStoreService)
  {
    this.artifacts = this.store.list<Artifact>(COL_ARTIFACTS);
    this.rows = this.store.list<Fact>(COL_FACTS);

    // default artifact
    if (this.artifacts.length)
    {
      this.draft.artifactId = this.artifacts[0].id;
    }
  }

  private newDraft(): FactDraft
  {
    return {
      artifactId: '',
      factKey: '',
      valueType: FactValueType.String,
      meaning: '',
    };
  }

  reset()
  {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
    if (this.artifacts.length) this.draft.artifactId = this.artifacts[0].id;
  }

  edit(r: Fact)
  {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      artifactId: r.artifactId,
      factKey: r.factKey,
      valueType: r.valueType,
      meaning: r.meaning ?? '',
    };
  }

  remove(r: Fact)
  {
    this.rows = this.rows.filter(x => x.id !== r.id);
    this.store.save(COL_FACTS, this.rows);
    if (this.editingId === r.id) this.reset();
  }

  submit()
  {
    this.error = null;

    const payload: Omit<Fact, 'id'> = {
      artifactId: this.draft.artifactId,
      factKey: (this.draft.factKey || '').trim(),
      valueType: this.draft.valueType,
      meaning: (this.draft.meaning || '').trim() || undefined,
    };

    if (!payload.artifactId)
    {
      this.error = 'Artifact را انتخاب کن.';
      return;
    }

    if (!payload.factKey)
    {
      this.error = 'FactKey اجباری است.';
      return;
    }

    // Artifact must exist
    if (!this.artifacts.some(a => a.id === payload.artifactId))
    {
      this.error = 'Artifact انتخاب‌شده معتبر نیست.';
      return;
    }

    // Unique FactKey (case-insensitive)
    const dup = this.rows.find(x =>
      x.factKey.toLowerCase() === payload.factKey.toLowerCase() &&
      x.id !== this.editingId
    );
    if (dup)
    {
      this.error = 'FactKey تکراری است.';
      return;
    }

    if (this.editingId)
    {
      this.rows = this.rows.map(r => r.id === this.editingId ? ({ ...r, ...payload }) : r);
    } else
    {
      this.rows = [{ id: uid(), ...payload }, ...this.rows];
    }

    this.store.save(COL_FACTS, this.rows);
    this.reset();
  }

  artifactTitle(artifactId: string): string
  {
    return this.artifacts.find(a => a.id === artifactId)?.artifactKey ?? '—';
  }

  valueTypeTitle(vt: FactValueType): string
  {
    return this.valueTypes.find(x => x.id === vt)?.title ?? String(vt);
  }
}
