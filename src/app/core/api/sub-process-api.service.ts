import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { SubProcess } from '../types';

type Dto = SubProcess;

@Injectable({ providedIn: 'root' })
export class SubProcessApiService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string,
  ) {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/sub-processes');
  }

  list(processId?: number): Observable<Dto[]> {
    let params = new HttpParams();
    if (processId) params = params.set('processId', String(processId));
    return this.http.get<Dto[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Dto> {
    return this.http.get<Dto>(`${this.baseUrl}/${id}`);
  }

  create(input: Omit<Dto, 'id'>): Observable<Dto> {
    const dto: Dto = { id: 0, ...input } as Dto;
    return this.http.post<Dto>(this.baseUrl, dto);
  }

  update(id: number, input: Omit<Dto, 'id'>): Observable<Dto> {
    const dto: Dto = { id, ...input } as Dto;
    return this.http.put<Dto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
