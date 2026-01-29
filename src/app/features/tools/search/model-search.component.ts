import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CatalogStoreService } from '../../../core/catalog-store.service';

const COLS = [
  'processes',
  'stages',
  'artifacts',
  'facts',
  'conditions',
  'actors',
  'actions',
  'triggers',
  'events',
  'scenarios',
  'eventTriggerLinks',
] as const;

type ColName = typeof COLS[number];

type OpenRef = { col: string; id: string; decisionId?: string };

type Hit = {
  col: ColName | 'scenarioDecision';
  id: string;
  decisionId?: string;
  key: string;
  field: string;
  snippet: string;
  open: OpenRef;
};

function safeStr(v: any): string
{
  if (v == null) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

function excerpt(text: string, idx: number, qLen: number, radius = 60)
{
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + qLen + radius);
  const head = start > 0 ? '…' : '';
  const tail = end < text.length ? '…' : '';
  return head + text.slice(start, end) + tail;
}

@Component({
  selector: 'app-model-search',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './model-search.component.html',
  styleUrls: ['./model-search.component.scss'],
})
export class ModelSearchComponent
{
  // UI state
  q = '';
  col: '' | ColName | 'scenarioDecision' = '';
  includeJson = true;
  includeDecisions = true;
  limit = 200;

  // data cache
  private data = new Map<ColName, any[]>();

  // results
  hits: Hit[] = [];

  constructor(private store: CatalogStoreService)
  {
    this.reload();
    this.search();
  }

  reload()
  {
    this.data.clear();
    for (const c of COLS) this.data.set(c, this.store.list<any>(c));
  }

  search()
  {
    const q = this.q.trim().toLowerCase();
    const lim = Math.max(10, Math.min(1000, Number(this.limit) || 200));

    if (!q)
    {
      this.hits = [];
      return;
    }

    const wantCol = this.col;

    const hits: Hit[] = [];

    const addHit = (h: Hit) =>
    {
      if (hits.length >= lim) return;
      hits.push(h);
    };

    const scanObjFields = (col: ColName, row: any) =>
    {
      const id = row?.id;
      if (!id) return;

      // فیلدهای مهم هر ردیف را اولویت بده
      const candidates: Array<[string, any]> = [
        ['key', row?.processKey ?? row?.stageKey ?? row?.artifactKey ?? row?.factKey ?? row?.conditionKey ?? row?.actorKey ?? row?.actionKey ?? row?.triggerKey ?? row?.eventKey ?? row?.scenarioKey ?? ''],
        ['titleFa', row?.titleFa ?? ''],
        ['description', row?.description ?? ''],
        ['expression', row?.expression ?? ''],
        ['uiActionKey', row?.uiActionKey ?? ''],
      ];

      for (const [field, val] of candidates)
      {
        const s = safeStr(val);
        const idx = s.toLowerCase().indexOf(q);
        if (idx >= 0)
        {
          addHit({
            col,
            id,
            key: (row?.processKey ?? row?.stageKey ?? row?.artifactKey ?? row?.factKey ?? row?.conditionKey ?? row?.actorKey ?? row?.actionKey ?? row?.triggerKey ?? row?.eventKey ?? row?.scenarioKey ?? row?.id) + '',
            field,
            snippet: excerpt(s, idx, q.length),
            open: { col, id },
          });
          if (hits.length >= lim) return;
        }
      }

      if (!this.includeJson) return;

      const full = safeStr(row);
      const idx = full.toLowerCase().indexOf(q);
      if (idx >= 0)
      {
        addHit({
          col,
          id,
          key: (row?.processKey ?? row?.stageKey ?? row?.artifactKey ?? row?.factKey ?? row?.conditionKey ?? row?.actorKey ?? row?.actionKey ?? row?.triggerKey ?? row?.eventKey ?? row?.scenarioKey ?? row?.id) + '',
          field: 'json',
          snippet: excerpt(full, idx, q.length),
          open: { col, id },
        });
      }
    };

    // 1) scan regular collections
    for (const c of COLS)
    {
      if (wantCol && wantCol !== c) continue;
      //if (wantCol === 'scenarioDecision') continue;

      const rows = this.data.get(c) ?? [];
      for (const r of rows)
      {
        scanObjFields(c, r);
        if (hits.length >= lim) break;
      }
      if (hits.length >= lim) break;
    }

    // 2) scan scenario decisions
    if ((wantCol === '' || wantCol === 'scenarioDecision') && this.includeDecisions)
    {
      const scenarios = this.data.get('scenarios') ?? [];
      for (const s of scenarios)
      {
        if (hits.length >= lim) break;

        const sid = s?.id;
        const skey = (s?.scenarioKey ?? sid) + '';
        const decisions: any[] = s?.decisions ?? [];

        for (const d of decisions)
        {
          if (hits.length >= lim) break;
          const did = d?.id;
          if (!sid || !did) continue;

          const dkey = (d?.decisionKey ?? did) + '';
          const pack = {
            scenarioKey: skey,
            decisionKey: dkey,
            titleFa: d?.titleFa ?? '',
            uiActionKey: d?.uiActionKey ?? '',
            conditionIds: d?.conditionIds ?? [],
            producedEventIds: d?.producedEventIds ?? [],
            actions: d?.actions ?? [],
            factChanges: d?.factChanges ?? [],
          };

          // اول رو فیلدهای کلیدی
          const fields: Array<[string, any]> = [
            ['scenarioKey', skey],
            ['decisionKey', dkey],
            ['titleFa', d?.titleFa ?? ''],
            ['uiActionKey', d?.uiActionKey ?? ''],
          ];

          let matched = false;

          for (const [field, val] of fields)
          {
            const s2 = safeStr(val);
            const idx = s2.toLowerCase().indexOf(q);
            if (idx >= 0)
            {
              addHit({
                col: 'scenarioDecision',
                id: sid,
                decisionId: did,
                key: `${skey} :: ${dkey}`,
                field,
                snippet: excerpt(s2, idx, q.length),
                open: { col: 'scenarios', id: sid, decisionId: did },
              });
              matched = true;
              break;
            }
          }

          if (!matched && this.includeJson)
          {
            const full = safeStr(pack);
            const idx = full.toLowerCase().indexOf(q);
            if (idx >= 0)
            {
              addHit({
                col: 'scenarioDecision',
                id: sid,
                decisionId: did,
                key: `${skey} :: ${dkey}`,
                field: 'json',
                snippet: excerpt(full, idx, q.length),
                open: { col: 'scenarios', id: sid, decisionId: did },
              });
            }
          }
        }
      }
    }

    this.hits = hits;
  }

  copyResults()
  {
    const text = this.hits
      .map(h => `${h.col}\t${h.key}\t${h.field}\t${h.snippet}`)
      .join('\n');
    navigator.clipboard?.writeText(text);
  }
}
