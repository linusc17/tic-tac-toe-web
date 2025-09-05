"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Gamepad2, User, Trophy, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/src/contexts/AuthContext";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <Gamepad2 className="text-primary h-8 w-8" />
            <h1 className="font-['Poppins'] text-3xl font-black tracking-wide uppercase">
              TIC TAC TOE
            </h1>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-4 md:flex">
              <Button variant="ghost" asChild>
                <Link href="/leaderboard" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </Link>
              </Button>
            </nav>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden items-center gap-2 sm:flex">
                  <Badge variant="secondary">{user.wins}W</Badge>
                  <Badge variant="outline">{user.losses}L</Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{user.username}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile"
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )}

            <ThemeToggle />
          </div>
        </div>

        {/* Mobile navigation */}
        <nav className="mt-4 flex items-center gap-2 border-t pt-2 md:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
          </Button>

          {user && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {user.wins}W•{user.losses}L
              </span>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
