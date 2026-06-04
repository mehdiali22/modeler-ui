import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { ActionFlowLink, Id, LevelFlowLink, LevelFlowPort } from '../types';

export type FlowLevel = 'process' | 'sub-process' | 'stage' | 'scenario' | 'action';

/**
 * Legacy port/link API shim.
 *
 * The current model is state-based:
 * EntityState -> Action -> EntityState
 *
 * The backend no longer exposes *-flow-ports / *-flow-links endpoints.
 * Keep this service only so old display code can compile without issuing HTTP
 * requests to removed endpoints.
 */
@Injectable({ providedIn: 'root' })
export class LevelFlowApiService {
  listPorts(_level: FlowLevel, _ownerId?: Id | null): Observable<any[]> {
    return of([]);
  }

  createPort(_level: FlowLevel, _ownerId: Id, _payload: Omit<LevelFlowPort, 'id' | 'ownerId'>): Observable<any> {
    return throwError(() => new Error('Legacy FlowPort API is disabled. Use Entity States and State Transitions.'));
  }

  deletePort(_level: FlowLevel, _id: Id): Observable<void> {
    return throwError(() => new Error('Legacy FlowPort API is disabled. Use Entity States and State Transitions.'));
  }

  listLinks(_level: FlowLevel): Observable<any[]> {
    return of([]);
  }

  createLink(_level: FlowLevel, _payload: Omit<LevelFlowLink, 'id'> | Omit<ActionFlowLink, 'id'>): Observable<any> {
    return throwError(() => new Error('Legacy FlowLink API is disabled. Use Entity States and State Transitions.'));
  }

  deleteLink(_level: FlowLevel, _id: Id): Observable<void> {
    return throwError(() => new Error('Legacy FlowLink API is disabled. Use Entity States and State Transitions.'));
  }
}
