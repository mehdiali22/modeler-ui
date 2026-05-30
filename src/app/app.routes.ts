import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },

  // Catalogs
  { path: 'catalogs/processes', loadComponent: () => import('./features/catalogs/processes/processes.component').then(m => m.ProcessesComponent) },
  { path: 'catalogs/sub-processes', loadComponent: () => import('./features/catalogs/sub-processes/sub-processes.component').then(m => m.SubProcessesComponent) },
  { path: 'catalogs/stages', loadComponent: () => import('./features/catalogs/stages/stages.component').then(m => m.StagesComponent) },
  { path: 'catalogs/artifacts', loadComponent: () => import('./features/catalogs/artifacts/artifacts.component').then(m => m.ArtifactsComponent) },
  { path: 'catalogs/facts', loadComponent: () => import('./features/catalogs/facts/facts.component').then(m => m.FactsComponent) },
  { path: 'catalogs/conditions', loadComponent: () => import('./features/catalogs/conditions/conditions.component').then(m => m.ConditionsComponent) },
  { path: 'catalogs/actions', loadComponent: () => import('./features/catalogs/actions/actions.component').then(m => m.ActionsComponent) },
  { path: 'catalogs/actors', loadComponent: () => import('./features/catalogs/actors/actors.component').then(m => m.ActorsComponent) },
  { path: 'catalogs/kartabls', loadComponent: () => import('./features/catalogs/kartabls/kartabls.component').then(m => m.KartablsComponent) },
  { path: 'kartabl-routing-rules', loadComponent: () => import('./features/kartabl-routing-rules/kartabl-routing-rules.component').then(m => m.KartablRoutingRulesComponent) },
  { path: 'flow-links', loadComponent: () => import('./features/flow-links/flow-links.component').then(m => m.FlowLinksComponent) },
  { path: 'level-flows', loadComponent: () => import('./features/level-flows/level-flows.component').then(m => m.LevelFlowsComponent) },

  // Runtime
  { path: 'kartabl-queue', loadComponent: () => import('./features/kartabl-queue/kartabl-queue.component').then(m => m.KartablQueueComponent) },
  { path: 'action-outbox', loadComponent: () => import('./features/action-outbox/action-outbox.component').then(m => m.ActionOutboxComponent) },
  { path: 'work-items', loadComponent: () => import('./features/work-items/work-items.component').then(m => m.WorkItemsComponent) },

  // Views
  { path: 'scenarios', loadComponent: () => import('./features/scenarios/scenarios.component').then(m => m.ScenariosComponent) },
  { path: 'decisions', loadComponent: () => import('./features/decisions/decisions.component').then(m => m.DecisionsComponent) },

  // Tools
  { path: 'tools/validation', loadComponent: () => import('./features/tools/validation/validation.component').then(m => m.ValidationComponent) },
  { path: 'tools/io', loadComponent: () => import('./features/tools/io/model-io.component').then(m => m.ModelIoComponent) },
  { path: 'tools/runtime-setup', loadComponent: () => import('./features/tools/runtime-setup/runtime-setup.component').then(m => m.RuntimeSetupComponent) },
  { path: 'tools/mermaid-export', loadComponent: () => import('./features/tools/mermaid-export/mermaid-export.component').then(m => m.MermaidExportComponent) },

  // Misc
  { path: 'help', loadComponent: () => import('./features/help/help.component').then(m => m.HelpComponent) },

  { path: '**', redirectTo: 'home' },
];
