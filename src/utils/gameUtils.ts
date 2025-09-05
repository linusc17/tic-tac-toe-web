/**
 * Utility functions for tic-tac-toe game logic and UI helpers
 */

export interface Player {
  id: string;
  name: string;
  symbol: string;
  userId?: string | null;
}

export interface GameState {
  board: (string | null)[];
  currentTurn: string;
  winner: string | null;
  isDraw: boolean;
  isActive: boolean;
}

/**
 * Check if a player can make a move at a given position
 */
export const canMakeMove = (
  gameState: GameState,
  position: number,
  playerSymbol: string,
  isConnected: boolean = true,
  isMovePending: boolean = false
): boolean => {
  return (
    isConnected &&
    !isMovePending &&
    gameState.isActive &&
    gameState.board[position] === null &&
    gameState.currentTurn === playerSymbol &&
    !gameState.winner &&
    !gameState.isDraw
  );
};

/**
 * Get the current player based on symbol
 */
export const getCurrentPlayer = (
  players: Player[],
  symbol: string
): Player | undefined => {
  return players.find(p => p.symbol === symbol);
};

/**
 * Get player by name
 */
export const getPlayerByName = (
  players: Player[],
  playerName: string
): Player | undefined => {
  return players.find(p => p.name === playerName);
};

/**
 * Get the opponent player for a given player name
 */
export const getOpponentPlayer = (
  players: Player[],
  playerName: string
): Player | undefined => {
  return players.find(p => p.name !== playerName);
};

/**
 * Get the winner player from the game state
 */
export const getWinnerPlayer = (
  players: Player[],
  gameState: GameState
): Player | undefined => {
  if (!gameState.winner) return undefined;
  return players.find(p => p.symbol === gameState.winner);
};

/**
 * Check if it's the current player's turn
 */
export const isPlayerTurn = (
  players: Player[],
  playerName: string,
  gameState: GameState
): boolean => {
  const player = players.find(p => p.name === playerName);
  return player?.symbol === gameState.currentTurn;
};

/**
 * Format player display name with decoding
 */
export const formatPlayerName = (playerName: string): string => {
  return decodeURIComponent(playerName);
};

/**
 * Get player statistics based on their position in the game session
 */
interface GameSession {
  player1Wins: number;
  player2Wins: number;
  draws: number;
  totalRounds: number;
}

export const getPlayerStats = (
  gameSession: GameSession | null,
  playerSymbol: string,
  statType: "wins" | "losses"
) => {
  if (!gameSession) return 0;

  const isPlayer1 = playerSymbol === "X";

  if (statType === "wins") {
    return isPlayer1 ? gameSession.player1Wins : gameSession.player2Wins;
  } else {
    return isPlayer1 ? gameSession.player2Wins : gameSession.player1Wins;
  }
};

/**
 * Generate game status message
 */
export const getGameStatusMessage = (
  gameState: GameState,
  players: Player[],
  currentPlayerName: string,
  isMovePending: boolean = false
): { title: string; subtitle: string } => {
  if (isMovePending) {
    return {
      title: "Processing move...",
      subtitle: "Please wait...",
    };
  }

  if (gameState.winner) {
    const winner = getWinnerPlayer(players, gameState);
    return {
      title: `${winner?.name || "Unknown"} Wins!`,
      subtitle: "Round complete",
    };
  }

  if (gameState.isDraw) {
    return {
      title: "It's a Draw!",
      subtitle: "Nobody wins this round",
    };
  }

  const isMyTurn = isPlayerTurn(players, currentPlayerName, gameState);
  const currentTurnPlayer = getCurrentPlayer(players, gameState.currentTurn);

  if (isMyTurn) {
    return {
      title: "Your Turn",
      subtitle: "Click a square to make your move",
    };
  }

  return {
    title: `${currentTurnPlayer?.name || "Opponent"}'s Turn`,
    subtitle: "Wait for your opponent",
  };
};
