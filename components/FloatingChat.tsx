"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X } from "lucide-react";
import { Socket } from "socket.io-client";
import { ChatMessage } from "@/src/types/chat";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FloatingChatProps {
  socket: Socket | null;
  roomCode: string;
  playerName: string;
  isVisible: boolean;
  chatMessages: ChatMessage[];
  onNewMessage: (message: ChatMessage) => void;
  isConnected?: boolean;
  playersCount?: number;
}

export default function FloatingChat({
  socket,
  roomCode,
  playerName,
  isVisible,
  chatMessages,
  onNewMessage,
  isConnected = true,
  playersCount = 2,
}: FloatingChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message: ChatMessage) => {
        onNewMessage(message);
        if (
          !showChat &&
          message.playerName !== decodeURIComponent(playerName)
        ) {
          setUnreadCount((prev) => prev + 1);
        }
      };

      socket.on("new_message", handleNewMessage);

      return () => {
        socket.off("new_message", handleNewMessage);
      };
    }
  }, [socket, showChat, playerName, onNewMessage]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const sendMessage = () => {
    if (!socket || !newMessage.trim() || !isConnected || playersCount < 2)
      return;

    socket.emit(
      "send_message",
      roomCode,
      newMessage,
      decodeURIComponent(playerName)
    );
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const openChat = () => {
    setShowChat(true);
    setUnreadCount(0);
  };

  const closeChat = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowChat(false);
      setIsClosing(false);
    }, 200);
  };

  const isChatDisabled = !isConnected || playersCount < 2;
  const tooltipMessage = !isConnected
    ? "Connect to chat"
    : playersCount < 2
    ? "Wait for other player to join"
    : "";

  if (!isVisible) return null;

  return (
    <TooltipProvider>
      <style jsx>{`
        @keyframes chatSlideIn {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(10px) translateX(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0) translateX(0);
          }
        }
        @keyframes chatSlideOut {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0) translateX(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.95) translateY(10px) translateX(10px);
          }
        }
        @keyframes buttonPop {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes buttonSlideIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes badgeBounce {
          0%,
          20%,
          50%,
          80%,
          100% {
            transform: translateY(0) scale(1);
          }
          40% {
            transform: translateY(-3px) scale(1.1);
          }
          60% {
            transform: translateY(-2px) scale(1.05);
          }
        }
      `}</style>
      <div className="fixed bottom-4 right-4 z-50">
        {/* Chat Button */}
        {!showChat && (
          <div
            className="relative"
            style={{
              animation: "buttonSlideIn 0.2s ease-out forwards",
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-block">
                  <Button
                    onClick={isChatDisabled ? undefined : openChat}
                    disabled={isChatDisabled}
                    className={`rounded-full h-14 w-14 shadow-lg transition-all duration-200 ${
                      isChatDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-xl hover:scale-105 active:scale-95"
                    } ${
                      unreadCount > 0 ? "animate-pulse shadow-blue-300" : ""
                    }`}
                    size="lg"
                  >
                    <MessageCircle className="h-6 w-6" />
                  </Button>
                </div>
              </TooltipTrigger>
              {isChatDisabled && (
                <TooltipContent>
                  <p>{tooltipMessage}</p>
                </TooltipContent>
              )}
            </Tooltip>
            {unreadCount > 0 && !isChatDisabled && (
              <div
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold"
                style={{ animation: "badgeBounce 1s ease-in-out" }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
          </div>
        )}

        {/* Chat Popup */}
        {showChat && (
          <div
            className="bg-background border rounded-lg shadow-xl w-80 h-96 flex flex-col transform transition-all duration-200 ease-out origin-bottom-right"
            style={{
              animation: isClosing
                ? "chatSlideOut 0.2s ease-in forwards"
                : "chatSlideIn 0.2s ease-out forwards",
            }}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <h3 className="font-semibold">Chat</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeChat}
                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chatMessages.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.playerName === decodeURIComponent(playerName)
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg ${
                        msg.playerName === decodeURIComponent(playerName)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {msg.playerName !== decodeURIComponent(playerName) && (
                        <p className="text-sm font-bold mb-1">
                          {msg.playerName}
                        </p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder={
                    isChatDisabled ? tooltipMessage : "Type a message..."
                  }
                  value={newMessage}
                  onChange={(e) =>
                    isChatDisabled ? null : setNewMessage(e.target.value)
                  }
                  onKeyPress={isChatDisabled ? undefined : handleKeyPress}
                  disabled={isChatDisabled}
                  maxLength={200}
                  className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-blue-300"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isChatDisabled || !newMessage.trim()}
                  size="sm"
                  className="transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
