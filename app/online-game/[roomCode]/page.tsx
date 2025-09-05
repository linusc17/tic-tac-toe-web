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
  Play,
  Clock,
  CheckCircle,
  User,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import FloatingChat from "@/components/FloatingChat";
import { ChatMessage } from "@/src/types/chat";
import { GameSession } from "@/src/types/game";

interface OnlineGameProps {
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

export default function OnlineGamePage({ params }: OnlineGameProps) {
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
  const [showRoundEnd, setShowRoundEnd] = useState(false);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [readyStatus, setReadyStatus] = useState({
    readyCount: 0,
    totalPlayers: 2,
    playerReady: "",
  });

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

      newSocket.emit(
        "join_existing_room",
        roomCode,
        decodeURIComponent(playerName),
        playerSymbol,
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            setConnectionError(response.error || "Failed to join room");
          }
        }
      );
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
      (data: { players: Player[]; gameState: GameState; gameSession: GameSession | null }) => {
        setPlayers(data.players);
        setGameState(data.gameState);
        if (data.gameSession) {
          setGameSession(data.gameSession);
        }
        setWaitingForPlayer(false);
      }
    );

    newSocket.on(
      "move_made",
      (data: {
        position: number;
        player: string;
        gameState: GameState;
        gameSession?: GameSession;
      }) => {
        setGameState(data.gameState);
        if (data.gameSession) {
          setGameSession(data.gameSession);
        }
        if (data.gameState.winner || data.gameState.isDraw) {
          setShowRoundEnd(true);
        }
      }
    );

    newSocket.on("player_disconnected", () => {
      setConnectionError("Other player disconnected");
      setIsConnected(false);
    });

    newSocket.on(
      "new_round_started",
      (data: { gameState: GameState; players: Player[]; gameSession: GameSession | null }) => {
        setGameState(data.gameState);
        setPlayers(data.players);
        if (data.gameSession) {
          setGameSession(data.gameSession);
        }
        setShowRoundEnd(false);
        setIsPlayerReady(false);
        setReadyStatus({ readyCount: 0, totalPlayers: 2, playerReady: "" });
      }
    );

    newSocket.on(
      "player_ready_status",
      (data: {
        readyCount: number;
        totalPlayers: number;
        playerReady: string;
      }) => {
        setReadyStatus(data);
      }
    );

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
      gameState.currentTurn !== getCurrentPlayerSymbol()
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

  const getCurrentPlayerSymbol = () => {
    const currentPlayer = players.find(
      (p) => p.name === decodeURIComponent(playerName)
    );
    return currentPlayer?.symbol || playerSymbol;
  };

  const getOpponentName = () => {
    const currentSymbol = getCurrentPlayerSymbol();
    return (
      players.find((p) => p.symbol !== currentSymbol)?.name || "Waiting..."
    );
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

  const isMyTurn = () => gameState.currentTurn === getCurrentPlayerSymbol();

  const handlePlayerReady = () => {
    if (!socket || isPlayerReady) return;

    setIsPlayerReady(true);
    socket.emit("player_ready", roomCode);
  };

  const handleStop = () => {
    router.push("/");
  };

  const handleNewChatMessage = (message: ChatMessage) => {
    setChatMessages((prev) => [...prev, message]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/online")}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Online
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Online Game
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
                      You ({getCurrentPlayerSymbol()})
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

                {gameSession && (
                  <div className="grid grid-cols-4 gap-2 text-center border-t pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Your Wins</p>
                      <p className="text-lg font-bold text-green-600">
                        {getCurrentPlayerSymbol() === "X"
                          ? gameSession.player1Wins
                          : gameSession.player2Wins}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Opponent Wins
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {getCurrentPlayerSymbol() === "X"
                          ? gameSession.player2Wins
                          : gameSession.player1Wins}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Draws</p>
                      <p className="text-lg font-bold text-muted-foreground">
                        {gameSession.draws}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rounds</p>
                      <p className="text-lg font-bold">
                        {gameSession.totalRounds}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {connectionError && (
            <Card className="mb-8 border-red-500">
              <CardContent>
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
                          : `${getCurrentTurnName()}'s Turn`}
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

                {showRoundEnd && (
                  <div className="text-center space-y-4 p-6 bg-secondary/50 rounded-lg">
                    <p className="text-lg font-medium">Round Complete!</p>

                    {readyStatus.readyCount === 2 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 animate-pulse" />
                          <p className="text-green-600 font-medium">
                            Starting new round...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center justify-center gap-2 p-2 bg-background/50 rounded">
                            {isPlayerReady ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-xs">
                              {decodeURIComponent(playerName)}{" "}
                              {isPlayerReady ? "Ready" : "Not Ready"}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-2 p-2 bg-background/50 rounded">
                            {(() => {
                              const opponentReady = isPlayerReady
                                ? readyStatus.readyCount === 2
                                : readyStatus.readyCount >= 1;

                              if (opponentReady) {
                                return (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                );
                              } else {
                                return (
                                  <User className="h-4 w-4 text-muted-foreground" />
                                );
                              }
                            })()}
                            <span className="text-xs">
                              {getOpponentName()}{" "}
                              {(() => {
                                const opponentReady = isPlayerReady
                                  ? readyStatus.readyCount === 2
                                  : readyStatus.readyCount >= 1;
                                return opponentReady ? "Ready" : "Not Ready";
                              })()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-4 justify-center">
                          <Button
                            onClick={handlePlayerReady}
                            size="lg"
                            disabled={isPlayerReady}
                            className={isPlayerReady ? "opacity-75" : ""}
                          >
                            {isPlayerReady ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 animate-pulse" />
                                Continue ({readyStatus.readyCount}/2)
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Continue
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleStop}
                            variant="outline"
                            size="lg"
                          >
                            Back to Home
                          </Button>
                        </div>

                        {isPlayerReady && (
                          <p className="text-xs text-muted-foreground animate-in fade-in duration-500">
                            Waiting for {getOpponentName()} to continue...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <FloatingChat
            socket={socket}
            roomCode={roomCode}
            playerName={playerName}
            isVisible={!waitingForPlayer}
            chatMessages={chatMessages}
            onNewMessage={handleNewChatMessage}
          />
        </div>
      </div>
    </div>
  );
}
