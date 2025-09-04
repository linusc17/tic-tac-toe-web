"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Copy,
  Wifi,
  WifiOff,
  Trophy,
  HandHeart,
} from "lucide-react";
import { io, Socket } from "socket.io-client";

interface MultiplayerGameProps {
  params: Promise<{ roomCode: string }>;
}

interface GameState {
  board: (string | null)[];
  currentTurn: string;
  winner: string | null;
  isDraw: boolean;
  isActive: boolean;
}

interface Player {
  id: string;
  name: string;
  symbol: string;
}

export default function MultiplayerGamePage({ params }: MultiplayerGameProps) {
  const { roomCode } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const playerSymbol = searchParams.get("symbol") || "X";
  const playerName = searchParams.get("name") || "Player";

  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentTurn: "X",
    winner: null,
    isDraw: false,
    isActive: false,
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [waitingForPlayer, setWaitingForPlayer] = useState(true);
  const [connectionError, setConnectionError] = useState("");

  useEffect(() => {
    const newSocket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
      {
        transports: ["websocket"],
      }
    );

    newSocket.on("connect", () => {
      setIsConnected(true);
      setConnectionError("");

      if (playerSymbol === "X") {
        newSocket.emit(
          "create_room",
          decodeURIComponent(playerName),
          (response: { success: boolean; error?: string }) => {
            if (!response.success) {
              setConnectionError("Failed to create room");
            }
          }
        );
      } else {
        newSocket.emit(
          "join_room",
          roomCode,
          decodeURIComponent(playerName),
          (response: { success: boolean; error?: string }) => {
            if (!response.success) {
              setConnectionError(response.error || "Failed to join room");
            }
          }
        );
      }
    });

    newSocket.on("connect_error", () => {
      setIsConnected(false);
      setConnectionError("Connection failed");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on(
      "game_ready",
      (data: { players: Player[]; gameState: GameState }) => {
        setPlayers(data.players);
        setGameState(data.gameState);
        setWaitingForPlayer(false);
      }
    );

    newSocket.on(
      "move_made",
      (data: { position: number; player: string; gameState: GameState }) => {
        setGameState(data.gameState);
      }
    );

    newSocket.on("player_disconnected", () => {
      setConnectionError("Other player disconnected");
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomCode, playerName, playerSymbol]);

  const handleCellClick = (index: number) => {
    if (
      !socket ||
      !isConnected ||
      !gameState.isActive ||
      gameState.board[index] !== null ||
      gameState.currentTurn !== playerSymbol
    ) {
      return;
    }

    socket.emit(
      "make_move",
      roomCode,
      index,
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          console.error("Move failed:", response.error);
        }
      }
    );
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  const getOpponentName = () => {
    return players.find((p) => p.symbol !== playerSymbol)?.name || "Waiting...";
  };

  const getCurrentTurnName = () => {
    const currentPlayer = players.find(
      (p) => p.symbol === gameState.currentTurn
    );
    return currentPlayer?.name || "Unknown";
  };

  const getWinnerName = () => {
    if (!gameState.winner) return null;
    const winner = players.find((p) => p.symbol === gameState.winner);
    return winner?.name || "Unknown";
  };

  const isMyTurn = () => gameState.currentTurn === playerSymbol;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/multiplayer")}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Multiplayer
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Multiplayer Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <Wifi className="h-5 w-5 text-green-500" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm">
                      {isConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Room: {roomCode}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyRoomCode}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      You ({playerSymbol})
                    </p>
                    <p className="text-lg font-semibold">
                      {decodeURIComponent(playerName)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Opponent</p>
                    <p className="text-lg font-semibold">{getOpponentName()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {connectionError && (
            <Card className="mb-8 border-red-500">
              <CardContent className="pt-6">
                <p className="text-red-500 text-center">{connectionError}</p>
              </CardContent>
            </Card>
          )}

          {waitingForPlayer && !connectionError && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <p className="text-center text-lg">
                  Waiting for another player to join...
                </p>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Share room code: <strong>{roomCode}</strong>
                </p>
              </CardContent>
            </Card>
          )}

          {!waitingForPlayer && !connectionError && (
            <Card>
              <CardHeader>
                <div className="text-center">
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
                    <div>
                      <p className="text-xl font-semibold">
                        {isMyTurn()
                          ? "Your Turn"
                          : `${getCurrentTurnName()}&apos;s Turn`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isMyTurn()
                          ? "Click a square to make your move"
                          : "Wait for your opponent"}
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto mb-8">
                  {gameState.board.map((cell, index) => (
                    <button
                      key={index}
                      onClick={() => handleCellClick(index)}
                      className={`aspect-square bg-secondary hover:bg-secondary/80 rounded-lg flex items-center justify-center text-4xl font-bold transition-colors ${
                        !isMyTurn() ||
                        gameState.winner ||
                        gameState.isDraw ||
                        !gameState.isActive
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }`}
                      disabled={
                        !isMyTurn() ||
                        !!gameState.winner ||
                        gameState.isDraw ||
                        !gameState.isActive
                      }
                    >
                      {cell}
                    </button>
                  ))}
                </div>

                {(gameState.winner || gameState.isDraw) && (
                  <div className="text-center">
                    <Button onClick={() => router.push("/")} size="lg">
                      Back to Home
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
