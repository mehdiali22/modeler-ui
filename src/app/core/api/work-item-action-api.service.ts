import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { WorkItemAction } from '../types';

@Injectable({ providedIn: 'root' })
export class WorkItemActionApiService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, @Inject(API_BASE_URL) apiBaseUrl: string) {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/work-item-actions');
  }

  pending(q: { take?: number; source?: string; actionId?: number | string } = {}): Observable<WorkItemAction[]> {
    let params = new HttpParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') params = params.set(k, String(v));
    });
    return this.http.get<WorkItemAction[]>(joinUrl(this.baseUrl, 'pending'), { params });
  }

  getById(id: number): Observable<WorkItemAction> { return this.http.get<WorkItemAction>(joinUrl(this.baseUrl, String(id))); }
  markDone(id: number): Observable<WorkItemAction> { return this.http.post<WorkItemAction>(joinUrl(this.baseUrl, `${id}/mark-done`), {}); }
  markFailed(id: number, error: string): Observable<WorkItemAction> { return this.http.post<WorkItemAction>(joinUrl(this.baseUrl, `${id}/mark-failed`), { error }); }
  retry(id: number): Observable<WorkItemAction> { return this.http.post<WorkItemAction>(joinUrl(this.baseUrl, `${id}/retry`), {}); }
}
