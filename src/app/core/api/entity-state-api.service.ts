import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { EntityState, Id } from '../types';

@Injectable({ providedIn: 'root' })
export class EntityStateApiService {
  constructor(private http: HttpClient, @Inject(API_BASE_URL) private apiBaseUrl: string) {}

  list(artifactId?: Id | null): Observable<EntityState[]> {
    let params = new HttpParams();
    if (artifactId) params = params.set('artifactId', artifactId);
    return this.http.get<EntityState[]>(joinUrl(this.apiBaseUrl, 'api/entity-states'), { params });
  }

  create(payload: Omit<EntityState, 'id'>): Observable<EntityState> {
    return this.http.post<EntityState>(joinUrl(this.apiBaseUrl, 'api/entity-states'), payload);
  }

  update(row: EntityState): Observable<EntityState> {
    return this.http.put<EntityState>(joinUrl(this.apiBaseUrl, `api/entity-states/${row.id}`), row);
  }

  delete(id: Id): Observable<void> {
    return this.http.delete<void>(joinUrl(this.apiBaseUrl, `api/entity-states/${id}`));
  }
}
