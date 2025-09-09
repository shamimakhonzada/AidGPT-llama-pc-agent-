import { useRef, useEffect } from "react";
import { Bot } from "lucide-react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "../ui/TypingIndicator";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  files?: { name: string; content: string }[];
}

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
  isDarkMode: boolean;
  onEditMessage: (id: string, newText: string) => void;
}

export default function ChatWindow({
  messages,
  loading,
  isDarkMode,
  onEditMessage,
}: ChatWindowProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div
        className={`flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin ${
          isDarkMode
            ? "scrollbar-thumb-slate-600 scrollbar-track-slate-800"
            : "scrollbar-thumb-gray-300"
        }`}
      >
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            m={m}
            onEdit={onEditMessage}
            isDarkMode={isDarkMode}
          />
        ))}
        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                  isDarkMode
                    ? "bg-gradient-to-br from-gray-600 to-gray-700"
                    : "bg-gradient-to-br from-gray-100 to-gray-200"
                }`}
              >
                <Bot
                  size={20}
                  className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                />
              </div>
              <div
                className={`p-4 rounded-2xl rounded-bl-md shadow-lg ${
                  isDarkMode
                    ? "bg-gray-700 border border-gray-600 shadow-gray-900/50"
                    : "bg-white border border-gray-200 shadow-gray-200/50"
                }`}
              >
                <TypingIndicator />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
