import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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

type ModelDump = {
  exportedAt: string;
  cols: Record<ColName, any[]>;
};

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function tryParseJson(text: string): any | null {
  try { return JSON.parse(text); } catch { return null; }
}

function mergeById(existing: any[], incoming: any[]) {
  const map = new Map<string, any>();
  for (const x of existing ?? []) {
    if (x?.id) map.set(x.id, x);
  }
  for (const x of incoming ?? []) {
    if (x?.id) map.set(x.id, x);
  }
  return [...map.values()];
}

@Component({
  selector: 'app-model-io',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './model-io.component.html',
  styleUrls: ['./model-io.component.scss'],
})
export class ModelIoComponent {
  mode: 'overwrite' | 'merge' = 'merge';
  text = '';
  log: string[] = [];

  constructor(private store: CatalogStoreService) {
    this.refreshTextFromStore();
  }

  private write(msg: string) {
    this.log = [msg, ...this.log];
  }

  refreshTextFromStore() {
    const dump: ModelDump = {
      exportedAt: new Date().toISOString(),
      cols: {} as any,
    };

    for (const c of COLS) {
      dump.cols[c] = this.store.list<any>(c);
    }

    this.text = JSON.stringify(dump, null, 2);
    this.write('REFRESH از store انجام شد');
  }

  exportDownload() {
    const name = `model-v3-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    downloadText(name, this.text || '{}');
    this.write(`DOWNLOAD: ${name}`);
  }

  onFilePicked(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.text = String(reader.result ?? '');
      this.write(`FILE LOADED: ${file.name}`);
    };
    reader.readAsText(file, 'utf-8');
  }

  importApply() {
    const parsed = tryParseJson(this.text);
    if (!parsed) {
      this.write('ERROR: JSON نامعتبر است');
      return;
    }

    // حالت‌های قابل قبول:
    // 1) { exportedAt, cols: {facts:[], ...} }
    // 2) { facts:[], conditions:[], ... }  (بدون wrapper)
    const colsObj: any = parsed?.cols ?? parsed;

    let total = 0;

    for (const c of COLS) {
      const incoming = Array.isArray(colsObj?.[c]) ? colsObj[c] : null;
      if (!incoming) continue;

      const current = this.store.list<any>(c);
      const next = this.mode === 'overwrite'
        ? incoming
        : mergeById(current, incoming);

      this.store.save(c, next);
      total += incoming.length;

      this.write(`${this.mode.toUpperCase()} ${c}: +${incoming.length} (now ${next.length})`);
    }

    this.write(`IMPORT DONE ✅ totalIncoming=${total}`);
  }

  clearAll() {
    for (const c of COLS) this.store.save(c, []);
    this.write('CLEAR ALL ✅');
    this.refreshTextFromStore();
  }
}
