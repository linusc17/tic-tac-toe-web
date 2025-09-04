export interface GameSession {
  id: string;
  player1Name: string;
  player2Name: string;
  player1Wins: number;
  player2Wins: number;
  draws: number;
  totalRounds: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameState {
  board: (string | null)[];
  currentPlayer: "X" | "O";
  winner: string | null;
  isDraw: boolean;
}

export interface Round {
  board: (string | null)[];
  winner: string | null;
  isDraw: boolean;
}
