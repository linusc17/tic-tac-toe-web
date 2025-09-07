"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BoardContainerProps {
  children: ReactNode;
  hasWinner?: boolean;
  isDraw?: boolean;
  className?: string;
}

export const BoardContainer = ({
  children,
  hasWinner = false,
  isDraw = false,
  className = "",
}: BoardContainerProps) => {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={
        hasWinner
          ? {
              scale: [1, 1.02, 1],
              rotateZ: [0, 0.5, 0, -0.5, 0],
            }
          : {}
      }
      transition={
        hasWinner
          ? {
              duration: 2,
              delay: 1.5,
              repeat: 2,
              ease: "easeInOut",
            }
          : {}
      }
    >
      {children}

      {/* Confetti effect for winner */}
      {hasWinner && (
        <>
          {[...Array(16)].map((_, i) => {
            const colors = [
              "bg-yellow-400",
              "bg-green-400",
              "bg-blue-400",
              "bg-purple-400",
              "bg-red-400",
              "bg-pink-400",
            ];
            const randomColor =
              colors[Math.floor(Math.random() * colors.length)];
            const randomSize = Math.random() > 0.5 ? "w-2 h-2" : "w-3 h-1";

            return (
              <motion.div
                key={`confetti-${i}`}
                className={`absolute ${randomSize} ${randomColor} pointer-events-none z-20 rounded-full`}
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
                initial={{
                  scale: 0,
                  opacity: 0,
                  x: 0,
                  y: 0,
                  rotate: 0,
                }}
                animate={{
                  scale: [0, 1, 0.5, 0],
                  opacity: [0, 1, 1, 0],
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300,
                  rotate: Math.random() * 720,
                }}
                transition={{
                  duration: 2.5,
                  delay: 1.2 + i * 0.1,
                  ease: "easeOut",
                }}
              />
            );
          })}
        </>
      )}

      {/* Draw effect - gentle pulse */}
      {isDraw && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-lg border-2 border-yellow-500/30"
          animate={{
            opacity: [0, 0.5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            delay: 0.5,
            repeat: 2,
          }}
        />
      )}
    </motion.div>
  );
};
