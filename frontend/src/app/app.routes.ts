// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { LobbyComponent } from './components/lobby/lobby.component';
import { AuthGuard } from './services/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'lobby', component: LobbyComponent, canActivate: [AuthGuard] },
  { path: '', canActivate: [AuthGuard], component: LobbyComponent },  // Root path guarded
  { path: '**', redirectTo: 'login' },  // Redirect unknown routes to login
];
