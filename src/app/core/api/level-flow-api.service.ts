import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { ActionFlowLink, Id, LevelFlowLink, LevelFlowPort } from '../types';

export type FlowLevel = 'process' | 'sub-process' | 'stage' | 'scenario' | 'action';

const endpoints: Record<FlowLevel, { ports: string; links: string; ownerParam: string; ownerField: string }> = {
  process: { ports: 'api/process-flow-ports', links: 'api/process-flow-links', ownerParam: 'processId', ownerField: 'processId' },
  'sub-process': { ports: 'api/sub-process-flow-ports', links: 'api/sub-process-flow-links', ownerParam: 'subProcessId', ownerField: 'subProcessId' },
  stage: { ports: 'api/stage-flow-ports', links: 'api/stage-flow-links', ownerParam: 'stageId', ownerField: 'stageId' },
  scenario: { ports: 'api/scenario-flow-ports', links: 'api/scenario-flow-links', ownerParam: 'scenarioId', ownerField: 'scenarioId' },
  action: { ports: 'api/action-flow-ports', links: 'api/action-flow-links', ownerParam: 'actionId', ownerField: 'actionId' },
};

@Injectable({ providedIn: 'root' })
export class LevelFlowApiService {
  constructor(private http: HttpClient, @Inject(API_BASE_URL) private apiBaseUrl: string) {}

  listPorts(level: FlowLevel, ownerId?: Id | null): Observable<any[]> {
    const meta = endpoints[level];
    let params = new HttpParams();
    if (ownerId) params = params.set(meta.ownerParam, ownerId);
    return this.http.get<any[]>(joinUrl(this.apiBaseUrl, meta.ports), { params });
  }

  createPort(level: FlowLevel, ownerId: Id, payload: Omit<LevelFlowPort, 'id' | 'ownerId'>): Observable<any> {
    const meta = endpoints[level];
    return this.http.post<any>(joinUrl(this.apiBaseUrl, meta.ports), { ...payload, [meta.ownerField]: ownerId });
  }

  deletePort(level: FlowLevel, id: Id): Observable<void> {
    return this.http.delete<void>(joinUrl(this.apiBaseUrl, `${endpoints[level].ports}/${id}`));
  }

  listLinks(level: FlowLevel): Observable<any[]> {
    return this.http.get<any[]>(joinUrl(this.apiBaseUrl, endpoints[level].links));
  }

  createLink(level: FlowLevel, payload: Omit<LevelFlowLink, 'id'> | Omit<ActionFlowLink, 'id'>): Observable<any> {
    return this.http.post<any>(joinUrl(this.apiBaseUrl, endpoints[level].links), payload);
  }

  deleteLink(level: FlowLevel, id: Id): Observable<void> {
    return this.http.delete<void>(joinUrl(this.apiBaseUrl, `${endpoints[level].links}/${id}`));
  }
}
