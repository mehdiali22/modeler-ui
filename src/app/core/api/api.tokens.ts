import { InjectionToken } from '@angular/core';

/**
 * Base URL for backend API.
 * Default: http://localhost:5000
 *
 * You can override it in app.config.ts providers:
 * { provide: API_BASE_URL, useValue: 'http://localhost:5000' }
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => 'https://localhost:10824',
});
