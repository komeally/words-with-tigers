export interface GameState {
  gameId: string | null;
  boardState: Record<string, { row: number; col: number; letter: string; isLocked: boolean }>; // Board tiles
  players: {
    userId: string;
    username: string;
    score: number;
    currentRack: {
      letter: string;
      pointValue: number;
    }[];
    isActive: boolean;
  }[];
  currentPlayerId: string | null;
  isGameInProgress: boolean;
  tileBag: {
    letter: string;
    pointValue: number;
  }[];
  moves: {
    words: string[];
    tiles: {
      row: number;
      col: number;
      letter: string;
    }[];
    score: number;
    moveType: 'PLACE' | 'PASS' | 'RESIGN';
    timestamp: string;
  }[];
}
