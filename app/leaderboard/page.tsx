"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { Info, Trophy, Target, GamepadIcon } from "lucide-react";

interface LeaderboardUser {
  _id: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
  avatar?: string;
  bio?: string;
  rank: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData | null>(null);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [userRank, setUserRank] = useState<{
    rank: number;
    user: LeaderboardUser;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserRank();
    }
  }, [currentUser]);

  const fetchLeaderboard = async () => {
    try {
      const params = new URLSearchParams({
        sortBy: "winRate",
        limit: "10",
        minGames: "3",
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/leaderboard?${params}`
      );

      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data.data);
      } else {
        toast.error("Failed to load leaderboard");
      }
    } catch (error) {
      console.error("Leaderboard fetch error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRank = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/leaderboard/my/rank`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserRank(data.data);
      }
    } catch (error) {
      console.error("User rank fetch error:", error);
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return "default";
    if (rank <= 3) return "secondary";
    if (rank <= 10) return "outline";
    return "secondary";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="space-y-6">
        <div className="py-4 text-center">
          <h1 className="mb-2 text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">
            Compete with players worldwide and climb the ranks!
          </p>
        </div>

        {/* Ranking Mechanics Explanation */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent>
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  🏆 How Rankings Work
                </h3>
                <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>
                      <strong>Primary:</strong> Win Rate (efficiency matters
                      most)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GamepadIcon className="h-4 w-4" />
                    <span>
                      <strong>Secondary:</strong> Total Games (activity &
                      credibility)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span>
                      <strong>Tertiary:</strong> Total Wins (absolute
                      performance)
                    </span>
                  </div>
                </div>
                <div className="mt-3 rounded-md bg-blue-100 px-3 py-2 dark:bg-blue-900/50">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    📝 <strong>Qualification:</strong> Play at least 3 games to
                    appear on the leaderboard
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {currentUser && (
          <Card className="border-primary">
            <CardContent>
              {userRank ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Your Rank</h3>
                    <p className="text-muted-foreground">
                      {currentUser.username}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={getRankBadgeVariant(userRank.rank)}
                      className="px-3 py-1 text-lg"
                    >
                      {getRankIcon(userRank.rank)} #{userRank.rank}
                    </Badge>
                    <div className="text-muted-foreground mt-1 text-sm">
                      {userRank.user.wins}W • {userRank.user.losses}L •{" "}
                      {userRank.user.draws}D
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <GamepadIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Not Ranked Yet</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Play at least 3 games to appear on the leaderboard and get
                    your rank!
                  </p>
                  <Button asChild size="sm">
                    <Link href="/online">Start Playing</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {leaderboardData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Top 10 Rankings
              </CardTitle>
              <CardDescription>
                Showing the top {leaderboardData.leaderboard.length} players
                (minimum 3 games played)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboardData.leaderboard.map(player => (
                  <div
                    key={player._id}
                    className={`hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors ${
                      currentUser && player._id === currentUser._id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={getRankBadgeVariant(player.rank)}
                        className="px-2 py-1 text-base"
                      >
                        {getRankIcon(player.rank)} #{player.rank}
                      </Badge>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{player.username}</h3>
                          {currentUser && player._id === currentUser._id && (
                            <Badge variant="outline">You</Badge>
                          )}
                        </div>
                        {player.bio && (
                          <p className="text-muted-foreground text-sm">
                            {player.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold">
                        {player.winRate}% Win Rate
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {player.wins}W • {player.losses}L • {player.draws}D (
                        {player.totalGames} total)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!currentUser && (
          <Card className="border-primary">
            <CardContent className="pt-6 text-center">
              <h3 className="mb-2 text-lg font-semibold">
                Join the Competition!
              </h3>
              <p className="text-muted-foreground mb-4">
                Create an account to track your stats and compete on the
                leaderboard
              </p>
              <div className="flex justify-center gap-2">
                <Button asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
