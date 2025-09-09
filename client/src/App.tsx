import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import ChatWindow from "./components/chat/ChatWindow";
import InputBox from "./components/chat/InputBox";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const API_ENDPOINT = API_BASE + "/api/ai/command";

// --- Utility Functions ---
function truncate(s: string, n = 60): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// --- API Communication ---
async function apiCall(
  prompt: string,
  files: { name: string; content: string }[] = [],
  options: RequestInit = {}
) {
  const payload = {
    prompt,
    ...(files.length > 0 && { files }),
  };

  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Network response was not ok: ${errorText}`);
  }
  return response;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  files?: { name: string; content: string }[];
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [files, setFiles] = useState<{ name: string; content: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);

  const currentChat = chats.find((c) => c.id === currentChatId);
  const messages = currentChat?.messages || [];

  const startNewChat = useCallback(() => {
    const newId = crypto.randomUUID();
    setChats((prev) => [
      { id: newId, title: "New Chat", messages: [] },
      ...prev,
    ]);
    setCurrentChatId(newId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("chats");
    if (stored) {
      const parsed = JSON.parse(stored);
      setChats(parsed.chats || []);
      setCurrentChatId(
        parsed.currentId || (parsed.chats && parsed.chats[0]?.id) || null
      );
    } else {
      startNewChat();
    }
  }, [startNewChat]);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(
        "chats",
        JSON.stringify({ chats, currentId: currentChatId })
      );
    }
  }, [chats, currentChatId]);

  const pushMessage = useCallback(
    (
      role: "user" | "assistant",
      text: string,
      files: { name: string; content: string }[] = []
    ) => {
      const newMessage = {
        id: crypto.randomUUID(),
        role,
        text,
        files: files.length > 0 ? files : undefined,
      };
      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId
            ? { ...c, messages: [...c.messages, newMessage] }
            : c
        )
      );
      return newMessage;
    },
    [currentChatId]
  );

  const updateMessageText = useCallback(
    (msgId: string, text: string) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === msgId ? { ...m, text } : m
                ),
              }
            : c
        )
      );
    },
    [currentChatId]
  );

  const updateChatTitle = useCallback(
    (newTitle: string) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId ? { ...c, title: newTitle } : c
        )
      );
    },
    [currentChatId]
  );

  const streamResponse = useCallback(
    async (prompt: string, files: { name: string; content: string }[]) => {
      try {
        const response = await apiCall(prompt, files);

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        const assistantMsg = pushMessage("assistant", "");
        const msgId = assistantMsg.id;
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          while (true) {
            const eventEnd = buffer.indexOf("\n\n");
            if (eventEnd === -1) break;

            const event = buffer.slice(0, eventEnd);
            buffer = buffer.slice(eventEnd + 2);

            const dataMatch = event.match(/^data: (.*)/s);
            if (dataMatch) {
              try {
                const parsed = JSON.parse(dataMatch[1]);
                if (parsed.type === "delta") {
                  const delta = parsed.data;
                  accumulated += delta;
                  updateMessageText(msgId, accumulated);
                } else if (parsed.type === "complete") {
                  if (parsed.data.reply) {
                    accumulated = parsed.data.reply;
                    updateMessageText(msgId, accumulated);
                  }
                }
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }
        }

        setStatusMsg("Ready");
      } catch (err: any) {
        console.error(err);
        pushMessage(
          "assistant",
          `Sorry, I encountered an error: ${err.message}`
        );
        setStatusMsg("Error");
      } finally {
        setLoading(false);
        setTimeout(() => setStatusMsg(null), 3000);
      }
    },
    [pushMessage, updateMessageText]
  );

  const handleFileUpload = useCallback((fileList: FileList) => {
    const filesToProcess = Array.from(fileList).slice(0, 3);
    const promises = filesToProcess.map(
      (file) =>
        new Promise<{ name: string; content: string } | null>((resolve) => {
          if (file.size > 2 * 1024 * 1024) {
            // 2MB limit
            setStatusMsg(`File ${file.name} is too large (max 2MB)`);
            setTimeout(() => setStatusMsg(null), 3000);
            resolve(null);
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            resolve({ name: file.name, content });
          };
          reader.onerror = () => {
            setStatusMsg(`Error reading ${file.name}`);
            setTimeout(() => setStatusMsg(null), 3000);
            resolve(null);
          };
          reader.readAsText(file);
        })
    );

    Promise.all(promises).then((processedFiles) => {
      const validFiles = processedFiles.filter((file) => file !== null) as {
        name: string;
        content: string;
      }[];
      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        setStatusMsg(`Added ${validFiles.length} file(s)`);
        setTimeout(() => setStatusMsg(null), 2000);
      }
    });
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendPrompt = useCallback(async () => {
    if ((!input.trim() && files.length === 0) || loading) return;

    const prompt = input;
    const filesToSend = [...files];

    if (messages.length === 0 && prompt.trim()) {
      updateChatTitle(truncate(prompt, 30));
    }

    pushMessage("user", prompt, filesToSend);
    setInput("");
    setFiles([]);
    setLoading(true);
    setStatusMsg("Analyzing...");
    await streamResponse(prompt, filesToSend);
  }, [
    input,
    files,
    loading,
    messages.length,
    updateChatTitle,
    pushMessage,
    streamResponse,
  ]);

  const handleEditMessage = useCallback(
    (id: string, newText: string) => {
      const editedMsg = messages.find((m) => m.id === id);
      if (!editedMsg) return;

      const editedFiles = editedMsg.files || [];

      setChats((prev) => {
        return prev.map((c) => {
          if (c.id !== currentChatId) return c;
          const msgs = [...c.messages];
          const idx = msgs.findIndex((m) => m.id === id);
          if (idx === -1) return c;
          msgs[idx] = { ...msgs[idx], text: newText };
          return { ...c, messages: msgs.slice(0, idx + 1) };
        });
      });

      setLoading(true);
      setStatusMsg("Analyzing...");
      streamResponse(newText, editedFiles);
    },
    [messages, currentChatId, streamResponse]
  );

  const deleteChat = useCallback(
    (id: string) => {
      setChats((prev) => {
        const newChats = prev.filter((c) => c.id !== id);
        if (currentChatId === id) {
          setCurrentChatId(newChats[0]?.id || null);
        }
        return newChats;
      });
    },
    [currentChatId]
  );

  return (
    <div
      className={`h-screen font-sans antialiased flex transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        searchQuery={searchQuery}
        sidebarOpen={sidebarOpen}
        isDarkMode={isDarkMode}
        onNewChat={startNewChat}
        onSelectChat={(id) => {
          setCurrentChatId(id);
          if (window.innerWidth < 1024) {
            setSidebarOpen(false);
          }
        }}
        onDeleteChat={deleteChat}
        onSearchChange={setSearchQuery}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
          statusMsg={statusMsg}
          loading={loading}
          isDarkMode={isDarkMode}
        />

        <main
          className="flex-1 overflow-hidden flex flex-col"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <ChatWindow
            messages={messages}
            loading={loading}
            isDarkMode={isDarkMode}
            onEditMessage={handleEditMessage}
          />

          <InputBox
            input={input}
            files={files}
            loading={loading}
            isDragging={isDragging}
            isDarkMode={isDarkMode}
            onInputChange={setInput}
            onSend={sendPrompt}
            onFileUpload={handleFileUpload}
            onRemoveFile={removeFile}
          />
        </main>
      </div>
    </div>
  );
}
