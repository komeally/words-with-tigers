// src/app/state/game.actions.ts
import { createAction, props } from '@ngrx/store';
import { GameState } from '../state/game.state'; // Define the interface for your game state if not done yet

// Action for initializing a new game
export const initializeGame = createAction(
  '[Game] Initialize Game',
  props<{ gameId: string; players: any[] }>() // Replace `any[]` with your player type
);

export const setGameState = createAction(
  '[Game] Set Game State',
  props<{ gameState: GameState }>()
);

// Action for updating the game state (e.g., turn changes, move validations)
export const updateGameState = createAction(
  '[Game] Update Game State',
  props<{ state: Partial<GameState> }>() // Only update parts of the state
);

// Action for handling a player move
export const playerMove = createAction(
  '[Game] Player Move',
  props<{ move: any }>() // Replace `any` with your move type
);

// Action for ending a game
export const endGame = createAction(
  '[Game] End Game',
  props<{ winner: string; finalState: GameState }>()
);

// Action for handling errors
export const gameError = createAction(
  '[Game] Error',
  props<{ error: string }>()
);
