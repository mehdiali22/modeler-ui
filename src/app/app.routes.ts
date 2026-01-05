import { Routes } from '@angular/router';

export const routes: Routes = [
  
  { path: 'catalogs/artifacts', loadComponent: () => import('./features/catalogs/artifacts/artifacts.component').then(m => m.ArtifactsComponent) },
  { path: 'catalogs/facts', loadComponent: () => import('./features/catalogs/facts/facts.component').then(m => m.FactsComponent) },
  { path: 'catalogs/conditions', loadComponent: () => import('./features/catalogs/conditions/conditions.component').then(m => m.ConditionsComponent) },
  { path: 'scenarios', loadComponent: () => import('./features/scenarios/scenarios.component').then(m => m.ScenariosComponent) },
  { path: 'catalogs/processes', loadComponent: () => import('./features/catalogs/processes/processes.component').then(m => m.ProcessesComponent) },
  { path: 'catalogs/stages', loadComponent: () => import('./features/catalogs/stages/stages.component').then(m => m.StagesComponent) },
  { path: 'scenarios', loadComponent: () => import('./features/scenarios/scenarios.component').then(m => m.ScenariosComponent) },

  { path: '**', redirectTo: 'catalogs/artifacts' },
];
