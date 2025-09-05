"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play } from "lucide-react";
import { toast } from "sonner";

export default function NewGamePage() {
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStartGame = async () => {
    if (!player1Name.trim() || !player2Name.trim()) {
      toast.error("Please enter both player names");
      return;
    }

    if (player1Name.trim() === player2Name.trim()) {
      toast.error("Player names must be different");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/games`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            player1Name: player1Name.trim(),
            player2Name: player2Name.trim(),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const gameId = result.id || result.data?.id || result._id;
        toast.success("Game created successfully!");
        router.push(`/game/${gameId}`);
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create game session");
      }
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game session");
    } finally {
      setLoading(false);
    }
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

        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                New Game Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="player1">Player 1 Name</Label>
                <Input
                  id="player1"
                  type="text"
                  placeholder="Enter Player 1 name"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player2">Player 2 Name</Label>
                <Input
                  id="player2"
                  type="text"
                  placeholder="Enter Player 2 name"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  maxLength={50}
                />
              </div>

              <Button
                onClick={handleStartGame}
                disabled={loading || !player1Name.trim() || !player2Name.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>Loading...</>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start Game
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
