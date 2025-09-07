"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedCellProps {
  children: ReactNode;
  isWinning?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const AnimatedCell = ({
  children,
  isWinning = false,
  onClick,
  disabled = false,
  className = "",
}: AnimatedCellProps) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-lg text-4xl font-bold transition-all duration-300 disabled:opacity-50 ${
        isWinning
          ? "border-2 border-green-400 bg-green-500/30 hover:bg-green-500/40"
          : "bg-secondary hover:bg-secondary/80"
      } ${className} `}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      animate={
        isWinning
          ? {
              scale: [1, 1.1, 1],
            }
          : {
              scale: 1,
            }
      }
      transition={
        isWinning
          ? {
              duration: 2,
              repeat: 3,
              repeatType: "loop",
              delay: 1.2,
              ease: "easeInOut",
            }
          : {
              type: "spring",
              stiffness: 300,
              damping: 20,
            }
      }
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={
          children
            ? {
                scale: 1,
                rotate: 0,
              }
            : { scale: 0 }
        }
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      >
        {children}
      </motion.div>

      {/* Click ripple effect */}
      <motion.div
        className="absolute inset-0 rounded-lg bg-white/20"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 1, opacity: [0, 1, 0] }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
};
