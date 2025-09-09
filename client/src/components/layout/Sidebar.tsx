import React from "react";
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Menu,
} from "lucide-react";

interface Chat {
  id: string;
  title: string;
  messages: MessageProps["m"][];
}

interface MessageProps {
  m: {
    id: string;
    role: "user" | "assistant";
    text: string;
    files?: { name: string; content: string }[];
  };
}

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  searchQuery: string;
  sidebarOpen: boolean;
  isDarkMode: boolean;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onSearchChange: (query: string) => void;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
}

export default function Sidebar({
  chats,
  currentChatId,
  searchQuery,
  sidebarOpen,
  isDarkMode,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onSearchChange,
  onToggleSidebar,
  onToggleTheme,
}: SidebarProps) {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 w-80 flex flex-col ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${isDarkMode ? 'bg-[#202123] text-white' : 'bg-white text-gray-900 border-r border-gray-200'}`}
    >
      <header className={`p-4 border-b flex items-center justify-between ${
        isDarkMode ? 'border-gray-600' : 'border-gray-200'
      }`}>
        <h1 className="text-xl font-semibold">AidGPT</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-md transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-md lg:hidden transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-[#343541] text-white hover:bg-[#40414f] border border-gray-600'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
          }`}
        >
          <Plus size={16} />
          New Chat
        </button>
        <div className="relative">
          <Search
            size={16}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search chats..."
            className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 transition-colors ${
              isDarkMode
                ? 'bg-[#40414f] border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
                : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
        {chats
          .filter((c) =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((c) => (
            <div key={c.id} className="group relative">
              <button
                onClick={() => onSelectChat(c.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  c.id === currentChatId
                    ? (isDarkMode ? "bg-[#343541]" : "bg-blue-50 border border-blue-200")
                    : (isDarkMode ? "hover:bg-[#40414f]" : "hover:bg-gray-50")
                }`}
              >
                <MessageSquare size={16} className="flex-shrink-0" />
                <span className="truncate flex-1">{c.title}</span>
              </button>
              <button
                onClick={() => onDeleteChat(c.id)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
      </nav>

      <div className={`p-4 border-t text-xs ${
        isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'
      }`}>
        AidGPT Assistant
      </div>
    </div>
  );
}