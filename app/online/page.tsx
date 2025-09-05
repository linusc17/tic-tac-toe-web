"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, UserPlus } from "lucide-react";
import { io, Socket } from "socket.io-client";

export default function OnlinePage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const connectSocket = (): Socket => {
    return io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      transports: ["websocket"],
    });
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsConnecting(true);
    setError("");

    const socket = connectSocket();

    socket.on("connect", () => {
      socket.emit(
        "create_room",
        playerName.trim(),
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
            setIsConnecting(false);
            socket.disconnect();
          }
        }
      );
    });

    socket.on("connect_error", () => {
      setError("Failed to connect to server");
      setIsConnecting(false);
    });
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!roomCode.trim()) {
      setError("Please enter room code");
      return;
    }

    setIsConnecting(true);
    setError("");

    const socket = connectSocket();

    socket.on("connect", () => {
      socket.emit(
        "join_room",
        roomCode.trim().toUpperCase(),
        playerName.trim(),
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
            setIsConnecting(false);
            socket.disconnect();
          }
        }
      );
    });

    socket.on("connect_error", () => {
      setError("Failed to connect to server");
      setIsConnecting(false);
    });
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

        <div className="max-w-md mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Online Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="playerName">Your Name</Label>
                <Input
                  id="playerName"
                  type="text"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={50}
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
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
                      <Users className="h-5 w-5 mr-2" />
                      Create New Room
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  OR
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomCode">Room Code</Label>
                  <Input
                    id="roomCode"
                    type="text"
                    placeholder="Enter 6-character room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
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
                      <UserPlus className="h-5 w-5 mr-2" />
                      Join Room
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-2">
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
