import React from "react";
import { Menu, Loader2, Bot } from "lucide-react";

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  statusMsg: string | null;
  loading: boolean;
  isDarkMode: boolean;
}

export default function Header({
  sidebarOpen,
  onToggleSidebar,
  statusMsg,
  loading,
  isDarkMode,
}: HeaderProps) {
  return (
    <header className={`backdrop-blur-md border-b sticky top-0 z-10 lg:hidden ${
      isDarkMode
        ? 'bg-[#343541]/80 border-gray-600/50'
        : 'bg-white/80 border-gray-200/80'
    }`}>
      <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-md transition-colors ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <Menu size={20} />
        </button>
        <div className={`text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2 ${
          isDarkMode
            ? 'bg-gray-700 text-gray-300'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {statusMsg ||
            (loading ? (
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-blue-400" />
                <span>Thinking...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-green-500" />
                <span className="text-green-500">Ready</span>
              </div>
            ))}
        </div>
      </div>
    </header>
  );
}