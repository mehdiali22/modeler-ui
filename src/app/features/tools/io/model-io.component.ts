import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { ToolsApiService } from '../../../core/api/tools-api.service';

type ImportMode = 'merge' | 'overwrite';

@Component({
  selector: 'app-model-io',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './model-io.component.html',
  styleUrls: ['./model-io.component.scss'],
})
export class ModelIoComponent {
  mode: ImportMode = 'merge';
  text = '';
  log = '';

  constructor(private toolsApi: ToolsApiService) {
    this.refreshTextFromApi();
  }

  refreshTextFromApi() {
    this.log = 'در حال دریافت...';
    this.toolsApi.export().subscribe({
      next: (res) => {
        this.text = JSON.stringify(res, null, 2);
        this.log = 'OK';
      },
      error: (err) => {
        this.log = (err?.message ?? 'خطا در ارتباط با API');
      }
    });
  }

  download() {
    const name = `model-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    const blob = new Blob([this.text || ''], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Backward-compatible name (template expects this)
  exportDownload() {
    this.download();
  }

  importApply() {
    let obj: any;
    try {
      obj = JSON.parse(this.text || '{}');
    } catch {
      this.log = 'JSON نامعتبر است';
      return;
    }

    this.log = 'در حال ارسال...';
    this.toolsApi.import(obj, this.mode).subscribe({
      next: () => {
        this.log = 'OK';
      },
      error: (err) => {
        this.log = (err?.message ?? 'خطا در import');
      }
    });
  }

  onFilePicked(ev: Event) {
    const input = ev.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.text = String(reader.result ?? '');
    };
    reader.onerror = () => {
      this.log = 'خطا در خواندن فایل';
    };
    reader.readAsText(file);
  }

  clearAll() {
    const emptyCols = {
      actionCatalog: [],
      actors: [],
      artifacts: [],
      conditions: [],
      facts: [],
      dictionaryTerms: [],
      factEnumValues: [],
      processes: [],
      stages: [],
      triggers: [],
      events: [],
      scenarios: [],
      eventTriggerLinks: [],
      subProcesses: [],
    };
    const payload = { exportedAt: new Date().toISOString(), cols: emptyCols };

    this.mode = 'overwrite';
    this.text = JSON.stringify(payload, null, 2);
    this.importApply();
  }
}
