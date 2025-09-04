"use client";

import { useState, useEffect } from "react";
import { GameSession } from "@/src/types/game";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Play, Loader2 } from "lucide-react";

interface HomePageProps {
  onStartNewGame: () => void;
  onStartMultiplayer: () => void;
}

export function HomePage({
  onStartNewGame,
  onStartMultiplayer,
}: HomePageProps) {
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGameSessions();
  }, []);

  const fetchGameSessions = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/games`
      );
      if (response.ok) {
        const result = await response.json();
        setGameSessions(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch game sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Tic Tac Toe</h1>
          </div>
          <ThemeToggle />
        </div>

        <div className="text-center mb-12 space-y-4">
          <Button
            onClick={onStartNewGame}
            size="lg"
            className="px-8 py-4 text-xl font-semibold gap-2 mr-4"
          >
            <Play className="h-6 w-6" />
            Local Game
          </Button>
          <Button
            onClick={onStartMultiplayer}
            size="lg"
            variant="outline"
            className="px-8 py-4 text-xl font-semibold gap-2"
          >
            <Gamepad2 className="h-6 w-6" />
            Multiplayer Game
          </Button>
        </div>

        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">
            Previous Game Sessions
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">
                Loading game sessions...
              </p>
            </div>
          ) : gameSessions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="py-8">
                <p className="text-muted-foreground text-lg">
                  No game sessions yet. Start your first game!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {gameSessions.map((session) => (
                <Card
                  key={session.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {session.player1Name} vs {session.player2Name}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(session.createdAt)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{session.player1Name} Wins:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {session.player1Wins}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{session.player2Name} Wins:</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {session.player2Wins}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Draws:</span>
                      <span className="font-medium text-muted-foreground">
                        {session.draws}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span>Total Rounds:</span>
                      <span className="font-medium">{session.totalRounds}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
