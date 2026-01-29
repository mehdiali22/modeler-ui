import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CatalogStoreService } from '../../../core/catalog-store.service';
import { EventDefinition } from '../../../core/types';

const COL = 'events';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

type EventDraft = {
  eventKey: string;
  titleFa: string;
  description: string;
};

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent
{
  rows: EventDefinition[] = [];
  editingId: string | null = null;
  error: string | null = null;

  draft: EventDraft = this.newDraft();

  constructor(private store: CatalogStoreService)
  {
    this.rows = this.store.list<EventDefinition>(COL);
  }

  private newDraft(): EventDraft
  {
    return { eventKey: '', titleFa: '', description: '' };
  }

  reset()
  {
    this.editingId = null;
    this.error = null;
    this.draft = this.newDraft();
  }

  edit(r: EventDefinition)
  {
    this.editingId = r.id;
    this.error = null;
    this.draft = {
      eventKey: r.eventKey,
      titleFa: r.titleFa ?? '',
      description: r.description ?? '',
    };
  }

  remove(r: EventDefinition)
  {
    this.rows = this.rows.filter(x => x.id !== r.id);
    this.store.save(COL, this.rows);
    if (this.editingId === r.id) this.reset();
  }

  submit()
  {
    this.error = null;

    const eventKey = (this.draft.eventKey || '').trim();
    if (!eventKey) { this.error = 'EventKey اجباری است.'; return; }

    const dup = this.rows.find(x =>
      x.eventKey.toLowerCase() === eventKey.toLowerCase() &&
      x.id !== this.editingId
    );
    if (dup) { this.error = 'EventKey تکراری است.'; return; }

    const payload: Omit<EventDefinition, 'id'> = {
      eventKey,
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
