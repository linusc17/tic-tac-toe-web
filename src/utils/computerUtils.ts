/**
 * Computer utility functions for tic-tac-toe computer opponent
 */

export type ComputerDifficulty = "easy" | "medium" | "hard";

export interface ComputerMove {
  position: number;
  score?: number;
}

/**
 * Get all available moves on the board
 */
const getAvailableMoves = (board: (string | null)[]): number[] => {
  return board.reduce<number[]>((moves, cell, index) => {
    if (cell === null) moves.push(index);
    return moves;
  }, []);
};

/**
 * Check if there's a winning move available
 */
const findWinningMove = (
  board: (string | null)[],
  player: string
): number | null => {
  const availableMoves = getAvailableMoves(board);

  for (const move of availableMoves) {
    const testBoard = [...board];
    testBoard[move] = player;

    if (checkWinner(testBoard) === player) {
      return move;
    }
  }

  return null;
};

/**
 * Simple winner check function
 */
const checkWinner = (board: (string | null)[]): string | null => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // horizontal
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // vertical
    [0, 4, 8],
    [2, 4, 6], // diagonal
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
};

/**
 * Check if the board is full (draw)
 */
const isBoardFull = (board: (string | null)[]): boolean => {
  return board.every(cell => cell !== null);
};

/**
 * Easy Computer: Makes random moves
 */
const getEasyMove = (board: (string | null)[]): ComputerMove => {
  const availableMoves = getAvailableMoves(board);
  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  return { position: availableMoves[randomIndex] };
};

/**
 * Medium Computer: Basic strategy with some randomness
 * 1. Win if possible
 * 2. Block opponent from winning
 * 3. Take center if available
 * 4. Take corners if available
 * 5. Random move otherwise
 */
const getMediumMove = (board: (string | null)[], computerPlayer: string): ComputerMove => {
  const humanPlayer = computerPlayer === "X" ? "O" : "X";

  // 1. Try to win
  const winningMove = findWinningMove(board, computerPlayer);
  if (winningMove !== null) {
    return { position: winningMove };
  }

  // 2. Block opponent from winning
  const blockingMove = findWinningMove(board, humanPlayer);
  if (blockingMove !== null) {
    return { position: blockingMove };
  }

  // 3. Take center if available
  if (board[4] === null) {
    return { position: 4 };
  }

  // 4. Take corners if available
  const corners = [0, 2, 6, 8];
  const availableCorners = corners.filter(corner => board[corner] === null);
  if (availableCorners.length > 0) {
    const randomCorner =
      availableCorners[Math.floor(Math.random() * availableCorners.length)];
    return { position: randomCorner };
  }

  // 5. Take any available edge
  const edges = [1, 3, 5, 7];
  const availableEdges = edges.filter(edge => board[edge] === null);
  if (availableEdges.length > 0) {
    const randomEdge =
      availableEdges[Math.floor(Math.random() * availableEdges.length)];
    return { position: randomEdge };
  }

  // Fallback to random move
  return getEasyMove(board);
};

/**
 * Hard Computer: Minimax algorithm for optimal play
 */
const getHardMove = (board: (string | null)[], computerPlayer: string): ComputerMove => {
  const humanPlayer = computerPlayer === "X" ? "O" : "X";

  const minimax = (
    board: (string | null)[],
    depth: number,
    isMaximizing: boolean,
    alpha: number = -Infinity,
    beta: number = Infinity
  ): number => {
    const winner = checkWinner(board);

    // Terminal cases
    if (winner === computerPlayer) return 10 - depth;
    if (winner === humanPlayer) return depth - 10;
    if (isBoardFull(board)) return 0;

    const availableMoves = getAvailableMoves(board);

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const move of availableMoves) {
        board[move] = computerPlayer;
        const score = minimax(board, depth + 1, false, alpha, beta);
        board[move] = null;
        maxScore = Math.max(score, maxScore);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const move of availableMoves) {
        board[move] = humanPlayer;
        const score = minimax(board, depth + 1, true, alpha, beta);
        board[move] = null;
        minScore = Math.min(score, minScore);
        beta = Math.min(beta, score);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return minScore;
    }
  };

  let bestMove = -1;
  let bestScore = -Infinity;
  const availableMoves = getAvailableMoves(board);

  for (const move of availableMoves) {
    board[move] = computerPlayer;
    const score = minimax(board, 0, false);
    board[move] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return { position: bestMove, score: bestScore };
};

/**
 * Get computer move based on difficulty level
 */
export const getComputerMove = (
  board: (string | null)[],
  computerPlayer: string,
  difficulty: ComputerDifficulty = "medium"
): ComputerMove => {
  switch (difficulty) {
    case "easy":
      return getEasyMove(board);
    case "medium":
      return getMediumMove(board, computerPlayer);
    case "hard":
      return getHardMove(board, computerPlayer);
    default:
      return getMediumMove(board, computerPlayer);
  }
};

/**
 * Get a random delay for computer move to simulate thinking
 */
export const getComputerThinkingDelay = (difficulty: ComputerDifficulty): number => {
  switch (difficulty) {
    case "easy":
      return Math.random() * 500 + 300; // 300-800ms
    case "medium":
      return Math.random() * 1000 + 500; // 500-1500ms
    case "hard":
      return Math.random() * 1500 + 800; // 800-2300ms
    default:
      return 1000;
  }
};

/**
 * Get difficulty display name
 */
export const getDifficultyDisplayName = (difficulty: ComputerDifficulty): string => {
  switch (difficulty) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    default:
      return "Medium";
  }
};

/**
 * Get difficulty description
 */
export const getDifficultyDescription = (difficulty: ComputerDifficulty): string => {
  switch (difficulty) {
    case "easy":
      return "Computer makes random moves";
    case "medium":
      return "Computer uses basic strategy";
    case "hard":
      return "Computer plays optimally (unbeatable)";
    default:
      return "Computer uses basic strategy";
  }
};
