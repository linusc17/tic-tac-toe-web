"use client";

import { useState, useEffect, useCallback } from "react";
import { GameSession } from "@/src/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Gamepad2,
  Play,
  Loader2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import { toast } from "sonner";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

interface HomePageProps {
  onStartNewGame: () => void;
  onStartOnline: () => void;
}

export function HomePage({ onStartNewGame, onStartOnline }: HomePageProps) {
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplitButtons, setShowSplitButtons] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchGameSessions = useCallback(
    async (page = 1, limit?: number) => {
      const getItemsPerPage = () => {
        if (!showAllSessions) return 6; // Keep original behavior for recent sessions
        if (windowWidth >= 1024) return 9; // Large screens (lg): 3 columns × 3 rows = 9
        if (windowWidth >= 768) return 8;  // Medium screens (md): 2 columns × 4 rows = 8  
        return 6; // Small screens: 1 column × 6 rows = 6
      };
      
      const itemsPerPage = limit || getItemsPerPage();
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: itemsPerPage.toString(),
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/games?${params}`
        );
        if (response.ok) {
          const result = await response.json();
          // Handle nested data structure: { data: { data: [...] }, pagination: ... }
          const sessions =
            result.data?.data || result.data || result.sessions || result || [];
          setGameSessions(Array.isArray(sessions) ? sessions : []);
          setPagination(result.pagination || null);
        } else {
          toast.error("Failed to load recent games");
        }
      } catch (error) {
        console.error("Failed to fetch game sessions:", error);
        toast.error("Failed to load recent games");
      } finally {
        setLoading(false);
      }
    },
[showAllSessions, windowWidth]
  );

  useEffect(() => {
    fetchGameSessions();
  }, [fetchGameSessions]);

  useEffect(() => {
    if (showAllSessions) {
      fetchGameSessions(currentPage);
    }
  }, [currentPage, showAllSessions, fetchGameSessions]);

  useEffect(() => {
    if (showAllSessions && windowWidth > 0) {
      setCurrentPage(1);
      fetchGameSessions(1);
    }
  }, [windowWidth, showAllSessions, fetchGameSessions]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const toggleShowAllSessions = () => {
    setShowAllSessions(!showAllSessions);
    setCurrentPage(1);
    // fetchGameSessions will be called by useEffect when showAllSessions changes
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
          <div className="relative flex min-h-[80px] items-center justify-center">
            {!showSplitButtons ? (
              <Button
                onClick={() => setShowSplitButtons(true)}
                size="lg"
                className="transform gap-3 px-16 py-8 font-['Poppins'] text-3xl font-black tracking-wider shadow-xl transition-all duration-500 hover:scale-105"
              >
                <Play className="h-10 w-10" />
                PLAY
              </Button>
            ) : (
              <div className="animate-in fade-in flex gap-6 duration-500">
                <Button
                  onClick={onStartNewGame}
                  size="lg"
                  className="animate-in slide-in-from-right-20 translate-x-0 transform gap-2 px-8 py-4 font-['Poppins'] text-xl font-bold tracking-wide shadow-lg transition-all duration-300"
                  style={{
                    animationDelay: "100ms",
                    animationDuration: "600ms",
                    animationFillMode: "both",
                  }}
                >
                  <Play className="h-6 w-6" />
                  Local Game
                </Button>
                <Button
                  onClick={onStartOnline}
                  size="lg"
                  variant="outline"
                  className="animate-in slide-in-from-left-20 translate-x-0 transform gap-2 px-8 py-4 font-['Poppins'] text-xl font-bold tracking-wide shadow-lg transition-all duration-300"
                  style={{
                    animationDelay: "100ms",
                    animationDuration: "600ms",
                    animationFillMode: "both",
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
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Previous Game Sessions</h2>
            {!loading && gameSessions.length > 0 && (
              <Button
                variant="outline"
                onClick={toggleShowAllSessions}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                {showAllSessions ? "Show Recent Only" : "View All Sessions"}
              </Button>
            )}
          </div>

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
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {gameSessions.map(session => (
                  <Card
                    key={session.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              {session.player1Name}
                              {session.player1Id && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              )}
                            </span>
                            <span>vs</span>
                            <span className="flex items-center gap-1">
                              {session.player2Name}
                              {session.player2Id && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              )}
                            </span>
                          </div>
                        </CardTitle>
                        <span className="text-muted-foreground text-sm">
                          {formatDate(session.createdAt)}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          {session.player1Name}
                          {session.player1Id && (
                            <CheckCircle className="h-3 w-3 text-blue-500" />
                          )}
                          <span className="ml-1">Wins:</span>
                        </span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {session.player1Wins}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          {session.player2Name}
                          {session.player2Id && (
                            <CheckCircle className="h-3 w-3 text-blue-500" />
                          )}
                          <span className="ml-1">Wins:</span>
                        </span>
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
                        <span className="font-medium">
                          {session.totalRounds}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination Controls */}
              {showAllSessions && pagination && pagination.totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
                  <div className="text-muted-foreground text-sm">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} sessions
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (
                            pagination.page >
                            pagination.totalPages - 3
                          ) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
