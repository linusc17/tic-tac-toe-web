"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RotateCcw, Trophy, HandHeart } from "lucide-react";
import { GameSession, GameState } from "@/src/types/game";

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export default function GamePage({ params }: GamePageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
    isDraw: false,
  });
  const [loading, setLoading] = useState(true);
  const [showRoundEnd, setShowRoundEnd] = useState(false);
  const [player1IsX, setPlayer1IsX] = useState(true);

  const fetchGameSession = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/games/${id}`
      );
      if (response.ok) {
        const result = await response.json();
        setGameSession(result.data || result);
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchGameSession();
  }, [fetchGameSession]);

  const checkWinner = (board: (string | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  const handleCellClick = (index: number) => {
    if (gameState.board[index] || gameState.winner || gameState.isDraw) {
      return;
    }

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentPlayer;

    const winner = checkWinner(newBoard);
    const isDraw = !winner && newBoard.every((cell) => cell !== null);

    setGameState({
      board: newBoard,
      currentPlayer: gameState.currentPlayer === "X" ? "O" : "X",
      winner,
      isDraw,
    });

    if (winner || isDraw) {
      setShowRoundEnd(true);
    }
  };

  const updateGameSession = async (winner: string | null, isDraw: boolean) => {
    if (!gameSession) return;

    const updates: Partial<GameSession> = {
      totalRounds: gameSession.totalRounds + 1,
    };

    if (winner) {
      const winnerIsX = winner === "X";
      const player1Won =
        (player1IsX && winnerIsX) || (!player1IsX && !winnerIsX);

      if (player1Won) {
        updates.player1Wins = gameSession.player1Wins + 1;
      } else {
        updates.player2Wins = gameSession.player2Wins + 1;
      }
    } else if (isDraw) {
      updates.draws = gameSession.draws + 1;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/games/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setGameSession(result.data || result);
      }
    } catch (error) {
      console.error("Failed to update game session:", error);
    }
  };

  const handleContinue = async () => {
    try {
      await updateGameSession(gameState.winner, gameState.isDraw);
      setPlayer1IsX(!player1IsX);
      setGameState({
        board: Array(9).fill(null),
        currentPlayer: "X",
        winner: null,
        isDraw: false,
      });
      setShowRoundEnd(false);
    } catch (error) {
      console.error("Error in handleContinue:", error);
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
    setShowRoundEnd(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!gameSession) {
    return null;
  }

  const getCurrentPlayerName = () => {
    const isCurrentPlayerX = gameState.currentPlayer === "X";
    return (player1IsX && isCurrentPlayerX) ||
      (!player1IsX && !isCurrentPlayerX)
      ? gameSession.player1Name
      : gameSession.player2Name;
  };

  const getWinnerName = () => {
    if (!gameState.winner) return null;
    const isWinnerX = gameState.winner === "X";
    return (player1IsX && isWinnerX) || (!player1IsX && !isWinnerX)
      ? gameSession.player1Name
      : gameSession.player2Name;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {gameSession.player1Name} vs {gameSession.player2Name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {gameSession.player1Name} ({player1IsX ? "X" : "O"}) Wins
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {gameSession.player1Wins}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {gameSession.player2Name} ({player1IsX ? "O" : "X"}) Wins
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {gameSession.player2Wins}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Draws</p>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {gameSession.draws}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rounds</p>
                  <p className="text-2xl font-bold">
                    {gameSession.totalRounds}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  {gameState.winner ? (
                    <p className="text-xl font-semibold text-green-600 flex items-center justify-center gap-2">
                      <Trophy className="h-6 w-6" />
                      {getWinnerName()} Wins!
                    </p>
                  ) : gameState.isDraw ? (
                    <p className="text-xl font-semibold text-yellow-600 flex items-center justify-center gap-2">
                      <HandHeart className="h-6 w-6" />
                      It&apos;s a Draw!
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
              <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto mb-8">
                {gameState.board.map((cell, index) => (
                  <button
                    key={index}
                    onClick={() => handleCellClick(index)}
                    className="aspect-square bg-secondary hover:bg-secondary/80 rounded-lg flex items-center justify-center text-4xl font-bold transition-colors disabled:opacity-50"
                    disabled={!!cell || !!gameState.winner || gameState.isDraw}
                  >
                    {cell}
                  </button>
                ))}
              </div>

              {showRoundEnd && (
                <div className="text-center space-y-4 p-6 bg-secondary/50 rounded-lg">
                  <p className="text-lg font-medium">Round Complete!</p>
                  <div className="flex gap-4 justify-center">
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
