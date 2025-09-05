import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import { GameSession } from "@/src/types/game";
import { ChatMessage } from "@/src/types/chat";
import { GameState, Player } from "@/src/utils/gameUtils";

interface UseOnlineGameProps {
  socket: Socket | null;
  roomCode: string;
  playerName: string;
  playerSymbol: string;
}

interface ReadyStatus {
  readyCount: number;
  totalPlayers: number;
  playerReady: string;
}

export const useOnlineGame = ({
  socket,
  roomCode,
  playerName,
  playerSymbol,
}: UseOnlineGameProps) => {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentTurn: "X",
    winner: null,
    isDraw: false,
    isActive: false,
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [waitingForPlayer, setWaitingForPlayer] = useState(true);
  const [showRoundEnd, setShowRoundEnd] = useState(false);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [readyStatus, setReadyStatus] = useState<ReadyStatus>({
    readyCount: 0,
    totalPlayers: 2,
    playerReady: "",
  });
  const [isMovePending, setIsMovePending] = useState(false);
  const [playerDisconnected, setPlayerDisconnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Join existing room (when navigating to game page after create_room/join_room)
    const token = localStorage.getItem("token");
    socket.emit(
      "join_existing_room",
      {
        roomCode,
        playerName: decodeURIComponent(playerName),
        playerSymbol,
        token,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          toast.error(response.error || "Failed to join room");
        }
      }
    );

    // Game ready event
    socket.on(
      "game_ready",
      (data: {
        players: Player[];
        gameState: GameState;
        gameSession: GameSession | null;
      }) => {
        setPlayers(data.players);
        setGameState(data.gameState);
        if (data.gameSession) {
          setGameSession(data.gameSession);
        }
        setWaitingForPlayer(false);
      }
    );

    // Move made event
    socket.on(
      "move_made",
      (data: {
        position: number;
        player: string;
        gameState: GameState;
        gameSession?: GameSession;
      }) => {
        setIsMovePending(false);
        setGameState(data.gameState);
        if (data.gameSession) {
          setGameSession(data.gameSession);
        }
        if (data.gameState.winner || data.gameState.isDraw) {
          setShowRoundEnd(true);
          // Emit event to refresh user stats in real-time
          window.dispatchEvent(new CustomEvent("userStatsUpdated"));
        }
      }
    );

    // Player disconnected event
    socket.on("player_disconnected", () => {
      setChatMessages([]);
      setPlayerDisconnected(true);
      toast.error("Other player disconnected");
    });

    // New round started event
    socket.on(
      "new_round_started",
      (data: {
        gameState: GameState;
        players: Player[];
        gameSession: GameSession | null;
      }) => {
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

    // Player ready status event
    socket.on("player_ready_status", (data: ReadyStatus) => {
      setReadyStatus(data);
    });

    // Chat message event
    socket.on("new_message", (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off("game_ready");
      socket.off("move_made");
      socket.off("player_disconnected");
      socket.off("new_round_started");
      socket.off("player_ready_status");
      socket.off("new_message");
    };
  }, [socket, roomCode, playerName, playerSymbol]);

  const makeMove = (
    position: number
  ): Promise<{ success: boolean; error?: string }> => {
    return new Promise(resolve => {
      if (!socket) {
        resolve({ success: false, error: "No socket connection" });
        return;
      }

      setIsMovePending(true);
      socket.emit(
        "make_move",
        roomCode,
        position,
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            setIsMovePending(false);
            toast.error(response.error || "Move failed");
          }
          resolve(response);
        }
      );
    });
  };

  const setPlayerReady = () => {
    if (!socket || isPlayerReady) return;

    setIsPlayerReady(true);
    socket.emit("player_ready", roomCode);
  };

  const sendChatMessage = (message: string) => {
    if (!socket || !message.trim()) return;

    socket.emit("send_message", roomCode, message, playerName);
  };

  return {
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
    sendChatMessage,
  };
};
