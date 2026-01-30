import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { ToolsApiService } from '../../../core/api/tools-api.service';
import { ToastService } from '../../../core/toast.service';
import { Condition, Fact, Scenario } from '../../../core/types';

type ExportEnvelope = { exportedAt?: string; cols?: Record<string, unknown> } | Record<string, unknown>;

function nowIso() {
  return new Date().toISOString();
}

function getCols(raw: ExportEnvelope): Record<string, unknown> {
  const asObj = (raw ?? {}) as Record<string, unknown>;
  const cols = (asObj as { cols?: unknown }).cols;
  return (cols && typeof cols === 'object') ? (cols as Record<string, unknown>) : asObj;
}

function errMessage(err: unknown): string {
  if (!err) return 'unknown';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') return (err as any).message;
  try { return JSON.stringify(err); } catch { return 'unknown'; }
}

function uniqNums(ids: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const id of ids ?? []) {
    if (typeof id !== 'number') continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

@Component({
  selector: 'app-bulk-tools',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-tools.component.html',
  styleUrls: ['./bulk-tools.component.scss'],
})
export class BulkToolsComponent {
  // UI
  oldUiActionKey = '';
  newUiActionKey = '';

  oldFactKey = '';
  newFactKey = '';

  log: string[] = [];
  busy = false;

  constructor(
    private toolsApi: ToolsApiService,
    private toast: ToastService,
  ) {}

  private pushLog(s: string) {
    this.log.unshift(`[${new Date().toLocaleTimeString()}] ${s}`);
  }

  private saveCols(cols: Record<string, unknown>) {
    // keep wrapper shape the backend already supports
    // We send the full snapshot back, so overwrite is a safe default.
    return this.toolsApi.import({ exportedAt: nowIso(), cols }, 'overwrite');
  }

  normalizeAll() {
    if (this.busy) return;
    this.busy = true;
    this.toolsApi.export().subscribe({
      next: (raw: ExportEnvelope) => {
        const cols = getCols(raw);
        const facts: Fact[] = (cols['facts'] ?? []) as Fact[];
        const conditions: Condition[] = (cols['conditions'] ?? []) as Condition[];
        const scenarios: Scenario[] = (cols['scenarios'] ?? []) as Scenario[];

        const factKeyToId = new Map<string, number>();
        for (const f of facts) {
          if (f?.factKey && typeof f.id === 'number') {
            factKeyToId.set(f.factKey, f.id);
          }
        }

        // facts
        for (const f of facts) {
          f.factKey = (f.factKey ?? '').trim();
          f.meaning = (f.meaning ?? '').trim() || undefined;
        }

        // conditions: trim + best-effort derive factIdsUsed from expression
        for (const c of conditions) {
          c.conditionKey = (c.conditionKey ?? '').trim();
          c.titleFa = (c.titleFa ?? '').trim() || undefined;
          // In our model, expression is required => always keep a string
          c.expression = (c.expression ?? '').trim();

          const expr = c.expression;
          if (expr && (!c.factIdsUsed || c.factIdsUsed.length === 0)) {
            const used = new Set<number>();
            for (const [k, id] of factKeyToId.entries()) {
              if (!k) continue;
              if (expr.includes(k)) used.add(id);
            }
            c.factIdsUsed = [...used];
          } else {
            c.factIdsUsed = uniqNums(c.factIdsUsed ?? []);
          }
        }

        // scenarios: dedup id arrays
        for (const s of scenarios as any[]) {
          s.preconditionIds = uniqNums(s.preconditionIds ?? []);
          s.producedEventIds = uniqNums(s.producedEventIds ?? []);
          s.actions = s.actions ?? [];
          s.factChanges = s.factChanges ?? [];
          s.decisions = s.decisions ?? [];
          for (const d of (s.decisions ?? []) as any[]) {
            d.conditionIds = uniqNums(d.conditionIds ?? []);
            d.producedEventIds = uniqNums(d.producedEventIds ?? []);
            d.actions = d.actions ?? [];
            d.factChanges = d.factChanges ?? [];
            d.uiActionKey = (d.uiActionKey ?? '').trim() || undefined;
          }
        }

        const newCols = { ...cols, facts, conditions, scenarios };
        this.saveCols(newCols).subscribe({
          next: () => {
            this.pushLog('Normalize: saved.');
            this.toast?.success('Normalize: saved');
            this.busy = false;
          },
          error: (err: unknown) => {
            this.pushLog(`Normalize: failed (${errMessage(err)})`);
            this.toast?.error('Normalize: failed');
            this.busy = false;
          },
        });
      },
      error: (err: unknown) => {
        this.pushLog(`Export failed (${errMessage(err)})`);
        this.toast?.error('Export failed');
        this.busy = false;
      },
    });
  }

  renameUiActionKey() {
    const oldKey = (this.oldUiActionKey ?? '').trim();
    const newKey = (this.newUiActionKey ?? '').trim();
    if (!oldKey || !newKey) {
      this.toast?.warn('old/new uiActionKey required');
      return;
    }

    if (this.busy) return;
    this.busy = true;

    this.toolsApi.export().subscribe({
      next: (raw: ExportEnvelope) => {
        const cols = getCols(raw);
        const scenarios: Scenario[] = (cols['scenarios'] ?? []) as Scenario[];

        let changed = 0;
        for (const s of scenarios as any[]) {
          for (const d of (s.decisions ?? []) as any[]) {
            if ((d.uiActionKey ?? '') === oldKey) {
              d.uiActionKey = newKey;
              changed++;
            }
          }
        }

        const newCols = { ...cols, scenarios };
        this.saveCols(newCols).subscribe({
          next: () => {
            this.pushLog(`Renamed uiActionKey: ${oldKey} → ${newKey} (count=${changed})`);
            this.toast?.success('Saved');
            this.busy = false;
          },
          error: (err: unknown) => {
            this.pushLog(`Save failed (${errMessage(err)})`);
            this.toast?.error('Save failed');
            this.busy = false;
          },
        });
      },
      error: (err: unknown) => {
        this.pushLog(`Export failed (${errMessage(err)})`);
        this.toast?.error('Export failed');
        this.busy = false;
      },
    });
  }

  renameFactKey() {
    const oldKey = (this.oldFactKey ?? '').trim();
    const newKey = (this.newFactKey ?? '').trim();
    if (!oldKey || !newKey) {
      this.toast?.warn('old/new factKey required');
      return;
    }

    if (this.busy) return;
    this.busy = true;

    this.toolsApi.export().subscribe({
      next: (raw: ExportEnvelope) => {
        const cols = getCols(raw);
        const facts: Fact[] = (cols['facts'] ?? []) as Fact[];
        const conditions: Condition[] = (cols['conditions'] ?? []) as Condition[];

        let factChanged = 0;
        for (const f of facts) {
          if ((f.factKey ?? '') === oldKey) {
            f.factKey = newKey;
            factChanged++;
          }
        }

        let condChanged = 0;
        for (const c of conditions) {
          if (c.expression && c.expression.includes(oldKey)) {
            c.expression = c.expression.split(oldKey).join(newKey);
            condChanged++;
          }
        }

        const newCols = { ...cols, facts, conditions };
        this.saveCols(newCols).subscribe({
          next: () => {
            this.pushLog(`Renamed factKey: ${oldKey} → ${newKey} (facts=${factChanged}, conds=${condChanged})`);
            this.toast?.success('Saved');
            this.busy = false;
          },
          error: (err: unknown) => {
            this.pushLog(`Save failed (${errMessage(err)})`);
            this.toast?.error('Save failed');
            this.busy = false;
          },
        });
      },
      error: (err: unknown) => {
        this.pushLog(`Export failed (${errMessage(err)})`);
        this.toast?.error('Export failed');
        this.busy = false;
      },
    });
  }
}
