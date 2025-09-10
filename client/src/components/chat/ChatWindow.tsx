import { useRef, useEffect, memo } from "react";
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

const ChatWindow = ({
  messages,
  loading,
  isDarkMode,
  onEditMessage,
}: ChatWindowProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollbarClasses = isDarkMode
    ? "scrollbar-thumb-slate-600 scrollbar-track-slate-800"
    : "scrollbar-thumb-gray-300";

  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div
        className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 scrollbar-thin ${scrollbarClasses}`}
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
            <div className="flex items-start gap-2 sm:gap-3">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm ${
                  isDarkMode
                    ? "bg-gradient-to-br from-gray-600 to-gray-700"
                    : "bg-gradient-to-br from-gray-100 to-gray-200"
                }`}
              >
                <Bot
                  size={16}
                  className={`sm:w-5 sm:h-5 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                />
              </div>
              <div
                className={`p-3 sm:p-4 rounded-2xl rounded-bl-md shadow-lg ${
                  isDarkMode
                    ? "bg-gray-700 border border-gray-600 shadow-gray-900/50"
                    : "bg-white border border-gray-200 shadow-gray-200/50"
                }`}
              >
                <TypingIndicator isDarkMode={isDarkMode} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

export default memo(ChatWindow);
