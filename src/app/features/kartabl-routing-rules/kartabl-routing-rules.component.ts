import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Kartabl, KartablRoutingRule } from '../../core/types';
import { KartablApiService } from '../../core/api/kartabl-api.service';
import { KartablRoutingRuleApiService } from '../../core/api/kartabl-routing-rule-api.service';
import { SmartSelectComponent, SmartOption } from '../../shared/smart-select/smart-select.component';

type Draft = { ruleKey: string; titleFa: string; ownerSubdomain: string; priority: string; fromKartablId: number | null; targetKartablId: number | null; conditionIdsJson: string; description: string };

@Component({ selector: 'app-kartabl-routing-rules', standalone: true, imports: [CommonModule, SmartSelectComponent], templateUrl: './kartabl-routing-rules.component.html', styleUrls: ['./kartabl-routing-rules.component.scss'] })
export class KartablRoutingRulesComponent implements OnInit {
  rows: KartablRoutingRule[] = [];
  kartabls: Kartabl[] = [];
  kartablOptions: SmartOption[] = [];
  editingId: number | null = null;
  error: string | null = null;
  draft: Draft = this.emptyDraft();

  constructor(private api: KartablRoutingRuleApiService, private kartablApi: KartablApiService) {}
  ngOnInit(): void { this.load(); }

  emptyDraft(): Draft { return { ruleKey: '', titleFa: '', ownerSubdomain: '', priority: '100', fromKartablId: null, targetKartablId: null, conditionIdsJson: '[]', description: '' }; }
  load() {
    this.error = null;
    forkJoin({ rows: this.api.list(), kartabls: this.kartablApi.list() }).subscribe({
      next: res => { this.rows = res.rows ?? []; this.kartabls = res.kartabls ?? []; this.kartablOptions = this.kartabls.map(k => ({ id: k.id, text: k.kartablKey, sub: k.titleFa ?? '' })); },
      error: err => this.error = err?.message ?? 'خطا در ارتباط با API',
    });
  }
  reset() { this.editingId = null; this.draft = this.emptyDraft(); this.error = null; }
  title(id: number | null | undefined) { if (!id) return '—'; const k = this.kartabls.find(x => x.id === id); return k ? `${k.kartablKey}${k.titleFa ? ' — ' + k.titleFa : ''}` : String(id); }
  edit(r: KartablRoutingRule) { this.editingId = r.id; this.draft = { ruleKey: r.ruleKey, titleFa: r.titleFa ?? '', ownerSubdomain: r.ownerSubdomain ?? '', priority: String(r.priority ?? 100), fromKartablId: r.fromKartablId ?? null, targetKartablId: r.targetKartablId ?? null, conditionIdsJson: r.conditionIdsJson || '[]', description: r.description ?? '' }; }
  submit() {
    this.error = null;
    const ruleKey = this.draft.ruleKey.trim();
    const priority = Number(this.draft.priority || 0);
    if (!ruleKey) { this.error = 'RuleKey اجباری است.'; return; }
    if (Number.isNaN(priority)) { this.error = 'Priority باید عدد باشد.'; return; }
    if (!this.draft.targetKartablId) { this.error = 'TargetKartablId اجباری است.'; return; }
    try { JSON.parse(this.draft.conditionIdsJson || '[]'); } catch { this.error = 'ConditionIdsJson باید JSON معتبر باشد، مثلا [1,2]'; return; }
    const payload: Omit<KartablRoutingRule, 'id'> = { ruleKey, titleFa: this.draft.titleFa.trim() || undefined, ownerSubdomain: this.draft.ownerSubdomain.trim() || undefined, priority, fromKartablId: this.draft.fromKartablId || null, targetKartablId: this.draft.targetKartablId, conditionIdsJson: this.draft.conditionIdsJson || '[]', description: this.draft.description.trim() || undefined };
    const req = this.editingId == null ? this.api.create(payload) : this.api.update(this.editingId, payload);
    req.subscribe({ next: saved => { if (this.editingId == null) this.rows = [saved, ...this.rows]; else this.rows = this.rows.map(x => x.id === saved.id ? saved : x); this.reset(); }, error: err => this.error = err?.message ?? 'خطا در ذخیره' });
  }
  remove(r: KartablRoutingRule) { this.api.delete(r.id).subscribe({ next: () => { this.rows = this.rows.filter(x => x.id !== r.id); if (this.editingId === r.id) this.reset(); }, error: err => this.error = err?.message ?? 'خطا در حذف' }); }
}
