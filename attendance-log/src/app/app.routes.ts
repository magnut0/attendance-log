import { Routes } from '@angular/router';
import { superUserGuard } from './core/guards/super-user.guard';
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
    path: 'groups',
    loadComponent: () => import('./features/groups-list/groups-list.component').then((m) => m.GroupsListComponent),
    canActivate: [superUserGuard],
  },
  {
    path: 'group/new',
    loadComponent: () => import('./features/group-form/group-form.component').then((m) => m.GroupFormComponent),
    canActivate: [superUserGuard],
  },
  {
    path: 'group/:id/edit',
    loadComponent: () => import('./features/group-form/group-form.component').then((m) => m.GroupFormComponent),
    canActivate: [superUserGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/users-list/users-list.component').then((m) => m.UsersListComponent),
    canActivate: [superUserGuard],
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./features/users/users-details/users-details.component').then((m) => m.UsersDetailsComponent),
    canActivate: [superUserGuard],
  },
  {
    path: 'day/:groupId/:date',
    loadComponent: () => import('./features/day/day.component').then((m) => m.DayComponent),
  },
  { path: '**', redirectTo: '' },
];
