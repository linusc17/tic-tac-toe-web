"use client";

import { useState, useEffect } from "react";
import { GameSession } from "@/src/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface HomePageProps {
  onStartNewGame: () => void;
  onStartOnline: () => void;
}

export function HomePage({ onStartNewGame, onStartOnline }: HomePageProps) {
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplitButtons, setShowSplitButtons] = useState(false);

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
      } else {
        toast.error("Failed to load recent games");
      }
    } catch (error) {
      console.error("Failed to fetch game sessions:", error);
      toast.error("Failed to load recent games");
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
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 space-y-4 text-center">
          <div className="relative flex justify-center items-center min-h-[80px]">
            {!showSplitButtons ? (
              <Button
                onClick={() => setShowSplitButtons(true)}
                size="lg"
                className="gap-3 px-16 py-8 text-3xl font-black tracking-wider transition-all duration-500 transform hover:scale-105 shadow-xl font-['Poppins']"
              >
                <Play className="h-10 w-10" />
                PLAY
              </Button>
            ) : (
              <div className="flex gap-6 animate-in fade-in duration-500">
                <Button
                  onClick={onStartNewGame}
                  size="lg"
                  className="gap-2 px-8 py-4 text-xl font-bold tracking-wide transition-all duration-300 transform translate-x-0 animate-in slide-in-from-right-20 shadow-lg font-['Poppins']"
                  style={{
                    animationDelay: '100ms',
                    animationDuration: '600ms',
                    animationFillMode: 'both'
                  }}
                >
                  <Play className="h-6 w-6" />
                  Local Game
                </Button>
                <Button
                  onClick={onStartOnline}
                  size="lg"
                  variant="outline"
                  className="gap-2 px-8 py-4 text-xl font-bold tracking-wide transition-all duration-300 transform translate-x-0 animate-in slide-in-from-left-20 shadow-lg font-['Poppins']"
                  style={{
                    animationDelay: '100ms',
                    animationDuration: '600ms',
                    animationFillMode: 'both'
                  }}
                >
                  <Gamepad2 className="h-6 w-6" />
                  Online Game
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-semibold">
            Previous Game Sessions
          </h2>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
              <p className="text-muted-foreground mt-4">
                Loading game sessions...
              </p>
            </div>
          ) : gameSessions.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent className="py-8">
                <p className="text-muted-foreground text-lg">
                  No game sessions yet. Start your first game!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {gameSessions.map(session => (
                <Card
                  key={session.id}
                  className="transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        {session.player1Name} vs {session.player2Name}
                      </CardTitle>
                      <span className="text-muted-foreground text-sm">
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
                      <span className="text-muted-foreground font-medium">
                        {session.draws}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
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
