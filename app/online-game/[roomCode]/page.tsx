"use client";

import { useState, use } from "react";
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
  Check,
} from "lucide-react";
import FloatingChat from "@/components/FloatingChat";
import { toast } from "sonner";

// Import our custom hooks and utilities
import { useSocket } from "@/src/hooks/useSocket";
import { useOnlineGame } from "@/src/hooks/useOnlineGame";
import {
  canMakeMove,
  getOpponentPlayer,
  getWinnerPlayer,
  getPlayerByName,
  getGameStatusMessage,
  getPlayerStats,
  formatPlayerName,
} from "@/src/utils/gameUtils";

interface OnlineGameProps {
  params: Promise<{ roomCode: string }>;
}

export default function OnlineGamePage({ params }: OnlineGameProps) {
  const { roomCode } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const playerSymbol = searchParams.get("symbol") || "X";
  const playerName = searchParams.get("name") || "Player";

  // Use our custom hooks
  const { socket, isConnected, isConnecting, connectionError } = useSocket();
  const {
    gameState,
    players,
    waitingForPlayer,
    showRoundEnd,
    gameSession,
    chatMessages,
    isPlayerReady,
    readyStatus,
    isMovePending,
    playerDisconnected,
    makeMove,
    setPlayerReady,
  } = useOnlineGame({ socket, roomCode, playerName, playerSymbol });

  const [isCopied, setIsCopied] = useState(false);

  // Handle cell clicks using the utility function and custom hook
  const handleCellClick = (index: number) => {
    const currentPlayerSymbol =
      getPlayerByName(players, formatPlayerName(playerName))?.symbol ||
      playerSymbol;

    if (
      !canMakeMove(
        gameState,
        index,
        currentPlayerSymbol,
        isConnected,
        isMovePending
      )
    ) {
      return;
    }

    makeMove(index);
  };

  const copyRoomCode = () => {
    if (isCopied) return;

    navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied to clipboard!");
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 5000);
  };

  // Use utility functions for game logic
  const currentPlayerSymbol =
    getPlayerByName(players, formatPlayerName(playerName))?.symbol ||
    playerSymbol;
  const opponent = getOpponentPlayer(players, formatPlayerName(playerName));
  const winner = getWinnerPlayer(players, gameState);
  const gameStatus = getGameStatusMessage(
    gameState,
    players,
    formatPlayerName(playerName),
    isMovePending
  );

  const handlePlayerReady = () => {
    setPlayerReady();
  };

  const handleStop = () => {
    router.push("/");
  };

  const handleNewChatMessage = () => {
    // Chat messages are now handled by the useOnlineGame hook
    // This function is kept for compatibility with FloatingChat
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/online")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Online
        </Button>

        <div className="mx-auto max-w-2xl">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                Online Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <Wifi className="h-5 w-5 text-green-500" />
                    ) : isConnecting ? (
                      <Wifi className="h-5 w-5 animate-pulse text-yellow-500" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm">
                      {isConnected
                        ? "Connected"
                        : isConnecting
                          ? "Connecting..."
                          : "Disconnected"}
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
                      disabled={isCopied}
                      className={`h-8 w-8 p-0 transition-colors ${
                        isCopied
                          ? "bg-green-100 text-green-600 hover:bg-green-100"
                          : ""
                      }`}
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      You ({currentPlayerSymbol})
                    </p>
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                      {formatPlayerName(playerName)}
                      {(() => {
                        const currentPlayer = getPlayerByName(
                          players,
                          formatPlayerName(playerName)
                        );
                        return (
                          currentPlayer?.userId && (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Opponent</p>
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                      {opponent?.name || "Waiting..."}
                      {opponent?.userId && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>

                {gameSession && (
                  <div className="grid grid-cols-4 gap-2 border-t pt-4 text-center">
                    <div>
                      <p className="text-muted-foreground text-xs">Your Wins</p>
                      <p className="text-lg font-bold text-green-600">
                        {getPlayerStats(
                          gameSession,
                          currentPlayerSymbol,
                          "wins"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Opponent Wins
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {getPlayerStats(
                          gameSession,
                          currentPlayerSymbol,
                          "losses"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Draws</p>
                      <p className="text-muted-foreground text-lg font-bold">
                        {gameSession.draws}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Rounds</p>
                      <p className="text-lg font-bold">
                        {gameSession.totalRounds}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(playerDisconnected || (connectionError && !isConnecting)) && (
            <Card className="mb-8 border-red-500">
              <CardContent>
                <p className="text-center text-lg text-red-500">
                  Other player disconnected
                </p>
                <div className="mt-4 flex justify-center">
                  <Button onClick={handleStop} size="lg">
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {waitingForPlayer && !connectionError && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <p className="text-center text-lg">
                  Waiting for another player to join...
                </p>
                <p className="text-muted-foreground mt-2 text-center text-sm">
                  Share room code: <strong>{roomCode}</strong>
                </p>
              </CardContent>
            </Card>
          )}

          {(!waitingForPlayer || isConnecting) &&
            !playerDisconnected &&
            !(connectionError && !isConnecting) && (
              <Card>
                <CardHeader>
                  <div className="text-center">
                    {gameState.winner ? (
                      <p className="flex items-center justify-center gap-2 text-xl font-semibold text-green-600">
                        <Trophy className="h-6 w-6" />
                        {winner?.name || "Unknown"} Wins!
                      </p>
                    ) : gameState.isDraw ? (
                      <p className="flex items-center justify-center gap-2 text-xl font-semibold text-yellow-600">
                        <HandHeart className="h-6 w-6" />
                        It&apos;s a Draw!
                      </p>
                    ) : (
                      <div>
                        <p className="text-xl font-semibold">
                          {gameStatus.title}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {gameStatus.subtitle}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mx-auto mb-8 grid max-w-sm grid-cols-3 gap-2">
                    {gameState.board.map((cell, index) => (
                      <button
                        key={index}
                        onClick={() => handleCellClick(index)}
                        className={`bg-secondary hover:bg-secondary/80 flex aspect-square items-center justify-center rounded-lg text-4xl font-bold transition-colors ${
                          !canMakeMove(
                            gameState,
                            index,
                            currentPlayerSymbol,
                            isConnected,
                            isMovePending
                          )
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                        disabled={
                          !canMakeMove(
                            gameState,
                            index,
                            currentPlayerSymbol,
                            isConnected,
                            isMovePending
                          )
                        }
                      >
                        {cell}
                      </button>
                    ))}
                  </div>

                  {showRoundEnd && (
                    <div className="bg-secondary/50 space-y-4 rounded-lg p-6 text-center">
                      <p className="text-lg font-medium">Round Complete!</p>

                      {readyStatus.readyCount === 2 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="h-5 w-5 animate-pulse text-green-600" />
                            <p className="font-medium text-green-600">
                              Starting new round...
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-background/50 flex items-center justify-center gap-2 rounded p-2">
                              {isPlayerReady ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <User className="text-muted-foreground h-4 w-4" />
                              )}
                              <span className="text-xs">
                                {formatPlayerName(playerName)}{" "}
                                {isPlayerReady ? "Ready" : "Not Ready"}
                              </span>
                            </div>
                            <div className="bg-background/50 flex items-center justify-center gap-2 rounded p-2">
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
                                    <User className="text-muted-foreground h-4 w-4" />
                                  );
                                }
                              })()}
                              <span className="text-xs">
                                {opponent?.name || "Waiting..."}{" "}
                                {(() => {
                                  const opponentReady = isPlayerReady
                                    ? readyStatus.readyCount === 2
                                    : readyStatus.readyCount >= 1;
                                  return opponentReady ? "Ready" : "Not Ready";
                                })()}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-center gap-4">
                            <Button
                              onClick={handlePlayerReady}
                              size="lg"
                              disabled={isPlayerReady}
                              className={isPlayerReady ? "opacity-75" : ""}
                            >
                              {isPlayerReady ? (
                                <>
                                  <Clock className="mr-2 h-4 w-4 animate-pulse" />
                                  Continue ({readyStatus.readyCount}/2)
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
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
                            <p className="text-muted-foreground animate-in fade-in text-xs duration-500">
                              Waiting for {opponent?.name || "opponent"} to
                              continue...
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
            isVisible={!waitingForPlayer && !connectionError}
            chatMessages={chatMessages}
            onNewMessage={handleNewChatMessage}
            isConnected={isConnected}
            playersCount={players.length}
          />
        </div>
      </div>
    </div>
  );
}
