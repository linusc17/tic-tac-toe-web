"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface EmojiBarProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

const QUICK_REACTIONS = ["😂", "🔥", "😱", "👎", "🤯"];

export const EmojiBar = ({
  onEmojiSelect,
  disabled = false,
}: EmojiBarProps) => {
  const handleEmojiClick = (emoji: string) => {
    if (disabled) return;
    onEmojiSelect(emoji);
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className="bg-card relative mx-auto mt-4 w-fit rounded-lg border px-4 py-2 shadow-sm"
    >
      <div className="flex items-center justify-center gap-1">
        <div className="flex gap-1">
          {QUICK_REACTIONS.map((emoji, index) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              onClick={() => handleEmojiClick(emoji)}
              disabled={disabled}
              className={`h-9 w-9 p-0 text-lg transition-all hover:scale-110 ${
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-secondary"
              }`}
            >
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                }}
                whileHover={!disabled ? { scale: 1.2 } : {}}
                whileTap={!disabled ? { scale: 0.9 } : {}}
              >
                {emoji}
              </motion.span>
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
