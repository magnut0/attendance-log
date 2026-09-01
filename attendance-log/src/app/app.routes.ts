import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'group/new',
    loadComponent: () => import('./features/group-form/group-form.component').then((m) => m.GroupFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'group/:id/edit',
    loadComponent: () => import('./features/group-form/group-form.component').then((m) => m.GroupFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'day/:groupId/:date',
    loadComponent: () => import('./features/day/day.component').then((m) => m.DayComponent),
  },
  { path: '**', redirectTo: '' },
];
