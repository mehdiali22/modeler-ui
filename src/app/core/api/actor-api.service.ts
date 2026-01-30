import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { ActorDefinition } from '../types';
import { Observable } from 'rxjs';

type ActorDto = ActorDefinition;

@Injectable({ providedIn: 'root' })
export class ActorApiService
{
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string,
  )
  {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/actors');
  }

  list(): Observable<ActorDto[]>
  {
    return this.http.get<ActorDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<ActorDto>
  {
    return this.http.get<ActorDto>(`${this.baseUrl}/${id}`);
  }

  create(input: Omit<ActorDto, 'id'>): Observable<ActorDto>
  {
    const dto: ActorDto = { id: 0, ...input };
    return this.http.post<ActorDto>(this.baseUrl, dto);
  }

  update(id: number, input: Omit<ActorDto, 'id'>): Observable<ActorDto>
  {
    const dto: ActorDto = { id, ...input };
    return this.http.put<ActorDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void>
  {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
