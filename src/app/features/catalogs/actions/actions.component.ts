import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CatalogStoreService } from '../../../core/catalog-store.service';
import { ActionDefinition, ActorDefinition, Artifact } from '../../../core/types';
import { SmartSelectComponent, SmartOption } from '../../../shared/smart-select/smart-select.component';

const COL_ACTIONS = 'actions';
const COL_ARTIFACTS = 'artifacts';
const COL_ACTORS = 'actors';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

@Component({
  selector: 'app-actions',
  standalone: true,
  imports: [CommonModule, SmartSelectComponent],
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.scss'],
})
export class ActionsComponent
{
  rows: ActionDefinition[] = [];
  artifacts: Artifact[] = [];
  actors: ActorDefinition[] = [];

  artifactOptions: SmartOption[] = [];
  actorOptions: SmartOption[] = [];

  q = '';
  editingId: string | null = null;
  edit: any = null;

  constructor(private store: CatalogStoreService)
  {
    this.reload();
  }

  reload()
  {
    this.rows = this.store.list<ActionDefinition>(COL_ACTIONS);
    this.artifacts = this.store.list<Artifact>(COL_ARTIFACTS);
    this.actors = this.store.list<ActorDefinition>(COL_ACTORS);

    this.artifactOptions = this.artifacts.map(a => ({ id: a.id, text: a.artifactKey, sub: a.titleFa }));
    this.actorOptions = this.actors.map(a => ({ id: a.id, text: a.actorKey, sub: a.titleFa }));
  }

  get filtered()
  {
    const q = this.q.trim().toLowerCase();
    if (!q) return this.rows;
    return this.rows.filter(r =>
      (r.actionKey + ' ' + (r.titleFa ?? '')).toLowerCase().includes(q)
    );
  }

  add()
  {
    const r: any = {
      id: uid(),
      actionKey: 'NEW_ACTION',
      titleFa: 'اکشن جدید',
      targetArtifactId: this.artifacts[0]?.id ?? '',
      executorKind: 'System',
      executorActorId: '',
      defaultParamsJson: '',
    };
    this.rows = [r, ...this.rows];
    this.store.save(COL_ACTIONS, this.rows);
    this.editRow(r.id);
  }

  editRow(id: string)
  {
    this.editingId = id;
    const src = this.rows.find(x => x.id === id);
    this.edit = src ? structuredClone(src as any) : null;
  }

  cancel()
  {
    this.editingId = null;
    this.edit = null;
  }

  save()
  {
    if (!this.edit) return;

    // sanitize
    this.edit.actionKey = (this.edit.actionKey ?? '').trim();
    this.edit.titleFa = (this.edit.titleFa ?? '').trim();
    this.edit.defaultParamsJson = (this.edit.defaultParamsJson ?? '').trim();

    if (this.edit.executorKind !== 'Human') this.edit.executorActorId = '';

    const idx = this.rows.findIndex(x => x.id === this.edit.id);
    if (idx >= 0)
    {
      this.rows[idx] = this.edit;
      this.store.save(COL_ACTIONS, this.rows);
      this.cancel();
    }
  }

  remove(id: string)
  {
    this.rows = this.rows.filter(x => x.id !== id);
    this.store.save(COL_ACTIONS, this.rows);
    if (this.editingId === id) this.cancel();
  }
}
