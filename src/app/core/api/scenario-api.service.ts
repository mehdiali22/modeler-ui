import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { Scenario } from '../types';

@Injectable({ providedIn: 'root' })
export class ScenarioApiService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string,
  ) {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/scenarios');
  }

  list(): Observable<Scenario[]> {
    return this.http.get<Scenario[]>(this.baseUrl);
  }

  getById(id: number): Observable<Scenario> {
    return this.http.get<Scenario>(joinUrl(this.baseUrl, String(id)));
  }

  create(payload: Omit<Scenario, 'id'>): Observable<Scenario> {
    return this.http.post<Scenario>(this.baseUrl, payload);
  }

  update(id: number, payload: Omit<Scenario, 'id'>): Observable<Scenario> {
    return this.http.put<Scenario>(joinUrl(this.baseUrl, String(id)), payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(joinUrl(this.baseUrl, String(id)));
  }
}
