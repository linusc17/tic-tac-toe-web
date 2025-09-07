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
  player1Name: string;
  player2Name: string;
  player1Wins: number;
  player2Wins: number;
  draws: number;
  totalRounds: number;
}

export const getPlayerStats = (
  gameSession: GameSession | null,
  players: Player[],
  currentPlayerName: string,
  statType: "wins" | "losses"
) => {
  if (!gameSession) return 0;

  // Determine if current player is player1 or player2 based on name in GameSession
  const isPlayer1 =
    formatPlayerName(currentPlayerName) === gameSession.player1Name;

  if (statType === "wins") {
    return isPlayer1 ? gameSession.player1Wins : gameSession.player2Wins;
  } else {
    return isPlayer1 ? gameSession.player2Wins : gameSession.player1Wins;
  }
};

/**
 * Winning line interface for animations
 */
export interface WinningLine {
  positions: [number, number, number];
  direction: "horizontal" | "vertical" | "diagonal";
  lineIndex: number;
}

/**
 * Check for winning combinations and return winner with line details
 */
export const checkWinnerWithLine = (
  board: (string | null)[]
): {
  winner: string | null;
  winningLine: WinningLine | null;
} => {
  const lines = [
    // Horizontal lines
    {
      positions: [0, 1, 2] as [number, number, number],
      direction: "horizontal" as const,
      lineIndex: 0,
    },
    {
      positions: [3, 4, 5] as [number, number, number],
      direction: "horizontal" as const,
      lineIndex: 1,
    },
    {
      positions: [6, 7, 8] as [number, number, number],
      direction: "horizontal" as const,
      lineIndex: 2,
    },
    // Vertical lines
    {
      positions: [0, 3, 6] as [number, number, number],
      direction: "vertical" as const,
      lineIndex: 0,
    },
    {
      positions: [1, 4, 7] as [number, number, number],
      direction: "vertical" as const,
      lineIndex: 1,
    },
    {
      positions: [2, 5, 8] as [number, number, number],
      direction: "vertical" as const,
      lineIndex: 2,
    },
    // Diagonal lines
    {
      positions: [0, 4, 8] as [number, number, number],
      direction: "diagonal" as const,
      lineIndex: 0,
    },
    {
      positions: [2, 4, 6] as [number, number, number],
      direction: "diagonal" as const,
      lineIndex: 1,
    },
  ];

  for (const line of lines) {
    const [a, b, c] = line.positions;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a],
        winningLine: line,
      };
    }
  }

  return { winner: null, winningLine: null };
};

/**
 * Get SVG line coordinates for winning line animation
 */
export const getWinningLineCoordinates = (
  winningLine: WinningLine,
  cellSize: number = 100,
  gap: number = 8
): { x1: number; y1: number; x2: number; y2: number } => {
  const cellWithGap = cellSize + gap;
  const cellCenter = cellSize / 2;

  switch (winningLine.direction) {
    case "horizontal":
      const y = winningLine.lineIndex * cellWithGap + cellCenter;
      return {
        x1: cellCenter,
        y1: y,
        x2: cellSize * 3 + gap * 2 - cellCenter,
        y2: y,
      };

    case "vertical":
      const x = winningLine.lineIndex * cellWithGap + cellCenter;
      return {
        x1: x,
        y1: cellCenter,
        x2: x,
        y2: cellSize * 3 + gap * 2 - cellCenter,
      };

    case "diagonal":
      if (winningLine.lineIndex === 0) {
        // Top-left to bottom-right
        return {
          x1: cellCenter,
          y1: cellCenter,
          x2: cellSize * 3 + gap * 2 - cellCenter,
          y2: cellSize * 3 + gap * 2 - cellCenter,
        };
      } else {
        // Top-right to bottom-left
        return {
          x1: cellSize * 3 + gap * 2 - cellCenter,
          y1: cellCenter,
          x2: cellCenter,
          y2: cellSize * 3 + gap * 2 - cellCenter,
        };
      }
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
