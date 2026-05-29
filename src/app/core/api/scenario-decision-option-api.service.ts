import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';

export type ScenarioDecisionOptionDto = {
  id: number;
  scenarioDecisionId: number;
  optionKey: string;
  titleFa?: string;

  conditionIdsJson?: string;
  actionIdsJson?: string;
};

@Injectable({ providedIn: 'root' })
export class ScenarioDecisionOptionApiService
{
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string,
  )
  {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/scenario-decision-options');
  }

  list(scenarioDecisionId?: number): Observable<ScenarioDecisionOptionDto[]>
  {
    const url = scenarioDecisionId ? `${this.baseUrl}?scenarioDecisionId=${scenarioDecisionId}` : this.baseUrl;
    return this.http.get<ScenarioDecisionOptionDto[]>(url);
  }

  getById(id: number): Observable<ScenarioDecisionOptionDto>
  {
    return this.http.get<ScenarioDecisionOptionDto>(`${this.baseUrl}/${id}`);
  }

  create(input: Omit<ScenarioDecisionOptionDto, 'id'>): Observable<ScenarioDecisionOptionDto>
  {
    const dto: ScenarioDecisionOptionDto = { id: 0, ...input } as ScenarioDecisionOptionDto;
    return this.http.post<ScenarioDecisionOptionDto>(this.baseUrl, dto);
  }

  update(id: number, input: Omit<ScenarioDecisionOptionDto, 'id'>): Observable<ScenarioDecisionOptionDto>
  {
    const dto: ScenarioDecisionOptionDto = { id, ...input } as ScenarioDecisionOptionDto;
    return this.http.put<ScenarioDecisionOptionDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void>
  {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
