import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CatalogStoreService } from '../../../core/catalog-store.service';
import { ActorDefinition, ExecutorKind } from '../../../core/types';

const COL = 'actors';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

type ActorDraft = {
  actorKey: string;
  titleFa: string;
  kind: ExecutorKind;
  description: string;
};

@Component({
  selector: 'app-actors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './actors.component.html',
  styleUrls: ['./actors.component.scss'],
})
export class ActorsComponent
{
  rows: ActorDefinition[] = [];
  editingId: string | null = null;
  error: string | null = null;

  kinds: { id: ExecutorKind; title: string }[] = [
    { id: 'Human', title: 'Human' },
    { id: 'System', title: 'System' },
  ];

  draft: ActorDraft = this.newDraft();

  constructor(private store: CatalogStoreService)
  {
    this.rows = this.store.list<ActorDefinition>(COL);
  }

  private newDraft(): ActorDraft
  {
    return { actorKey: '', titleFa: '', kind: 'Human', description: '' };
  }

  reset()
  {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
  }

  edit(r: ActorDefinition)
  {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      actorKey: r.actorKey,
      titleFa: r.titleFa ?? '',
      kind: (r.kind ?? 'Human') as ExecutorKind,
      description: r.description ?? '',
    };
  }

  remove(r: ActorDefinition)
  {
    this.rows = this.rows.filter(x => x.id !== r.id);
    this.store.save(COL, this.rows);
    if (this.editingId === r.id) this.reset();
  }

  submit()
  {
    this.error = null;

    const actorKey = (this.draft.actorKey || '').trim();
    if (!actorKey) { this.error = 'ActorKey اجباری است.'; return; }

    const dup = this.rows.find(x =>
      x.actorKey.toLowerCase() === actorKey.toLowerCase() &&
      x.id !== this.editingId
    );
    if (dup) { this.error = 'ActorKey تکراری است.'; return; }

    const payload: Omit<ActorDefinition, 'id'> = {
      actorKey,
      titleFa: (this.draft.titleFa || '').trim() || undefined,
      kind: this.draft.kind,
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
