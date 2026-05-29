import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { KartablRoutingRule } from '../types';

@Injectable({ providedIn: 'root' })
export class KartablRoutingRuleApiService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, @Inject(API_BASE_URL) apiBaseUrl: string) {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/kartabl-routing-rules');
  }

  list(): Observable<KartablRoutingRule[]> { return this.http.get<KartablRoutingRule[]>(this.baseUrl); }
  getById(id: number): Observable<KartablRoutingRule> { return this.http.get<KartablRoutingRule>(joinUrl(this.baseUrl, String(id))); }
  create(payload: Omit<KartablRoutingRule, 'id'>): Observable<KartablRoutingRule> { return this.http.post<KartablRoutingRule>(this.baseUrl, payload); }
  update(id: number, payload: Omit<KartablRoutingRule, 'id'>): Observable<KartablRoutingRule> { return this.http.put<KartablRoutingRule>(joinUrl(this.baseUrl, String(id)), { ...payload, id }); }
  delete(id: number): Observable<void> { return this.http.delete<void>(joinUrl(this.baseUrl, String(id))); }
}
