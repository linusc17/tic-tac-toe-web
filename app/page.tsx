"use client";

import { useRouter } from "next/navigation";
import { HomePage } from "@/src/components/HomePage";

export default function Home() {
  const router = useRouter();

  const handleStartNewGame = () => {
    router.push("/new-game");
  };

  const handleStartMultiplayer = () => {
    router.push("/multiplayer");
  };

  return (
    <HomePage
      onStartNewGame={handleStartNewGame}
      onStartMultiplayer={handleStartMultiplayer}
    />
  );
}
