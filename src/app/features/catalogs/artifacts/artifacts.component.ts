import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Artifact } from '../../../core/types';
import { ModelContextService } from '../../../core/model-context.service';
import { VersionedStoreService } from '../../../core/versioned-store.service';

const COL = 'artifacts';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

// اگر نوع ctx رو داری، اینو با همون replace کن
type ModelContext = { projectName: string; versionName: string };

@Component({
  selector: 'app-artifacts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './artifacts.component.html',
  styleUrls: ['./artifacts.component.scss'],
})
export class ArtifactsComponent
{
  ctx: ModelContext | null = null;
  rows: Artifact[] = [];
  editingId: string | null = null;

  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private ctxService: ModelContextService,
    private store: VersionedStoreService,
    private router: Router
  )
  {
    alert()

    // 1) فرم را بساز
    this.form = this.fb.group({
      artifactKey: ['', [Validators.required, Validators.maxLength(100)]],
      titleFa: ['', [Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(2000)]],
      isChildOfCase: [false],
    });


    // 2) ctx را بگیر
    this.ctx = (this.ctxService.current as ModelContext | null);

    // 3) اگر ctx نداریم، برو model و ادامه نده
    if (!this.ctx)
    {
      // بهتره navigate رو async کنیم تا وسط init به مشکل نخوره
      queueMicrotask(() => this.router.navigateByUrl('/model'));
      return;
    }

    // 4) فقط وقتی ctx معتبره از store بخون
    this.rows = this.store.list<Artifact>(this.ctx, COL) ?? [];
  }

  submit()
  {
    const ctx = this.ctx;
    if (!ctx)
    {
      this.router.navigateByUrl('/model');
      return;
    }

    if (this.form.invalid)
    {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;

    const artifactKey = (v.artifactKey ?? '').trim();
    if (!artifactKey) return;

    const payload: Omit<Artifact, 'id'> = {
      artifactKey,
      titleFa: (v.titleFa ?? '').trim() || undefined,
      description: (v.description ?? '').trim() || undefined,
      isChildOfCase: !!v.isChildOfCase,
    };

    // enforce unique ArtifactKey (per version)
    const dup = this.rows.find(x =>
      x.artifactKey.toLowerCase() === payload.artifactKey.toLowerCase() &&
      x.id !== this.editingId
    );
    if (dup) return;

    if (this.editingId)
    {
      this.rows = this.rows.map(r =>
        r.id === this.editingId ? ({ ...r, ...payload }) : r
      );
    } else
    {
      this.rows = [{ id: uid(), ...payload }, ...this.rows];
    }

    // فقط وقتی ctx معتبره save کن
    this.store.save(ctx, COL, this.rows);

    this.reset();
  }

  edit(r: Artifact)
  {
    this.editingId = r.id;
    this.form.setValue({
      artifactKey: r.artifactKey,
      titleFa: r.titleFa ?? '',
      description: r.description ?? '',
      isChildOfCase: r.isChildOfCase,
    });
  }

  remove(r: Artifact)
  {
    const ctx = this.ctx;
    if (!ctx)
    {
      this.router.navigateByUrl('/model');
      return;
    }

    this.rows = this.rows.filter(x => x.id !== r.id);
    this.store.save(ctx, COL, this.rows);

    if (this.editingId === r.id) this.reset();
  }

  reset()
  {
    this.editingId = null;
    this.form.reset({
      artifactKey: '',
      titleFa: '',
      description: '',
      isChildOfCase: false,
    });
  }
}
