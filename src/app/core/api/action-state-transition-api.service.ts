import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { ActionStateTransition, Id } from '../types';

@Injectable({ providedIn: 'root' })
export class ActionStateTransitionApiService {
  constructor(private http: HttpClient, @Inject(API_BASE_URL) private apiBaseUrl: string) {}

  list(scenarioId?: Id | null): Observable<ActionStateTransition[]> {
    let params = new HttpParams();
    if (scenarioId) params = params.set('scenarioId', scenarioId);
    return this.http.get<ActionStateTransition[]>(joinUrl(this.apiBaseUrl, 'api/action-state-transitions'), { params });
  }

  create(payload: Omit<ActionStateTransition, 'id'>): Observable<ActionStateTransition> {
    return this.http.post<ActionStateTransition>(joinUrl(this.apiBaseUrl, 'api/action-state-transitions'), payload);
  }

  update(row: ActionStateTransition): Observable<ActionStateTransition> {
    return this.http.put<ActionStateTransition>(joinUrl(this.apiBaseUrl, `api/action-state-transitions/${row.id}`), row);
  }

  delete(id: Id): Observable<void> {
    return this.http.delete<void>(joinUrl(this.apiBaseUrl, `api/action-state-transitions/${id}`));
  }
}
