import { createReducer, on } from '@ngrx/store';
import { GameState } from '../state/game.state';
import {
  initializeGame,
  updateGameState,
  playerMove,
  endGame,
  gameError,
} from '../actions/game.actions';

export const initialGameState: GameState = {
  gameId: null,
  boardState: {}, // Empty board to start with
  players: [],
  currentPlayerId: null,
  isGameInProgress: false,
  tileBag: [],
  moves: [],
};

export const gameReducer = createReducer(
  initialGameState,
  on(initializeGame, (state, { gameId, players }) => ({
    ...state,
    gameId,
    players,
    status: 'IN_PROGRESS',
  })),
  on(updateGameState, (state, { state: newState }) => ({
    ...state,
    ...newState,
  })),
  on(playerMove, (state, { move }) => ({
    ...state,
    moves: [...state.moves, move],
  })),
  on(endGame, (state, { winner, finalState }) => ({
    ...finalState,
    status: 'ENDED',
    winner,
  })),
  on(gameError, (state, { error }) => ({
    ...state,
    error,
  }))
);
