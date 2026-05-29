import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';

export type DecisionOptionFactChangeDto = {
  id: number;
  scenarioDecisionOptionId: number;
  factId: number;
  op: 'Set' | 'Unset' | 'Inc' | 'Dec';
  sortOrder?: number;
  value?: string;
};

@Injectable({ providedIn: 'root' })
export class DecisionOptionFactChangeApiService
{
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string,
  )
  {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/decision-option-fact-changes');
  }

  list(scenarioDecisionOptionId?: number): Observable<DecisionOptionFactChangeDto[]>
  {
    const url = scenarioDecisionOptionId
      ? `${this.baseUrl}?scenarioDecisionOptionId=${scenarioDecisionOptionId}`
      : this.baseUrl;
    return this.http.get<DecisionOptionFactChangeDto[]>(url);
  }

  create(input: Omit<DecisionOptionFactChangeDto, 'id'>): Observable<DecisionOptionFactChangeDto>
  {
    const dto: DecisionOptionFactChangeDto = { id: 0, ...input } as any;
    return this.http.post<DecisionOptionFactChangeDto>(this.baseUrl, dto);
  }

  update(id: number, input: Omit<DecisionOptionFactChangeDto, 'id'>): Observable<DecisionOptionFactChangeDto>
  {
    const dto: DecisionOptionFactChangeDto = { id, ...input } as any;
    return this.http.put<DecisionOptionFactChangeDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void>
  {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
