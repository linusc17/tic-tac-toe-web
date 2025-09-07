"use client";

import { motion } from "framer-motion";
import { WinningLine, getWinningLineCoordinates } from "@/src/utils/gameUtils";
import { useEffect, useState, useRef } from "react";

interface WinningLineOverlayProps {
  winningLine: WinningLine | null;
  cellSize?: number;
  gap?: number;
  className?: string;
}

export const WinningLineOverlay = ({
  winningLine,
  cellSize,
  gap,
  className = "",
}: WinningLineOverlayProps) => {
  const [actualCellSize, setActualCellSize] = useState(cellSize || 100);
  const [actualGap, setActualGap] = useState(gap || 8);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || cellSize) return;

    // Auto-calculate cell size based on container
    const container = containerRef.current;
    const parent = container.parentElement;
    if (parent) {
      const containerWidth = parent.offsetWidth;
      const containerHeight = parent.offsetHeight;
      const size = Math.min(containerWidth, containerHeight);

      // Assuming 3x3 grid with gaps
      const calculatedGap = 8;
      const calculatedCellSize = (size - calculatedGap * 2) / 3;

      setActualCellSize(calculatedCellSize);
      setActualGap(calculatedGap);
    }
  }, [winningLine, cellSize]);

  if (!winningLine) return null;

  const coordinates = getWinningLineCoordinates(
    winningLine,
    actualCellSize,
    actualGap
  );
  const totalSize = actualCellSize * 3 + actualGap * 2;

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 z-10 ${className}`}
    >
      <svg
        width={totalSize}
        height={totalSize}
        className="h-full w-full"
        viewBox={`0 0 ${totalSize} ${totalSize}`}
        style={{
          overflow: "visible",
        }}
      >
        {/* Animated winning line */}
        <motion.line
          x1={coordinates.x1}
          y1={coordinates.y1}
          x2={coordinates.x1}
          y2={coordinates.y1}
          stroke="#10b981"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{
            x2: coordinates.x1,
            y2: coordinates.y1,
          }}
          animate={{
            x2: coordinates.x2,
            y2: coordinates.y2,
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            delay: 0.3,
          }}
        />

        {/* Sparkle effect at the end of line */}
        <motion.circle
          cx={coordinates.x2}
          cy={coordinates.y2}
          r="4"
          fill="#fbbf24"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 1,
            delay: 1.1,
            repeat: 2,
            repeatType: "loop",
          }}
        />
      </svg>
    </div>
  );
};
