import { Injectable } from '@angular/core';
import { ModelContext } from './types';

@Injectable({ providedIn: 'root' })
export class VersionedStoreService
{
  private key(ctx: ModelContext, collection: string)
  {
    return `modeler:v3:${ctx.projectName}:${ctx.versionName}:${collection}`;
  }

  list<T>(ctx: ModelContext, collection: string): T[]
  {
    const raw = localStorage.getItem(this.key(ctx, collection));
    if (!raw) return [];
    try { return JSON.parse(raw) as T[]; } catch { return []; }
  }

  save<T>(ctx: ModelContext, collection: string, items: T[])
  {
    localStorage.setItem(this.key(ctx, collection), JSON.stringify(items));
  }
}
