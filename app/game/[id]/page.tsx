"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RotateCcw, Trophy, HandHeart } from "lucide-react";
import { GameSession, GameState } from "@/src/types/game";
import { toast } from "sonner";
import {
  WinningLineOverlay,
  AnimatedCell,
  BoardContainer,
} from "@/src/components/animations";
import { checkWinnerWithLine, WinningLine } from "@/src/utils/gameUtils";

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
  const [winningLine, setWinningLine] = useState<WinningLine | null>(null);
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
        toast.error("Game not found");
        router.push("/");
      }
    } catch {
      toast.error("Failed to load game");
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchGameSession();
  }, [fetchGameSession]);

  const handleCellClick = (index: number) => {
    if (gameState.board[index] || gameState.winner || gameState.isDraw) {
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
      setPlayer1IsX(!player1IsX);
      setGameState({
        board: Array(9).fill(null),
        currentPlayer: "X",
        winner: null,
        isDraw: false,
      });
      setWinningLine(null);
      setShowRoundEnd(false);
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
  };

  if (loading) {
    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground mt-4">Loading game...</p>
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
                    {gameSession.player1Name} ({player1IsX ? "X" : "O"}) Wins
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {gameSession.player1Wins}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {gameSession.player2Name} ({player1IsX ? "O" : "X"}) Wins
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
                    return (
                      <AnimatedCell
                        key={index}
                        isWinning={isWinning}
                        onClick={() => handleCellClick(index)}
                        disabled={
                          !!cell || !!gameState.winner || gameState.isDraw
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
