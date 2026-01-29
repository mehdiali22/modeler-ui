import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CatalogStoreService } from '../../../core/catalog-store.service';
import { TriggerDefinition } from '../../../core/types';

const COL = 'triggers';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

type TriggerDraft = {
  triggerKey: string;
  titleFa: string;
  description: string;
};

@Component({
  selector: 'app-triggers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './triggers.component.html',
  styleUrls: ['./triggers.component.scss'],
})
export class TriggersComponent
{
  rows: TriggerDefinition[] = [];
  editingId: string | null = null;
  error: string | null = null;

  draft: TriggerDraft = this.newDraft();

  constructor(private store: CatalogStoreService)
  {
    this.rows = this.store.list<TriggerDefinition>(COL);
  }

  private newDraft(): TriggerDraft
  {
    return { triggerKey: '', titleFa: '', description: '' };
  }

  reset()
  {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
  }

  edit(r: TriggerDefinition)
  {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      triggerKey: r.triggerKey,
      titleFa: r.titleFa ?? '',
      description: r.description ?? '',
    };
  }

  remove(r: TriggerDefinition)
  {
    this.rows = this.rows.filter(x => x.id !== r.id);
    this.store.save(COL, this.rows);
    if (this.editingId === r.id) this.reset();
  }

  submit()
  {
    this.error = null;

    const triggerKey = (this.draft.triggerKey || '').trim();
    if (!triggerKey) { this.error = 'TriggerKey اجباری است.'; return; }

    const dup = this.rows.find(x =>
      x.triggerKey.toLowerCase() === triggerKey.toLowerCase() &&
      x.id !== this.editingId
    );
    if (dup) { this.error = 'TriggerKey تکراری است.'; return; }

    const payload: Omit<TriggerDefinition, 'id'> = {
      triggerKey,
      titleFa: (this.draft.titleFa || '').trim() || undefined,
      description: (this.draft.description || '').trim() || undefined,
    };

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
