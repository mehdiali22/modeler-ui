import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CatalogStoreService } from '../../../core/catalog-store.service';

type OpenMode = 'row' | 'decision';

@Component({
  selector: 'app-open-entity',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './open-entity.component.html',
  styleUrls: ['./open-entity.component.scss'],
})
export class OpenEntityComponent
{
  col = '';
  id = '';
  decisionId = '';
  mode: OpenMode = 'row';

  title = '';
  error = '';
  jsonText = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: CatalogStoreService
  )
  {
    this.route.queryParamMap.subscribe(q =>
    {
      this.col = (q.get('col') ?? '').trim();
      this.id = (q.get('id') ?? '').trim();
      this.decisionId = (q.get('decisionId') ?? '').trim();
      this.mode = this.decisionId ? 'decision' : 'row';
      this.load();
    });
  }

  load()
  {
    this.error = '';
    this.title = '';
    this.jsonText = '';

    if (!this.col || !this.id)
    {
      this.error = 'پارامترهای col و id لازم است.';
      return;
    }

    const rows = this.store.list<any>(this.col);
    const idx = rows.findIndex(x => x?.id === this.id);
    if (idx < 0)
    {
      this.error = `موردی با id=${this.id} در collection=${this.col} پیدا نشد.`;
      return;
    }

    const row = rows[idx];

    // decision داخل scenario
    if (this.mode === 'decision')
    {
      const decisions = row?.decisions ?? [];
      const didx = decisions.findIndex((d: any) => d?.id === this.decisionId);
      if (didx < 0)
      {
        this.error = `Decision با id=${this.decisionId} داخل Scenario پیدا نشد.`;
        return;
      }
      const dec = decisions[didx];
      this.title = `Open Decision | scenarios/${this.id} :: ${dec?.decisionKey ?? dec?.id}`;
      this.jsonText = JSON.stringify(dec, null, 2);
      return;
    }

    // row مستقیم
    const key =
      row?.scenarioKey ?? row?.triggerKey ?? row?.eventKey ?? row?.conditionKey ?? row?.factKey ?? row?.actionKey ?? row?.id;

    this.title = `Open ${this.col} | ${key}`;
    this.jsonText = JSON.stringify(row, null, 2);
  }

  save()
  {
    this.error = '';
    if (!this.col || !this.id) return;

    let obj: any;
    try
    {
      obj = JSON.parse(this.jsonText);
    } catch
    {
      this.error = 'JSON نامعتبر است.';
      return;
    }

    const rows = this.store.list<any>(this.col);
    const idx = rows.findIndex(x => x?.id === this.id);
    if (idx < 0)
    {
      this.error = 'رکورد دیگر وجود ندارد.';
      return;
    }

    if (this.mode === 'decision')
    {
      const scenario = rows[idx];
      const decisions = [...(scenario?.decisions ?? [])];
      const didx = decisions.findIndex((d: any) => d?.id === this.decisionId);
      if (didx < 0)
      {
        this.error = 'Decision دیگر وجود ندارد.';
        return;
      }
      // id را خراب نکن
      obj.id = this.decisionId;
      decisions[didx] = obj;
      scenario.decisions = decisions;
      rows[idx] = scenario;
      this.store.save(this.col, rows);
      this.load();
      return;
    }

    // row مستقیم
    obj.id = this.id; // id ثابت
    rows[idx] = obj;
    this.store.save(this.col, rows);
    this.load();
  }

  copy()
  {
    navigator.clipboard?.writeText(this.jsonText);
  }

  back()
  {
    this.router.navigateByUrl('/'); // اگر صفحه home داری
  }
}
