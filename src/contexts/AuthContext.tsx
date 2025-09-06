"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { toast } from "sonner";
import { useGlobalServerState } from "@/src/hooks/useGlobalServerState";

interface User {
  _id: string;
  username: string;
  email: string;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
  avatar?: string;
  bio?: string;
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  loadingMessage: string;
  login: (credentials: { login: string; password: string }) => Promise<boolean>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { loadingState, makeRequest } = useGlobalServerState();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: {
    login: string;
    password: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);
      const data = await makeRequest<{
        data: { token: string; user: User };
      }>(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (data) {
        const { token: newToken, user: newUser } = data.data;

        setToken(newToken);
        setUser(newUser);

        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));

        toast.success("Login successful!");
        return true;
      } else {
        toast.error("Login failed");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);
      const data = await makeRequest<{
        data: { token: string; user: User };
      }>(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (data) {
        const { token: newToken, user: newUser } = data.data;

        setToken(newToken);
        setUser(newUser);

        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));

        toast.success("Registration successful! Welcome to Tic Tac Toe!");
        return true;
      } else {
        toast.error("Registration failed");
        return false;
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
  }, []);

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const data = await makeRequest<{
        data: { user: User };
      }>(`${API_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data) {
        const updatedUser = data.data.user;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      if (error instanceof Error && error.message.includes("401")) {
        // Token is invalid, logout
        logout();
      }
    }
  }, [token, logout, API_URL, makeRequest]);

  // Listen for custom events to refresh user stats
  React.useEffect(() => {
    const handleStatsUpdate = () => {
      refreshUser();
    };

    window.addEventListener("userStatsUpdated", handleStatsUpdate);
    return () =>
      window.removeEventListener("userStatsUpdated", handleStatsUpdate);
  }, [token, refreshUser]);

  const value: AuthContextType = {
    user,
    token,
    loading: loading || loadingState.isLoading,
    loadingMessage: loadingState.loadingMessage,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
