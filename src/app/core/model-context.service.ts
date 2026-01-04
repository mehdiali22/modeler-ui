import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ModelContext } from './types';

const CTX_KEY = 'modeler:v3:currentContext';

@Injectable({ providedIn: 'root' })
export class ModelContextService
{
  private _ctx$ = new BehaviorSubject<ModelContext | null>(this.load());
  ctx$ = this._ctx$.asObservable();

  get current(): ModelContext | null
  {
    return this._ctx$.value;
  }

  set(ctx: ModelContext)
  {
    localStorage.setItem(CTX_KEY, JSON.stringify(ctx));
    this._ctx$.next(ctx);
  }

  clear()
  {
    localStorage.removeItem(CTX_KEY);
    this._ctx$.next(null);
  }

  private load(): ModelContext | null
  {
    const raw = localStorage.getItem(CTX_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as ModelContext; } catch { return null; }
  }
}
