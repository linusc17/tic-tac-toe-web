"use client";

import { ThemeToggle } from "./theme-toggle";
import { Gamepad2 } from "lucide-react";

export function Header() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className="text-primary h-8 w-8" />
            <h1 className="text-3xl font-black uppercase tracking-wide font-['Poppins']">TIC TAC TOE</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
