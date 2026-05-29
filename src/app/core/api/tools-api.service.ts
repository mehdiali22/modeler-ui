import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ValidationIssue } from '../types';

import { API_BASE_URL } from './api.tokens';
import { joinUrl } from './api.util';

@Injectable({ providedIn: 'root' })
export class ToolsApiService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string,
  ) {
    this.baseUrl = joinUrl(apiBaseUrl, 'api/tools');
  }

  export(): Observable<any> {
    return this.http.get<any>(joinUrl(this.baseUrl, 'export'));
  }

  validate(): Observable<ValidationIssue[]> {
    return this.http.get<ValidationIssue[]>(joinUrl(this.baseUrl, 'validate'));
  }

  import(body: any, mode: 'merge' | 'overwrite'): Observable<void> {
    // backend expects mode query string
    return this.http.post<void>(joinUrl(this.baseUrl, `import?mode=${mode}`), body);
  }
}
