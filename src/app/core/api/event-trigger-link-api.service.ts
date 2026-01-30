import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { EventTriggerLink } from '../types';

@Injectable({ providedIn: 'root' })
export class EventTriggerLinkApiService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string,
  ) {
    // Matches API controller route: api/eventTriggerLinks
    this.baseUrl = joinUrl(apiBaseUrl, 'api/eventTriggerLinks');
  }

  list(): Observable<EventTriggerLink[]> {
    return this.http.get<EventTriggerLink[]>(this.baseUrl);
  }

  getById(id: number): Observable<EventTriggerLink> {
    return this.http.get<EventTriggerLink>(joinUrl(this.baseUrl, String(id)));
  }

  create(payload: Omit<EventTriggerLink, 'id'>): Observable<EventTriggerLink> {
    return this.http.post<EventTriggerLink>(this.baseUrl, payload);
  }

  update(id: number, payload: Omit<EventTriggerLink, 'id'>): Observable<EventTriggerLink> {
    return this.http.put<EventTriggerLink>(joinUrl(this.baseUrl, String(id)), payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(joinUrl(this.baseUrl, String(id)));
  }
}
