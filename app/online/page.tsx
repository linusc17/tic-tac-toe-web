"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, UserPlus } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "@/src/contexts/AuthContext";

export default function OnlinePage() {
  const { user, token } = useAuth();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Auto-populate player name if user is logged in
  useEffect(() => {
    if (user && !playerName) {
      setPlayerName(user.username);
    }
  }, [user, playerName]);

  const connectSocket = (): Socket => {
    return io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      transports: ["websocket"],
    });
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      toast.error("Please enter your name");
      return;
    }

    setIsConnecting(true);
    setError("");

    const socket = connectSocket();

    socket.on("connect", () => {
      socket.emit(
        "create_room",
        {
          playerName: playerName.trim(),
          token: token,
        },
        (response: {
          success: boolean;
          roomCode?: string;
          playerSymbol?: string;
          error?: string;
        }) => {
          if (response.success) {
            // Don't disconnect socket, let the game page handle it
            router.push(
              `/online-game/${response.roomCode}?symbol=${
                response.playerSymbol
              }&name=${encodeURIComponent(playerName)}`
            );
          } else {
            setError("Failed to create room");
            toast.error("Failed to create room");
            setIsConnecting(false);
            socket.disconnect();
          }
        }
      );
    });

    socket.on("connect_error", () => {
      setError("Failed to connect to server");
      toast.error("Failed to connect to server");
      setIsConnecting(false);
    });
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      toast.error("Please enter your name");
      return;
    }

    if (!roomCode.trim()) {
      setError("Please enter room code");
      toast.error("Please enter room code");
      return;
    }

    setIsConnecting(true);
    setError("");

    const socket = connectSocket();

    socket.on("connect", () => {
      socket.emit(
        "join_room",
        {
          roomCode: roomCode.trim().toUpperCase(),
          playerName: playerName.trim(),
          token: token,
        },
        (response: {
          success: boolean;
          roomCode?: string;
          playerSymbol?: string;
          error?: string;
        }) => {
          if (response.success) {
            // Don't disconnect socket, let the game page handle it
            router.push(
              `/online-game/${response.roomCode}?symbol=${
                response.playerSymbol
              }&name=${encodeURIComponent(playerName)}`
            );
          } else {
            setError(response.error || "Failed to join room");
            toast.error(response.error || "Failed to join room");
            setIsConnecting(false);
            socket.disconnect();
          }
        }
      );
    });

    socket.on("connect_error", () => {
      setError("Failed to connect to server");
      toast.error("Failed to connect to server");
      setIsConnecting(false);
    });
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

        <div className="mx-auto max-w-md space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                Online Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="playerName">Your Name</Label>
                <Input
                  id="playerName"
                  type="text"
                  placeholder={user ? user.username : "Enter your name"}
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  maxLength={50}
                  disabled={!!user}
                  readOnly={!!user}
                  className={user ? "cursor-not-allowed opacity-60" : ""}
                />
                {user && (
                  <p className="text-muted-foreground text-xs">
                    Playing as {user.username} (logged in)
                  </p>
                )}
              </div>

              {error && (
                <div className="text-center text-sm text-red-500">{error}</div>
              )}

              <div className="space-y-4">
                <Button
                  onClick={handleCreateRoom}
                  disabled={isConnecting || !playerName.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isConnecting ? (
                    <>Creating Room...</>
                  ) : (
                    <>
                      <Users className="mr-2 h-5 w-5" />
                      Create New Room
                    </>
                  )}
                </Button>

                <div className="text-muted-foreground text-center text-sm">
                  OR
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomCode">Room Code</Label>
                  <Input
                    id="roomCode"
                    type="text"
                    placeholder="Enter 6-character room code"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>

                <Button
                  onClick={handleJoinRoom}
                  disabled={
                    isConnecting || !playerName.trim() || !roomCode.trim()
                  }
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  {isConnecting ? (
                    <>Joining Room...</>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Join Room
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-muted-foreground space-y-2 text-sm">
                <p>
                  <strong>How to play online:</strong>
                </p>
                <p>
                  • <strong>Create Room:</strong> Start a new game and share the
                  room code with your friend
                </p>
                <p>
                  • <strong>Join Room:</strong> Enter the room code your friend
                  shared with you
                </p>
                <p>
                  • <strong>Play:</strong> Take turns making moves in real-time!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
