import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';

export type ScenarioDecisionDto = {
  id: number;
  scenarioId: number;
  decisionKey: string;
  titleFa?: string;
  uiActionKey?: string;
};

@Injectable({ providedIn: 'root' })
export class ScenarioDecisionApiService
{
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string,
  )
  {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/scenario-decisions');
  }

  list(scenarioId?: number): Observable<ScenarioDecisionDto[]>
  {
    const url = scenarioId ? `${this.baseUrl}?scenarioId=${scenarioId}` : this.baseUrl;
    return this.http.get<ScenarioDecisionDto[]>(url);
  }

  getById(id: number): Observable<ScenarioDecisionDto>
  {
    return this.http.get<ScenarioDecisionDto>(`${this.baseUrl}/${id}`);
  }

  create(input: Omit<ScenarioDecisionDto, 'id'>): Observable<ScenarioDecisionDto>
  {
    const dto: ScenarioDecisionDto = { id: 0, ...input } as ScenarioDecisionDto;
    return this.http.post<ScenarioDecisionDto>(this.baseUrl, dto);
  }

  update(id: number, input: Omit<ScenarioDecisionDto, 'id'>): Observable<ScenarioDecisionDto>
  {
    const dto: ScenarioDecisionDto = { id, ...input } as ScenarioDecisionDto;
    return this.http.put<ScenarioDecisionDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void>
  {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
