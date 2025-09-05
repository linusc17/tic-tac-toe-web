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
        sortBy: "wins",
        limit: "10",
        minGames: "0",
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
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">
            Compete with players worldwide and climb the ranks!
          </p>
        </div>

        {currentUser && userRank && (
          <Card className="border-primary">
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>
        )}

        {leaderboardData && (
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Rankings</CardTitle>
              <CardDescription>
                Showing the top {leaderboardData.leaderboard.length} players
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
