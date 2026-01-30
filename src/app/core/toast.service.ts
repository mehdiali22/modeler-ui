import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastKind = 'info' | 'success' | 'warn' | 'error';
export type ToastItem = {
  id: number;
  text: string;
  kind: ToastKind;
  createdAt: number;
  ttlMs: number;
};

let __toastSeq = 0;
function uid(): number
{
  __toastSeq += 1;
  return __toastSeq;
}

@Injectable({ providedIn: 'root' })
export class ToastService
{
  private _items = new BehaviorSubject<ToastItem[]>([]);
  items$ = this._items.asObservable();

  show(text: string, kind: ToastKind = 'info', ttlMs = 2500)
  {
    const item: ToastItem = { id: uid(), text, kind, createdAt: Date.now(), ttlMs };
    const next = [item, ...this._items.value];
    this._items.next(next);

    setTimeout(() => this.remove(item.id), ttlMs);
  }

  success(text: string, ttlMs = 2200) { this.show(text, 'success', ttlMs); }
  warn(text: string, ttlMs = 2800) { this.show(text, 'warn', ttlMs); }
  error(text: string, ttlMs = 3500) { this.show(text, 'error', ttlMs); }

  remove(id: number)
  {
    const next = this._items.value.filter(x => x.id !== id);
    this._items.next(next);
  }

  clear()
  {
    this._items.next([]);
  }
}
