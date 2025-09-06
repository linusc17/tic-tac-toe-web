/**
 * Global server state management for cold start detection
 */

import { useState, useEffect, useCallback } from "react";

interface ServerState {
  isWarming: boolean;
  isAwake: boolean;
  lastPingTime: number | null;
}

interface ServerLoadingState {
  isLoading: boolean;
  loadingMessage: string;
  startTime: number | null;
}

const COLD_START_THRESHOLD = 3000; // Show warning after 3 seconds
const SEVERE_WARNING_THRESHOLD = 5000; // Show "50+ seconds" warning after 5 seconds

// Global server state - initialize from sessionStorage if available
const initializeGlobalServerState = (): ServerState => {
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("globalServerState");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if server was recently awake (within last 10 minutes)
        if (
          parsed.lastPingTime &&
          Date.now() - parsed.lastPingTime < 10 * 60 * 1000
        ) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn("Failed to load server state from storage:", error);
    }
  }

  return {
    isWarming: false,
    isAwake: false,
    lastPingTime: null,
  };
};

let globalServerState: ServerState = initializeGlobalServerState();

let serverStateListeners: ((state: ServerState) => void)[] = [];

const updateGlobalServerState = (newState: Partial<ServerState>) => {
  globalServerState = { ...globalServerState, ...newState };

  // Persist to sessionStorage
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(
        "globalServerState",
        JSON.stringify(globalServerState)
      );
    } catch (error) {
      console.warn("Failed to save server state to storage:", error);
    }
  }

  serverStateListeners.forEach(listener => listener(globalServerState));
};

export const useGlobalServerState = () => {
  const [serverState, setServerState] =
    useState<ServerState>(globalServerState);
  const [loadingState, setLoadingState] = useState<ServerLoadingState>({
    isLoading: false,
    loadingMessage: "Loading...",
    startTime: null,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Subscribe to global state changes
  useEffect(() => {
    const listener = (state: ServerState) => setServerState(state);
    serverStateListeners.push(listener);

    return () => {
      serverStateListeners = serverStateListeners.filter(l => l !== listener);
    };
  }, []);

  // Update loading message based on elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (loadingState.isLoading && loadingState.startTime) {
      interval = setInterval(() => {
        const elapsed = Date.now() - loadingState.startTime!;

        let message = "Loading...";
        if (elapsed > SEVERE_WARNING_THRESHOLD) {
          message =
            "Server was sleeping - this may take up to 50+ seconds on free hosting";
        } else if (elapsed > COLD_START_THRESHOLD) {
          message = "Server is starting up...";
        }

        setLoadingState(prev => ({ ...prev, loadingMessage: message }));
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadingState.isLoading, loadingState.startTime]);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      updateGlobalServerState({ isWarming: true });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(`${API_URL}/`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        updateGlobalServerState({
          isWarming: false,
          isAwake: true,
          lastPingTime: Date.now(),
        });
        return true;
      }
    } catch (error) {
      console.error("Health check failed:", error);
    }

    updateGlobalServerState({ isWarming: false, isAwake: false });
    return false;
  }, [API_URL]);

  const makeRequest = useCallback(
    async <T = unknown>(
      url: string,
      options: RequestInit = {}
    ): Promise<T | null> => {
      const startTime = Date.now();

      // Get current server state
      const currentServerState = globalServerState;

      // Show loading state with progressive messaging
      // In development with simulation, always show progression
      // In production, only show progression if server might be cold
      const showProgression =
        process.env.NEXT_PUBLIC_SIMULATE_COLD_START === "true" ||
        !currentServerState.isAwake;

      setLoadingState({
        isLoading: true,
        loadingMessage: "Loading...",
        startTime: showProgression ? startTime : null,
      });

      try {
        // Add development delay for testing
        if (
          process.env.NODE_ENV === "development" &&
          process.env.NEXT_PUBLIC_SIMULATE_COLD_START === "true"
        ) {
          await new Promise(resolve => setTimeout(resolve, 8000));
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        setLoadingState({
          isLoading: false,
          loadingMessage: "",
          startTime: null,
        });

        if (response.ok) {
          // Mark server as awake after successful response
          updateGlobalServerState({
            isWarming: false,
            isAwake: true,
            lastPingTime: Date.now(),
          });

          const data = await response.json();
          return data;
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        setLoadingState({
          isLoading: false,
          loadingMessage: "",
          startTime: null,
        });

        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Request timed out - server may be spinning up");
        }
        throw error;
      }
    },
    []
  ); // Remove serverState from dependency array

  return {
    serverState,
    loadingState,
    checkHealth,
    makeRequest,
  };
};
