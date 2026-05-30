import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { ModelerFlowLink } from '../types';

@Injectable({ providedIn: 'root' })
export class ModelerFlowLinkApiService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, @Inject(API_BASE_URL) apiBaseUrl: string) {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/flow-links');
  }

  list(): Observable<ModelerFlowLink[]> { return this.http.get<ModelerFlowLink[]>(this.baseUrl); }
  getById(id: number): Observable<ModelerFlowLink> { return this.http.get<ModelerFlowLink>(joinUrl(this.baseUrl, String(id))); }
  create(payload: Omit<ModelerFlowLink, 'id'>): Observable<ModelerFlowLink> { return this.http.post<ModelerFlowLink>(this.baseUrl, payload); }
  update(id: number, payload: Omit<ModelerFlowLink, 'id'>): Observable<ModelerFlowLink> { return this.http.put<ModelerFlowLink>(joinUrl(this.baseUrl, String(id)), { ...payload, id }); }
  delete(id: number): Observable<void> { return this.http.delete<void>(joinUrl(this.baseUrl, String(id))); }
}
