import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Kartabl } from '../../../core/types';
import { KartablApiService } from '../../../core/api/kartabl-api.service';

type Draft = { kartablKey: string; titleFa: string; ownerSubdomain: string; description: string };

@Component({
  selector: 'app-kartabls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kartabls.component.html',
  styleUrls: ['./kartabls.component.scss'],
})
export class KartablsComponent implements OnInit {
  rows: Kartabl[] = [];
  editingId: number | null = null;
  error: string | null = null;
  draft: Draft = this.emptyDraft();

  constructor(private api: KartablApiService) {}

  ngOnInit(): void { this.load(); }

  load() {
    this.error = null;
    this.api.list().subscribe({
      next: rows => this.rows = rows ?? [],
      error: err => this.error = err?.message ?? 'خطا در ارتباط با API',
    });
  }

  emptyDraft(): Draft { return { kartablKey: '', titleFa: '', ownerSubdomain: '', description: '' }; }
  reset() { this.editingId = null; this.draft = this.emptyDraft(); this.error = null; }

  edit(r: Kartabl) {
    this.editingId = r.id;
    this.draft = {
      kartablKey: r.kartablKey,
      titleFa: r.titleFa ?? '',
      ownerSubdomain: r.ownerSubdomain ?? '',
      description: r.description ?? '',
    };
  }

  submit() {
    this.error = null;
    const kartablKey = this.draft.kartablKey.trim();
    if (!kartablKey) { this.error = 'KartablKey اجباری است.'; return; }

    const payload: Omit<Kartabl, 'id'> = {
      kartablKey,
      titleFa: this.draft.titleFa.trim() || undefined,
      ownerSubdomain: this.draft.ownerSubdomain.trim() || undefined,
      description: this.draft.description.trim() || undefined,
    };

    const req = this.editingId == null ? this.api.create(payload) : this.api.update(this.editingId, payload);
    req.subscribe({
      next: saved => {
        if (this.editingId == null) this.rows = [saved, ...this.rows];
        else this.rows = this.rows.map(x => x.id === saved.id ? saved : x);
        this.reset();
      },
      error: err => this.error = err?.message ?? 'خطا در ذخیره',
    });
  }

  remove(r: Kartabl) {
    this.error = null;
    this.api.delete(r.id).subscribe({
      next: () => { this.rows = this.rows.filter(x => x.id !== r.id); if (this.editingId === r.id) this.reset(); },
      error: err => this.error = err?.message ?? 'خطا در حذف',
    });
  }
}
