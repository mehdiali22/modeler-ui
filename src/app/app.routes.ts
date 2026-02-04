import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'catalogs/processes' },

  // Catalogs
  { path: 'catalogs/processes', loadComponent: () => import('./features/catalogs/processes/processes.component').then(m => m.ProcessesComponent) },
  { path: 'catalogs/stages', loadComponent: () => import('./features/catalogs/stages/stages.component').then(m => m.StagesComponent) },
  { path: 'catalogs/artifacts', loadComponent: () => import('./features/catalogs/artifacts/artifacts.component').then(m => m.ArtifactsComponent) },
  { path: 'catalogs/facts', loadComponent: () => import('./features/catalogs/facts/facts.component').then(m => m.FactsComponent) },
  { path: 'catalogs/conditions', loadComponent: () => import('./features/catalogs/conditions/conditions.component').then(m => m.ConditionsComponent) },
  { path: 'catalogs/actions', loadComponent: () => import('./features/catalogs/actions/actions.component').then(m => m.ActionsComponent) },
  { path: 'catalogs/actors', loadComponent: () => import('./features/catalogs/actors/actors.component').then(m => m.ActorsComponent) },
  { path: 'catalogs/triggers', loadComponent: () => import('./features/catalogs/triggers/triggers.component').then(m => m.TriggersComponent) },
  { path: 'catalogs/events', loadComponent: () => import('./features/catalogs/events/events.component').then(m => m.EventsComponent) },

  // Views
  { path: 'scenarios', loadComponent: () => import('./features/scenarios/scenarios.component').then(m => m.ScenariosComponent) },
  { path: 'stage-board', loadComponent: () => import('./features/stage-board/stage-board.component').then(m => m.StageBoardComponent) },
  { path: 'matrix', loadComponent: () => import('./features/scenario-matrix/scenario-matrix.component').then(m => m.ScenarioMatrixComponent) },

  // Tools
  { path: 'tools/ui-bindings', loadComponent: () => import('./features/tools/ui-bindings/ui-bindings.component').then(m => m.UiBindingsComponent) },


  { path: 'tools/validation', loadComponent: () => import('./features/tools/validation/validation.component').then(m => m.ValidationComponent) },
  { path: 'tools/search', loadComponent: () => import('./features/tools/search/model-search.component').then(m => m.ModelSearchComponent) },
  { path: 'tools/io', loadComponent: () => import('./features/tools/io/model-io.component').then(m => m.ModelIoComponent) },
  { path: 'tools/open', loadComponent: () => import('./features/tools/open/open-entity.component').then(m => m.OpenEntityComponent) },
  { path: 'tools/bulk', loadComponent: () => import('./features/tools/bulk/bulk-tools.component').then(m => m.BulkToolsComponent) },

  // Flow
  { path: 'flow', loadComponent: () => import('./features/flow/flow-view/flow-view.component').then(m => m.FlowViewComponent) },
  { path: 'flow-v2', loadComponent: () => import('./features/flow/flow-v2.component').then(m => m.FlowV2Component) },
  { path: 'explorer', loadComponent: () => import('./features/flow-explorer/flow-explorer.component').then(m => m.FlowExplorerComponent) },

  // Misc
  { path: 'help', loadComponent: () => import('./features/help/help.component').then(m => m.HelpComponent) },
  { path: 'seed', loadComponent: () => import('./features/seed/seed.component').then(m => m.SeedComponent) },

  { path: 'decisions', loadComponent: () => import('./features/decisions/decisions.component').then(m => m.DecisionsComponent) },


  { path: '**', redirectTo: 'catalogs/processes' },
];
