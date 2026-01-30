import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActionDefinition, ActorDefinition, Artifact } from '../../../core/types';
import { ActionApiService } from '../../../core/api/action-api.service';
import { ArtifactApiService } from '../../../core/api/artifact-api.service';
import { ActorApiService } from '../../../core/api/actor-api.service';
import { forkJoin } from 'rxjs';
import { SmartSelectComponent, SmartOption } from '../../../shared/smart-select/smart-select.component';
@Component({
  selector: 'app-actions',
  standalone: true,
  imports: [CommonModule, SmartSelectComponent],
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.scss'],
})
export class ActionsComponent implements OnInit
{
  rows: ActionDefinition[] = [];
  artifacts: Artifact[] = [];
  actors: ActorDefinition[] = [];

  artifactOptions: SmartOption[] = [];
  actorOptions: SmartOption[] = [];


  error: string | null = null;
  q = '';
  editingId: number | null = null;
  edit: any = null;

  constructor(
    private actionsApi: ActionApiService,
    private artifactsApi: ArtifactApiService,
    private actorsApi: ActorApiService,
  ) {}


  ngOnInit(): void
  {
    this.load();
  }

load()
{
  this.error = null;
  forkJoin({
    actions: this.actionsApi.list(),
    artifacts: this.artifactsApi.list(),
    actors: this.actorsApi.list(),
  }).subscribe({
    next: res =>
    {
      this.rows = res.actions ?? [];
      this.artifacts = res.artifacts ?? [];
      this.actors = res.actors ?? [];
      this.rebuildOptions();},
    error: err => { this.error = (err?.message ?? 'خطا در ارتباط با API'); }
  });
}

private rebuildOptions()
{
  this.artifactOptions = (this.artifacts ?? []).map(a => ({
    id: a.id,
    text: a.artifactKey,
    sub: a.titleFa ?? '',
  }));

  this.actorOptions = (this.actors ?? []).map(a => ({
    id: a.id,
    text: a.actorKey,
    sub: a.titleFa ?? '',
  }));
}
reload()
  {
    this.load();
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
  this.error = null;
  const payload: Omit<ActionDefinition, 'id'> = {
    actionKey: 'NEW_ACTION',
    titleFa: 'اکشن جدید',
    targetArtifactId: this.artifacts[0]?.id,
    executorKind: 'System',
    executorActorId: undefined,
    defaultParamsJson: '',
  };

  this.actionsApi.create(payload).subscribe({
    next: created =>
    {
      this.rows = [created, ...this.rows];
      this.editRow(created.id);
    },
    error: err => { this.error = (err?.message ?? 'خطا در ایجاد'); }
  });
}


  editRow(id: number)
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

        if (this.edit.executorKind !== 'Human') this.edit.executorActorId = undefined;
    const id = this.edit.id as number;

const payload: Omit<ActionDefinition, 'id'> = {
  actionKey: this.edit.actionKey,
  titleFa: this.edit.titleFa,
  targetArtifactId: this.edit.targetArtifactId,
  executorKind: this.edit.executorKind,
  executorActorId: this.edit.executorActorId,
  description: this.edit.description,
  defaultParamsJson: this.edit.defaultParamsJson,
};

this.actionsApi.update(id, payload).subscribe({
  next: updated =>
  {
    const idx = this.rows.findIndex(x => x.id === id);
    if (idx >= 0) this.rows[idx] = updated;
    this.cancel();
  },
  error: err => { this.error = (err?.message ?? 'خطا در ویرایش'); }
});
  }

  remove(id: number)
{
  this.error = null;
  this.actionsApi.delete(id).subscribe({
    next: () =>
    {
      this.rows = this.rows.filter(x => x.id !== id);
      if (this.editingId === id) this.cancel();
    },
    error: err => { this.error = (err?.message ?? 'خطا در حذف'); }
  });
}

}
