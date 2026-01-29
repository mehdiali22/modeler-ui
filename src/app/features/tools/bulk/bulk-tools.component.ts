
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CatalogStoreService } from '../../../core/catalog-store.service';
import { ToastService } from '../../../core/toast.service';
import { Condition, Fact, Scenario } from '../../../core/types';

const COL_FACTS = 'facts';
const COL_CONDS = 'conditions';
const COL_SCENARIOS = 'scenarios';

function dedup(arr: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of arr) {
    const v = (x ?? '').trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function normStr(s: any) {
  return (s ?? '').toString().trim();
}

@Component({
  selector: 'app-bulk-tools',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-tools.component.html',
  styleUrls: ['./bulk-tools.component.scss'],
})
export class BulkToolsComponent {
  log: string[] = [];

  // Rename UI Action Key
  oldUiActionKey = '';
  newUiActionKey = '';

  // Rename FactKey (and replace in expressions)
  oldFactKey = '';
  newFactKey = '';

  constructor(
    private store: CatalogStoreService,
    private toast: ToastService
  ) {}

  private write(msg: string) {
    this.log = [msg, ...this.log];
  }

  // --------- Normalize ----------
  normalizeAll() {
    this.log = [];
    this.write('NORMALIZE START');

    const facts = this.store.list<Fact>(COL_FACTS);
    const conds = this.store.list<Condition>(COL_CONDS);
    const scenarios = this.store.list<Scenario>(COL_SCENARIOS);

    // map factKey -> factId (برای factIdsUsed)
    const factKeyToId = new Map<string, string>();
    for (const f of facts) {
      const k = normStr((f as any).factKey);
      if (k) factKeyToId.set(k, f.id);
    }
    const allFactKeys = [...factKeyToId.keys()];

    // 1) Facts: trim + ensure required arrays/fields (اگر چیزی داری)
    let factsChanged = 0;
    for (const f of facts as any[]) {
      const before = JSON.stringify(f);

      f.factKey = normStr(f.factKey);
      f.meaning = normStr(f.meaning);

      // اگر factIdsUsed style نداریم مهم نیست. اینجا فقط artifactId رو دست نمی‌زنیم.
      // اما اگر نبود، لاگ می‌کنیم:
      if (!f.artifactId) {
        this.write(`WARN Fact "${f.factKey || f.id}" missing artifactId`);
      }

      if (JSON.stringify(f) !== before) factsChanged++;
    }

    // 2) Conditions: trim + expression + factIdsUsed استخراج از expression + dedup
    let condsChanged = 0;
    for (const c of conds as any[]) {
      const before = JSON.stringify(c);

      c.conditionKey = normStr(c.conditionKey);
      c.titleFa = normStr(c.titleFa);
      c.expression = normStr(c.expression);

      c.factIdsUsed ??= [];

      // اگر factIdsUsed خالیه، از expression استخراج کن (V3-friendly)
      if (c.expression && (!c.factIdsUsed || c.factIdsUsed.length === 0)) {
        const usedIds: string[] = [];
        const expr = c.expression;

        for (const fk of allFactKeys) {
          // match ساده: شامل شدن factKey در string
          if (expr.includes(fk)) {
            const fid = factKeyToId.get(fk);
            if (fid) usedIds.push(fid);
          }
        }

        c.factIdsUsed = dedup(usedIds);
        if (c.factIdsUsed.length) {
          this.write(`SET factIdsUsed for Condition "${c.conditionKey}" = ${c.factIdsUsed.length}`);
        }
      } else {
        c.factIdsUsed = dedup(c.factIdsUsed);
      }

      if (JSON.stringify(c) !== before) condsChanged++;
    }

    // 3) Scenarios: ensure arrays + decisions defaults + dedup ids arrays + trim strings
    let scenariosChanged = 0;

    for (const s of scenarios as any[]) {
      const before = JSON.stringify(s);

      s.scenarioKey = normStr(s.scenarioKey);
      s.titleFa = normStr(s.titleFa);
      s.description = normStr(s.description);
      s.ownerSubdomain = normStr(s.ownerSubdomain);

      s.preconditionIds = dedup(s.preconditionIds ?? []);
      s.producedEventIds = dedup(s.producedEventIds ?? []);
      s.actions ??= [];
      s.factChanges ??= [];
      s.decisions ??= [];

      // decisions normalize
      for (const d of (s.decisions ?? [])) {
        d.decisionKey = normStr(d.decisionKey);
        d.titleFa = normStr(d.titleFa);
        d.uiActionKey = normStr(d.uiActionKey);

        d.conditionIds = dedup(d.conditionIds ?? []);
        d.producedEventIds = dedup(d.producedEventIds ?? []);
        d.actions ??= [];
        d.factChanges ??= [];
      }

      if (JSON.stringify(s) !== before) scenariosChanged++;
    }

    // Save
    this.store.save(COL_FACTS, facts);
    this.store.save(COL_CONDS, conds);
    this.store.save(COL_SCENARIOS, scenarios);

    this.write(`NORMALIZE DONE ✅ factsChanged=${factsChanged} condsChanged=${condsChanged} scenariosChanged=${scenariosChanged}`);
    this.toast.success('Normalize انجام شد');
  }

  // --------- Rename uiActionKey ----------
  renameUiActionKey() {
    const oldK = normStr(this.oldUiActionKey);
    const newK = normStr(this.newUiActionKey);

    if (!oldK || !newK) {
      this.toast.warn('old/new uiActionKey را پر کن');
      return;
    }

    const scenarios = this.store.list<Scenario>(COL_SCENARIOS) as any[];
    let count = 0;

    for (const s of scenarios) {
      for (const d of (s.decisions ?? [])) {
        if (normStr(d.uiActionKey) === oldK) {
          d.uiActionKey = newK;
          count++;
        }
      }
    }

    this.store.save(COL_SCENARIOS, scenarios);
    this.write(`RENAME uiActionKey "${oldK}" -> "${newK}" count=${count}`);
    this.toast.success(`uiActionKey تغییر کرد (${count})`);
  }

  // --------- Rename factKey + replace in expressions ----------
  renameFactKey() {
    const oldK = normStr(this.oldFactKey);
    const newK = normStr(this.newFactKey);

    if (!oldK || !newK) {
      this.toast.warn('old/new factKey را پر کن');
      return;
    }

    const facts = this.store.list<Fact>(COL_FACTS) as any[];
    const conds = this.store.list<Condition>(COL_CONDS) as any[];

    let factCount = 0;
    for (const f of facts) {
      if (normStr(f.factKey) === oldK) {
        f.factKey = newK;
        factCount++;
      }
    }

    let exprCount = 0;
    for (const c of conds) {
      const expr = normStr(c.expression);
      if (!expr) continue;

      if (expr.includes(oldK)) {
        // replace ALL occurrences (literal)
        c.expression = expr.split(oldK).join(newK);
        exprCount++;
      }
    }

    this.store.save(COL_FACTS, facts);
    this.store.save(COL_CONDS, conds);

    this.write(`RENAME factKey "${oldK}" -> "${newK}" facts=${factCount} expressionsUpdated=${exprCount}`);
    this.toast.success(`factKey تغییر کرد (facts=${factCount}, expr=${exprCount})`);
  }
}
