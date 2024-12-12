// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { LobbyComponent } from './components/lobby/lobby.component';
import { AuthGuard } from './services/auth/auth.guard';
import { GameComponent } from './components/game/game.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'lobby', component: LobbyComponent, canActivate: [AuthGuard] },
  { path: 'game/:gameId', component: GameComponent, canActivate: [AuthGuard] },
  { path: '', canActivate: [AuthGuard], component: LobbyComponent },  // Root path guarded
  { path: '**', redirectTo: 'login' },  // Redirect unknown routes to login
];
