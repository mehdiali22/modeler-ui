import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';
import { FactEnumValue } from '../types';

@Injectable({ providedIn: 'root' })
export class FactEnumValueApiService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string,
  ) {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/fact-enum-values');
  }

  list(factId?: number): Observable<FactEnumValue[]> {
    const url = factId ? `${this.baseUrl}?factId=${factId}` : this.baseUrl;
    return this.http.get<FactEnumValue[]>(url);
  }
}
