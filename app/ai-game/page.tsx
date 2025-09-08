"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  HandHeart,
  Bot,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { GameSession, GameState } from "@/src/types/game";
import { toast } from "sonner";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  WinningLineOverlay,
  AnimatedCell,
  BoardContainer,
} from "@/src/components/animations";
import { checkWinnerWithLine, WinningLine } from "@/src/utils/gameUtils";
import {
  getComputerMove,
  getComputerThinkingDelay,
  getDifficultyDisplayName,
  getDifficultyDescription,
  ComputerDifficulty,
} from "@/src/utils/computerUtils";

export default function ComputerGamePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
    isDraw: false,
  });
  const [winningLine, setWinningLine] = useState<WinningLine | null>(null);
  const [showRoundEnd, setShowRoundEnd] = useState(false);
  const [playerIsX, setPlayerIsX] = useState(true);
  const [difficulty, setDifficulty] = useState<ComputerDifficulty>("medium");
  const [computerThinking, setComputerThinking] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState("");

  // Auto-populate player name if user is logged in
  useEffect(() => {
    if (user && !playerName) {
      setPlayerName(user.username);
    }
  }, [user, playerName]);
  const [lastComputerMove, setLastComputerMove] = useState<number | null>(null);

  // Initialize game session
  const initializeGame = useCallback(async () => {
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/games`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("token") && {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }),
          },
          body: JSON.stringify({
            player1Name: playerName.trim(),
            player2Name: `Computer (${getDifficultyDisplayName(difficulty)})`,
            ...(user && { player1Id: user._id }),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setGameSession(result.data || result);
        setGameStarted(true);
        toast.success("Game started!");
      } else {
        toast.error("Failed to create game session");
      }
    } catch (error) {
      console.error("Failed to create game session:", error);
      toast.error("Failed to create game session");
    }
  }, [playerName, difficulty]);

  // Handle human player move
  const handleCellClick = (index: number) => {
    if (
      gameState.board[index] ||
      gameState.winner ||
      gameState.isDraw ||
      computerThinking ||
      !gameStarted
    ) {
      return;
    }

    // Check if it's the human player's turn
    const isHumanTurn = playerIsX
      ? gameState.currentPlayer === "X"
      : gameState.currentPlayer === "O";

    if (!isHumanTurn) {
      return;
    }

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentPlayer;

    const { winner, winningLine: newWinningLine } =
      checkWinnerWithLine(newBoard);
    const isDraw = !winner && newBoard.every(cell => cell !== null);

    setGameState({
      board: newBoard,
      currentPlayer: gameState.currentPlayer === "X" ? "O" : "X",
      winner,
      isDraw,
    });

    setWinningLine(newWinningLine);
    setLastComputerMove(null); // Clear computer move highlight when human moves

    if (winner || isDraw) {
      setShowRoundEnd(true);
    }
  };

  // Handle computer move
  const handleComputerMove = useCallback(async () => {
    if (gameState.winner || gameState.isDraw || !gameStarted) return;

    const isComputerTurn = playerIsX
      ? gameState.currentPlayer === "O"
      : gameState.currentPlayer === "X";

    if (!isComputerTurn) return;

    setComputerThinking(true);

    // Get computer thinking delay
    const delay = getComputerThinkingDelay(difficulty);

    setTimeout(() => {
      const computerPlayer = playerIsX ? "O" : "X";
      const computerMove = getComputerMove(gameState.board, computerPlayer, difficulty);

      if (computerMove.position !== -1) {
        const newBoard = [...gameState.board];
        newBoard[computerMove.position] = computerPlayer;

        const { winner, winningLine: newWinningLine } =
          checkWinnerWithLine(newBoard);
        const isDraw = !winner && newBoard.every(cell => cell !== null);

        setGameState({
          board: newBoard,
          currentPlayer: computerPlayer === "X" ? "O" : "X",
          winner,
          isDraw,
        });

        setWinningLine(newWinningLine);
        setLastComputerMove(computerMove.position); // Highlight computer's move

        if (winner || isDraw) {
          setShowRoundEnd(true);
        }

        // Clear computer move highlight after 3 seconds
        setTimeout(() => {
          setLastComputerMove(null);
        }, 3000);
      }

      setComputerThinking(false);
    }, delay);
  }, [gameState, playerIsX, difficulty, gameStarted]);

  // Trigger computer move when it's computer's turn
  useEffect(() => {
    if (!computerThinking && !gameState.winner && !gameState.isDraw && gameStarted) {
      const isComputerTurn = playerIsX
        ? gameState.currentPlayer === "O"
        : gameState.currentPlayer === "X";

      if (isComputerTurn) {
        handleComputerMove();
      }
    }
  }, [gameState, playerIsX, computerThinking, gameStarted, handleComputerMove]);

  // Update game session
  const updateGameSession = async (winner: string | null, isDraw: boolean) => {
    if (!gameSession) return;

    // Use GameStatsService mechanism for proper stats tracking
    const gameResult = {
      winner: winner
        ? (playerIsX && winner === "X") || (!playerIsX && winner === "O")
          ? "player1"
          : "player2"
        : "draw",
      board: gameState.board,
      moves: [], // Could track detailed moves if needed
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/games/${gameSession.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("token") && {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }),
          },
          body: JSON.stringify({ gameResult }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setGameSession(result.data || result);
        // Trigger user stats refresh in header
        window.dispatchEvent(new CustomEvent("userStatsUpdated"));
      } else {
        toast.error("Failed to update game session");
      }
    } catch (error) {
      console.error("Failed to update game session:", error);
      toast.error("Failed to update game session");
    }
  };

  const handleContinue = async () => {
    try {
      await updateGameSession(gameState.winner, gameState.isDraw);
      setPlayerIsX(!playerIsX);
      setGameState({
        board: Array(9).fill(null),
        currentPlayer: "X",
        winner: null,
        isDraw: false,
      });
      setWinningLine(null);
      setShowRoundEnd(false);
      setLastComputerMove(null);
    } catch (error) {
      console.error("Error in handleContinue:", error);
      toast.error("Failed to continue game");
    }
  };

  const handleStop = async () => {
    await updateGameSession(gameState.winner, gameState.isDraw);
    router.push("/");
  };

  const resetRound = () => {
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: "X",
      winner: null,
      isDraw: false,
    });
    setWinningLine(null);
    setShowRoundEnd(false);
    setComputerThinking(false);
    setLastComputerMove(null);
  };

  const getCurrentPlayerName = () => {
    const isCurrentPlayerX = gameState.currentPlayer === "X";
    const isHumanTurn =
      (playerIsX && isCurrentPlayerX) || (!playerIsX && !isCurrentPlayerX);

    return isHumanTurn
      ? playerName
      : `Computer (${getDifficultyDisplayName(difficulty)})`;
  };

  const getWinnerName = () => {
    if (!gameState.winner) return null;
    const isWinnerX = gameState.winner === "X";
    const humanWon = (playerIsX && isWinnerX) || (!playerIsX && !isWinnerX);

    return humanWon
      ? playerName
      : `Computer (${getDifficultyDisplayName(difficulty)})`;
  };

  // Setup screen
  if (!gameStarted) {
    return (
      <div className="bg-background text-foreground min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-center text-2xl">
                  <Bot className="h-8 w-8" />
                  vs Computer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Your Name</label>
                  <input
                    type="text"
                    placeholder={user ? user.username : "Enter your name"}
                    className={`border-input mt-1 w-full rounded-md border px-3 py-2 ${
                      user
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-background"
                    }`}
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && initializeGame()}
                    maxLength={50}
                    disabled={!!user}
                    readOnly={!!user}
                  />
                  {user && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Playing as {user.username} (logged in)
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Computer Difficulty</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="mt-1 w-full justify-between"
                      >
                        <span>{getDifficultyDisplayName(difficulty)}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-full">
                      <DropdownMenuItem onClick={() => setDifficulty("easy")}>
                        <div>
                          <div className="font-medium">Easy</div>
                          <div className="text-muted-foreground text-xs">
                            {getDifficultyDescription("easy")}
                          </div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDifficulty("medium")}>
                        <div>
                          <div className="font-medium">Medium</div>
                          <div className="text-muted-foreground text-xs">
                            {getDifficultyDescription("medium")}
                          </div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDifficulty("hard")}>
                        <div>
                          <div className="font-medium">Hard</div>
                          <div className="text-muted-foreground text-xs">
                            {getDifficultyDescription("hard")}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Button
                  onClick={initializeGame}
                  className="w-full"
                  size="lg"
                  disabled={!playerName.trim()}
                >
                  Start Game
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mx-auto max-w-2xl">
          {gameSession && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-center text-2xl">
                  {gameSession.player1Name} vs {gameSession.player2Name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {gameSession.player1Name} ({playerIsX ? "X" : "O"}) Wins
                    </p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {gameSession.player1Wins}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {gameSession.player2Name} ({playerIsX ? "O" : "X"}) Wins
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {gameSession.player2Wins}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Draws</p>
                    <p className="text-muted-foreground text-2xl font-bold">
                      {gameSession.draws}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Rounds</p>
                    <p className="text-2xl font-bold">
                      {gameSession.totalRounds}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  {gameState.winner ? (
                    <p className="flex items-center justify-center gap-2 text-xl font-semibold text-green-600">
                      <Trophy className="h-6 w-6" />
                      {getWinnerName()} Wins!
                    </p>
                  ) : gameState.isDraw ? (
                    <p className="flex items-center justify-center gap-2 text-xl font-semibold text-yellow-600">
                      <HandHeart className="h-6 w-6" />
                      It&apos;s a Draw!
                    </p>
                  ) : computerThinking ? (
                    <p className="flex items-center justify-center gap-2 text-xl font-semibold text-blue-600">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Computer is thinking...
                    </p>
                  ) : (
                    <p className="text-xl font-semibold">
                      {getCurrentPlayerName()}&apos;s Turn (
                      {gameState.currentPlayer})
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetRound}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Round
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <BoardContainer
                hasWinner={!!gameState.winner}
                isDraw={gameState.isDraw}
                className="mb-8"
              >
                <div className="relative mx-auto grid max-w-sm grid-cols-3 gap-2">
                  {gameState.board.map((cell, index) => {
                    const isWinning =
                      winningLine?.positions.includes(index) || false;
                    const isComputerMove = lastComputerMove === index;
                    return (
                      <AnimatedCell
                        key={index}
                        isWinning={isWinning}
                        isComputerMove={isComputerMove}
                        onClick={() => handleCellClick(index)}
                        disabled={
                          !!cell ||
                          !!gameState.winner ||
                          gameState.isDraw ||
                          computerThinking
                        }
                      >
                        {cell}
                      </AnimatedCell>
                    );
                  })}
                  <WinningLineOverlay winningLine={winningLine} />
                </div>
              </BoardContainer>

              {showRoundEnd && (
                <div className="bg-secondary/50 space-y-4 rounded-lg p-6 text-center">
                  <p className="text-lg font-medium">Round Complete!</p>
                  <div className="flex justify-center gap-4">
                    <Button onClick={handleContinue} size="lg">
                      Continue Playing
                    </Button>
                    <Button onClick={handleStop} variant="outline" size="lg">
                      Stop Game
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
