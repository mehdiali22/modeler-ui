import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { ActionDefinition, Id, Process, Scenario, Stage, SubProcess } from '../../core/types';
import { ActionApiService } from '../../core/api/action-api.service';
import { LevelFlowApiService, FlowLevel } from '../../core/api/level-flow-api.service';
import { ProcessApiService } from '../../core/api/process-api.service';
import { ScenarioApiService } from '../../core/api/scenario-api.service';
import { StageApiService } from '../../core/api/stage-api.service';
import { SubProcessApiService } from '../../core/api/sub-process-api.service';

@Component({
  selector: 'app-level-flows',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './level-flows.component.html',
  styleUrls: ['./level-flows.component.scss'],
})
export class LevelFlowsComponent implements OnInit {
  levels: { key: FlowLevel; title: string; ownerTitle: string }[] = [
    { key: 'process', title: 'Process Ports/Links', ownerTitle: 'Process' },
    { key: 'sub-process', title: 'SubProcess Ports/Links', ownerTitle: 'SubProcess' },
    { key: 'stage', title: 'Stage Ports/Links', ownerTitle: 'Stage' },
    { key: 'scenario', title: 'Scenario Ports/Links', ownerTitle: 'Scenario' },
    { key: 'action', title: 'Action Ports/Links', ownerTitle: 'Action' },
  ];

  active: FlowLevel = 'sub-process';
  owners: Record<FlowLevel, any[]> = { process: [], 'sub-process': [], stage: [], scenario: [], action: [] };
  ports: any[] = [];
  links: any[] = [];
  error: string | null = null;
  isLoading = false;

  portForm: any = { ownerId: null, portKey: '', titleFa: '', direction: 'Out', payloadSchemaJson: '{}', sortOrder: 10, description: '' };
  linkForm: any = { linkKey: '', fromPortId: null, toPortId: null, conditionIdsJson: '[]', labelFa: '', sortOrder: 10, description: '', scopeType: 'Stage', scopeId: null };

  constructor(
    private flows: LevelFlowApiService,
    private processes: ProcessApiService,
    private subProcesses: SubProcessApiService,
    private stages: StageApiService,
    private scenarios: ScenarioApiService,
    private actions: ActionApiService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      processes: this.processes.list(),
      subProcesses: this.subProcesses.list(),
      stages: this.stages.list(),
      scenarios: this.scenarios.list(),
      actions: this.actions.list(),
    }).subscribe({
      next: data => {
        this.owners.process = data.processes;
        this.owners['sub-process'] = data.subProcesses;
        this.owners.stage = data.stages;
        this.owners.scenario = data.scenarios;
        this.owners.action = data.actions;
        this.load();
      },
      error: err => { this.error = err?.message ?? 'خطا در خواندن داده‌های پایه'; },
    });
  }

  setLevel(level: FlowLevel): void {
    this.active = level;
    this.resetForms();
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = null;
    forkJoin({ ports: this.flows.listPorts(this.active), links: this.flows.listLinks(this.active) }).subscribe({
      next: x => { this.ports = x.ports; this.links = x.links; this.isLoading = false; },
      error: err => { this.error = err?.message ?? 'خطا در خواندن Ports/Links'; this.isLoading = false; },
    });
  }

  addPort(): void {
    if (!this.portForm.ownerId || !this.portForm.portKey) return;
    this.flows.createPort(this.active, Number(this.portForm.ownerId), {
      portKey: this.portForm.portKey,
      titleFa: this.portForm.titleFa,
      direction: this.portForm.direction,
      payloadSchemaJson: this.portForm.payloadSchemaJson || '{}',
      sortOrder: Number(this.portForm.sortOrder || 0),
      description: this.portForm.description,
    } as any).subscribe({ next: () => { this.resetPortForm(); this.load(); }, error: err => this.error = err?.message ?? 'خطا در ثبت Port' });
  }

  deletePort(id: Id): void {
    if (!confirm('Port حذف شود؟')) return;
    this.flows.deletePort(this.active, id).subscribe({ next: () => this.load(), error: err => this.error = err?.message ?? 'خطا در حذف Port' });
  }

  addLink(): void {
    if (!this.linkForm.linkKey || !this.linkForm.fromPortId || !this.linkForm.toPortId) return;
    const payload: any = {
      linkKey: this.linkForm.linkKey,
      fromPortId: Number(this.linkForm.fromPortId),
      toPortId: Number(this.linkForm.toPortId),
      conditionIdsJson: this.linkForm.conditionIdsJson || '[]',
      labelFa: this.linkForm.labelFa,
      sortOrder: Number(this.linkForm.sortOrder || 0),
      description: this.linkForm.description,
    };
    if (this.active === 'action') {
      payload.scopeType = this.linkForm.scopeType;
      payload.scopeId = this.linkForm.scopeId ? Number(this.linkForm.scopeId) : null;
    }
    this.flows.createLink(this.active, payload).subscribe({ next: () => { this.resetLinkForm(); this.load(); }, error: err => this.error = err?.message ?? 'خطا در ثبت Link' });
  }

  deleteLink(id: Id): void {
    if (!confirm('Link حذف شود؟')) return;
    this.flows.deleteLink(this.active, id).subscribe({ next: () => this.load(), error: err => this.error = err?.message ?? 'خطا در حذف Link' });
  }

  ownerLabel(owner: any): string {
    return owner.processKey || owner.subProcessKey || owner.stageKey || owner.scenarioKey || owner.actionKey || owner.id;
  }

  ownerNameById(id: Id): string {
    const owner = this.owners[this.active].find(x => x.id === id);
    return owner ? this.ownerLabel(owner) : String(id);
  }

  portLabel(port: any): string {
    return `${port.direction} · ${port.portKey} · ${port.titleFa || ''}`;
  }

  private resetForms(): void { this.resetPortForm(); this.resetLinkForm(); }
  private resetPortForm(): void { this.portForm = { ownerId: null, portKey: '', titleFa: '', direction: 'Out', payloadSchemaJson: '{}', sortOrder: 10, description: '' }; }
  private resetLinkForm(): void { this.linkForm = { linkKey: '', fromPortId: null, toPortId: null, conditionIdsJson: '[]', labelFa: '', sortOrder: 10, description: '', scopeType: 'Stage', scopeId: null }; }
}
