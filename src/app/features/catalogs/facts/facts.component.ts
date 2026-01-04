import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Artifact, Fact, FactValueType, ModelContext } from '../../../core/types';
import { ModelContextService } from '../../../core/model-context.service';
import { VersionedStoreService } from '../../../core/versioned-store.service';

const COL_FACTS = 'facts';
const COL_ARTIFACTS = 'artifacts';

function uid()
{
  return crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

@Component({
  selector: 'app-facts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './facts.component.html',
  styleUrls: ['./facts.component.scss'],
})
export class FactsComponent
{
  ctx!: ModelContext;

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

  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private ctxService: ModelContextService,
    private store: VersionedStoreService,
    private router: Router
  )
  {
    // ✅ form باید اینجا ساخته بشه
    this.form = this.fb.group({
      artifactId: ['', [Validators.required]],
      factKey: ['', [Validators.required, Validators.maxLength(150)]],
      valueType: [FactValueType.String, [Validators.required]],
      meaning: ['', [Validators.maxLength(2000)]],
    });

    const ctx = this.ctxService.current;
    if (!ctx)
    {
      queueMicrotask(() => this.router.navigateByUrl('/model'));
      return;
    }
    this.ctx = ctx;

    this.artifacts = this.store.list<Artifact>(this.ctx, COL_ARTIFACTS) ?? [];
    this.rows = this.store.list<Fact>(this.ctx, COL_FACTS) ?? [];

    // اگر هیچ artifact نداریم، صفحه Fact عملاً بی‌معنیه
    if (this.artifacts.length && !this.form.value.artifactId)
    {
      this.form.patchValue({ artifactId: this.artifacts[0].id });
    }
  }

  submit()
  {
    if (!this.ctx)
    {
      this.router.navigateByUrl('/model');
      return;
    }

    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;

    const payload: Omit<Fact, 'id'> = {
      artifactId: (v.artifactId ?? '').toString(),
      factKey: (v.factKey ?? '').trim(),
      valueType: Number(v.valueType) as FactValueType,
      meaning: (v.meaning ?? '').trim() || undefined,
    };

    if (!payload.artifactId) return;
    if (!payload.factKey) return;

    // Unique FactKey per version
    const dup = this.rows.find((x: Fact) =>
      x.factKey.toLowerCase() === payload.factKey.toLowerCase() &&
      x.id !== this.editingId
    );
    if (dup) return;

    // Artifact must exist
    if (!this.artifacts.some((a: Artifact) => a.id === payload.artifactId)) return;

    if (this.editingId)
    {
      this.rows = this.rows.map((r: Fact) =>
        r.id === this.editingId ? ({ ...r, ...payload }) : r
      );
    } else
    {
      this.rows = [{ id: uid(), ...payload }, ...this.rows];
    }

    this.store.save(this.ctx, COL_FACTS, this.rows);
    this.reset();
  }

  edit(r: Fact)
  {
    this.editingId = r.id;
    this.form.setValue({
      artifactId: r.artifactId,
      factKey: r.factKey,
      valueType: r.valueType,
      meaning: r.meaning ?? '',
    });
  }

  remove(r: Fact)
  {
    if (!this.ctx) return;
    this.rows = this.rows.filter((x: Fact) => x.id !== r.id);
    this.store.save(this.ctx, COL_FACTS, this.rows);
    if (this.editingId === r.id) this.reset();
  }

  reset()
  {
    this.editingId = null;
    this.form.reset({
      artifactId: this.artifacts[0]?.id ?? '',
      factKey: '',
      valueType: FactValueType.String,
      meaning: '',
    });
  }

  artifactTitle(artifactId: string): string
  {
    const a = this.artifacts.find((x: Artifact) => x.id === artifactId);
    return a?.artifactKey ?? '—';
  }
}
