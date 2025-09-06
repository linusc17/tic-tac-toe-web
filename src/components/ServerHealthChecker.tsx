/**
 * Component that performs a health check on app startup
 */

"use client";

import { useEffect } from "react";
import { useGlobalServerState } from "@/src/hooks/useGlobalServerState";

export function ServerHealthChecker() {
  const { checkHealth } = useGlobalServerState();

  useEffect(() => {
    // Perform health check on app startup to wake up the server
    const performInitialHealthCheck = async () => {
      try {
        await checkHealth();
      } catch (error) {
        console.warn("Initial health check failed:", error);
        // Don't show user error for initial health check
      }
    };

    performInitialHealthCheck();
  }, [checkHealth]);

  // This component doesn't render anything
  return null;
}
