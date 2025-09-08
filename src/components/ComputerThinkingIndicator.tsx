"use client";

import { useState, useEffect } from "react";
import { Bot, Loader2 } from "lucide-react";

interface ComputerThinkingIndicatorProps {
  isThinking: boolean;
  difficulty: string;
}

export function ComputerThinkingIndicator({
  isThinking,
  difficulty,
}: ComputerThinkingIndicatorProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isThinking) {
      setDots("");
      return;
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isThinking]);

  if (!isThinking) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
      <div className="relative">
        <Bot className="h-6 w-6" />
        <div className="absolute -inset-1 animate-pulse rounded-full bg-blue-400 opacity-20" />
      </div>
      <div className="flex flex-col">
        <span className="font-medium">Computer is thinking{dots}</span>
        <span className="text-muted-foreground text-xs">
          Difficulty: {difficulty}
        </span>
      </div>
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}
