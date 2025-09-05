import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface UseSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

interface ConnectionState {
  isConnected: boolean;
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
    connectionError: "",
    socket: null,
  });

  const socketRef = useRef<Socket | null>(null);

  const connect = () => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    const newSocket = io(url, {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      setConnectionState(prev => ({
        ...prev,
        isConnected: true,
        connectionError: "",
        socket: newSocket,
      }));
    });

    newSocket.on("connect_error", error => {
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
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
        socket: null,
      }));
      console.log("Socket disconnected:", reason);
    });

    socketRef.current = newSocket;
    return newSocket;
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
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
  }, [url, autoConnect]);

  return {
    ...connectionState,
    connect,
    disconnect,
  };
};
