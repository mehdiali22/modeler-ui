import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActorDefinition, ExecutorKind } from '../../../core/types';
import { ActorApiService } from '../../../core/api/actor-api.service';

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
export class ActorsComponent implements OnInit
{
  rows: ActorDefinition[] = [];
  editingId: number | null = null;
  error: string | null = null;

  kinds: { id: ExecutorKind; title: string }[] = [
    { id: 'Human', title: 'Human' },
    { id: 'System', title: 'System' },
  ];

  draft: ActorDraft = this.newDraft();

  constructor(private api: ActorApiService) {}

  ngOnInit(): void
  {
    this.load();
  }

  load()
  {
    this.error = null;
    this.api.list().subscribe({
      next: rows => { this.rows = rows ?? []; },
      error: err => { this.error = (err?.message ?? 'خطا در ارتباط با API'); }
    });
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
    this.error = null;
    this.api.delete(r.id).subscribe({
      next: () => {
        this.rows = this.rows.filter(x => x.id !== r.id);
        if (this.editingId === r.id) this.reset();
      },
      error: err => { this.error = (err?.message ?? 'خطا در حذف'); }
    });
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

    if (this.editingId !== null)
    {
      const id = this.editingId;
      this.api.update(id, payload).subscribe({
        next: updated => {
          this.rows = this.rows.map(r => r.id === id ? updated : r);
          this.reset();
        },
        error: err => { this.error = (err?.message ?? 'خطا در ویرایش'); }
      });
    } else
    {
      this.api.create(payload).subscribe({
        next: created => {
          this.rows = [created, ...this.rows];
          this.reset();
        },
        error: err => { this.error = (err?.message ?? 'خطا در ایجاد'); }
      });
    }
  }
}
