import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'model', loadComponent: () => import('./features/model-context/model-context.component').then(m => m.ModelContextComponent) },

  { path: 'catalogs/artifacts', loadComponent: () => import('./features/catalogs/artifacts/artifacts.component').then(m => m.ArtifactsComponent) },
  { path: 'catalogs/facts', loadComponent: () => import('./features/catalogs/facts/facts.component').then(m => m.FactsComponent) },
  { path: 'catalogs/conditions', loadComponent: () => import('./features/catalogs/conditions/conditions.component').then(m => m.ConditionsComponent) },

  { path: '', pathMatch: 'full', redirectTo: 'model' },
  { path: '**', redirectTo: 'model' },
];
