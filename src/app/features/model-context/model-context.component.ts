import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModelContextService } from '../../core/model-context.service';

@Component({
  selector: 'app-model-context',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './model-context.component.html',
  styleUrls: ['./model-context.component.scss'],
})
export class ModelContextComponent
{
  current: any = null; // بهتره نوع دقیقش رو بذاری
  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private ctx: ModelContextService,
    private router: Router
  )
  {
    this.form = this.fb.group({
      projectName: ['Rasa Modeler', [Validators.required, Validators.maxLength(200)]],
      versionName: ['v3', [Validators.required, Validators.maxLength(100)]],
    });

    this.current = this.ctx.current;
  }

  save()
  {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const projectName = this.form.value.projectName!.trim();
    const versionName = this.form.value.versionName!.trim();

    this.ctx.set({ projectName, versionName });
    this.current = this.ctx.current;

    this.router.navigateByUrl('/catalogs/artifacts');
  }

  clear()
  {
    this.ctx.clear();
    this.current = this.ctx.current; // یا null، بسته به رفتار ctx.clear()
  }
}
