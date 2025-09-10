import React, { memo } from "react";
import { Menu, Loader2, Bot } from "lucide-react";

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  statusMsg: string | null;
  loading: boolean;
  isDarkMode: boolean;
}

const Header = ({
  onToggleSidebar,
  statusMsg,
  loading,
  isDarkMode,
}: HeaderProps) => {
  return (
    <header
      className={`border-b sticky top-0 z-10 lg:hidden ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <div className="max-w-4xl sm:max-w-5xl mx-auto flex items-center justify-between p-3 sm:p-4">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-md transition-colors ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
          }`}
        >
          <Menu size={20} />
        </button>
        <div
          className={`text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2 ${
            isDarkMode
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-100 text-gray-600"
          }`}
        >
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
};

export default memo(Header);
