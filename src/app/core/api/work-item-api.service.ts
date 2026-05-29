import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { ExecuteScenarioOnWorkItemRequest, ExecuteScenarioOnWorkItemResponse, WorkItem, WorkItemAction } from '../types';

@Injectable({ providedIn: 'root' })
export class WorkItemApiService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, @Inject(API_BASE_URL) apiBaseUrl: string) {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/work-items');
  }

  list(): Observable<WorkItem[]> { return this.http.get<WorkItem[]>(this.baseUrl); }
  getById(id: number): Observable<WorkItem> { return this.http.get<WorkItem>(joinUrl(this.baseUrl, String(id))); }
  create(payload: Omit<WorkItem, 'id'>): Observable<WorkItem> { return this.http.post<WorkItem>(this.baseUrl, payload); }
  update(id: number, payload: Omit<WorkItem, 'id'>): Observable<WorkItem> { return this.http.put<WorkItem>(joinUrl(this.baseUrl, String(id)), { ...payload, id }); }
  delete(id: number): Observable<void> { return this.http.delete<void>(joinUrl(this.baseUrl, String(id))); }

  actions(id: number, status?: string): Observable<WorkItemAction[]> {
    const url = joinUrl(this.baseUrl, `${id}/actions${status ? '?status=' + encodeURIComponent(status) : ''}`);
    return this.http.get<WorkItemAction[]>(url);
  }

  executeScenario(workItemId: number, payload: ExecuteScenarioOnWorkItemRequest): Observable<ExecuteScenarioOnWorkItemResponse> {
    return this.http.post<ExecuteScenarioOnWorkItemResponse>(joinUrl(this.baseUrl, `${workItemId}/execute-scenario`), payload);
  }
}
