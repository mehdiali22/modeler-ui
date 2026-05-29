import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { Kartabl, PagedResult, WorkItem } from '../types';

export type KartablQueueQuery = {
  ownerSubdomain?: string;
  status?: string;
  referenceNo?: string;
  caseId?: string;
  q?: string;
  qField?: 'all' | 'key' | 'title' | 'referenceNo' | 'caseId';
  qMode?: 'contains' | 'startsWith' | 'exact';
  sort?: string;
  skip?: number;
  take?: number;
};

@Injectable({ providedIn: 'root' })
export class KartablApiService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, @Inject(API_BASE_URL) apiBaseUrl: string) {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/kartabls');
  }

  list(): Observable<Kartabl[]> { return this.http.get<Kartabl[]>(this.baseUrl); }
  getById(id: number): Observable<Kartabl> { return this.http.get<Kartabl>(joinUrl(this.baseUrl, String(id))); }
  create(payload: Omit<Kartabl, 'id'>): Observable<Kartabl> { return this.http.post<Kartabl>(this.baseUrl, payload); }
  update(id: number, payload: Omit<Kartabl, 'id'>): Observable<Kartabl> { return this.http.put<Kartabl>(joinUrl(this.baseUrl, String(id)), { ...payload, id }); }
  delete(id: number): Observable<void> { return this.http.delete<void>(joinUrl(this.baseUrl, String(id))); }

  workItems(id: number, q: KartablQueueQuery = {}): Observable<PagedResult<WorkItem>> {
    let params = new HttpParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') params = params.set(k, String(v));
    });
    return this.http.get<PagedResult<WorkItem>>(joinUrl(this.baseUrl, `${id}/work-items`), { params });
  }
}
