import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { ActionDefinition } from '../types';

type Dto = ActionDefinition;

@Injectable({ providedIn: 'root' })
export class ActionApiService
{
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string,
  )
  {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/actions');
  }

  list(): Observable<Dto[]>
  {
    return this.http.get<Dto[]>(this.baseUrl);
  }

  getById(id: number): Observable<Dto>
  {
    return this.http.get<Dto>(`${this.baseUrl}/${id}`);
  }

  create(input: Omit<Dto, 'id'>): Observable<Dto>
  {
    const dto: Dto = { id: 0, ...input } as any;
    return this.http.post<Dto>(this.baseUrl, dto);
  }

  update(id: number, input: Omit<Dto, 'id'>): Observable<Dto>
  {
    const dto: Dto = { id, ...input } as any;
    return this.http.put<Dto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void>
  {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
