"use client";

import { HomePage } from "@/src/components/HomePage";

export default function Home() {
  const handleStartNewGame = () => {
    // TODO: Navigate to new game page
    console.log("Start new game clicked");
  };

  return <HomePage onStartNewGame={handleStartNewGame} />;
}
