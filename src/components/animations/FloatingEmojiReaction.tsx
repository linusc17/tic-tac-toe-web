"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { EmojiReaction } from "@/src/hooks/useOnlineGame";

interface FloatingEmojiReactionProps {
  emoji: string;
  id: string;
  onComplete?: (id: string) => void;
}

export const FloatingEmojiReaction = ({
  emoji,
  id,
  onComplete,
}: FloatingEmojiReactionProps) => {
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Position emojis to start from the center area of the screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    setStartPosition({
      x: centerX - 200 + Math.random() * 400, // Spread around center
      y: centerY + 100 + Math.random() * 50, // Start from bottom of center area
    });
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed z-50 text-5xl"
      style={{
        left: startPosition.x,
        top: startPosition.y,
      }}
      initial={{
        opacity: 0,
        scale: 0,
        y: 0,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.5, 1.2, 0.8],
        y: -300,
        x: (Math.random() - 0.5) * 150,
        rotate: (Math.random() - 0.5) * 45,
      }}
      transition={{
        duration: 4,
        ease: "easeOut",
      }}
      onAnimationComplete={() => onComplete?.(id)}
    >
      {emoji}
    </motion.div>
  );
};

interface EmojiReactionContainerProps {
  reactions: EmojiReaction[];
  onRemoveReaction: (id: string) => void;
}

export const EmojiReactionContainer = ({
  reactions,
  onRemoveReaction,
}: EmojiReactionContainerProps) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {reactions.map(reaction => (
        <FloatingEmojiReaction
          key={reaction.id}
          emoji={reaction.emoji}
          id={reaction.id}
          onComplete={onRemoveReaction}
        />
      ))}
    </div>
  );
};
