import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CatalogStoreService
{
  private prefix = 'modeler:v3'; // ثابت، بدون context

  private key(collection: string)
  {
    return `${this.prefix}:${collection}`;
  }

  list<T>(collection: string): T[]
  {
    const raw = localStorage.getItem(this.key(collection));
    if (!raw) return [];
    try { return JSON.parse(raw) as T[]; } catch { return []; }
  }

  save<T>(collection: string, items: T[])
  {
    localStorage.setItem(this.key(collection), JSON.stringify(items));
  }
}
