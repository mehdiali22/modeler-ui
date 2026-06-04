import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { Id, ModelerFlowLink } from '../types';

/** Legacy flow-link API shim. Use State Transitions instead. */
@Injectable({ providedIn: 'root' })
export class ModelerFlowLinkApiService {
  list(): Observable<ModelerFlowLink[]> {
    return of([]);
  }

  create(_payload: Omit<ModelerFlowLink, 'id'>): Observable<ModelerFlowLink> {
    return throwError(() => new Error('Legacy ModelerFlowLink API is disabled. Use State Transitions.'));
  }

  delete(_id: Id): Observable<void> {
    return throwError(() => new Error('Legacy ModelerFlowLink API is disabled. Use State Transitions.'));
  }
}
