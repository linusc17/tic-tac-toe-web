import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface UseSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string;
  socket: Socket | null;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const {
    url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
    autoConnect = true,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    connectionError: "",
    socket: null,
  });

  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    setConnectionState(prev => ({
      ...prev,
      isConnecting: true,
      connectionError: "",
    }));

    const newSocket = io(url, {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      setConnectionState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        connectionError: "",
        socket: newSocket,
      }));
    });

    newSocket.on("connect_error", error => {
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionError: "Connection failed",
        socket: null,
      }));
      toast.error("Connection failed");
      console.error("Socket connection error:", error);
    });

    newSocket.on("disconnect", reason => {
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        socket: null,
      }));
      console.log("Socket disconnected:", reason);
    });

    socketRef.current = newSocket;
    return newSocket;
  }, [url]);

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        socket: null,
      }));
    }
  };

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect]);

  return {
    ...connectionState,
    connect,
    disconnect,
  };
};
