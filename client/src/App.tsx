import React, {
  useEffect,
  useState,
  useRef,
  type FormEvent,
  useCallback,
} from "react";
import {
  ArrowUp,
  Paperclip,
  Plus,
  MessageSquare,
  Search,
  Copy,
  Check,
  Pencil,
  X,
  File as FileIcon,
  Menu,
  Loader2,
  Bot,
  Trash2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const API_ENDPOINT = API_BASE + "/api/ai/command";

// --- Utility Functions ---
function truncate(s: string, n = 60): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(1)).toString() + " " + sizes[i]
  );
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

// --- UI Components ---

function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1">
      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
      <div
        className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

interface MessageProps {
  m: {
    id: string;
    role: "user" | "assistant";
    text: string;
    files?: { name: string; content: string }[];
  };
  onEdit?: (id: string, newText: string) => void;
}

function Message({ m, onEdit }: MessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(m.text);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(m.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSaveEdit = () => {
    if (onEdit && editText.trim()) {
      onEdit(m.id, editText);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(m.text);
    setIsEditing(false);
  };

  return (
    <div
      className={`group flex w-full ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
    >
      <div
        className={`flex max-w-[90%] items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
        >
          {m.role === "user" ? (
            <Bot size={18} />
          ) : (
            <Bot size={18} className="transform -scale-x-100" />
          )}
        </div>
        <div className="relative">
          <div
            className={`p-4 rounded-2xl transition-all duration-300 ${m.role === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-white text-gray-900 rounded-bl-none border border-gray-200"}`}
          >
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-3 text-sm bg-white/10 border border-blue-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  rows={Math.min(editText.split('\n').length + 1, 10)}
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-xs bg-gray-500/20 hover:bg-gray-500/30 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 text-xs bg-blue-500/30 hover:bg-blue-500/50 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {m.text}
              </div>
            )}

            {m.files && m.files.length > 0 && (
              <div
                className={`mt-4 pt-3 border-t ${m.role === "user" ? "border-blue-300/50" : "border-gray-200"}`}
              >
                <div className="text-xs font-medium mb-2 opacity-80">
                  Attachments:
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.files.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs shadow-sm ${m.role === "user" ? "bg-blue-400/50 text-blue-100" : "bg-gray-100 text-gray-700"}`}
                    >
                      <FileIcon className="w-4 h-4" />
                      <span className="font-medium">
                        {truncate(file.name, 20)}
                      </span>
                      <span className="opacity-70">
                        {formatFileSize(file.content.length)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className={`absolute top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${m.role === "user" ? "-left-10" : "-right-10"}`}
          >
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-gray-200 transition text-gray-600"
              title="Copy"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {m.role === "user" && onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-gray-200 transition text-gray-600"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Chat {
  id: string;
  title: string;
  messages: MessageProps["m"][]
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

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      setCurrentChatId(parsed.currentId || (parsed.chats && parsed.chats[0]?.id) || null);
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        inputRef.current?.focus();
      }
    },
    [pushMessage, updateMessageText]
  );

  const handleFileUpload = useCallback((fileList: FileList) => {
    const filesToProcess = Array.from(fileList).slice(0, 3);
    const promises = filesToProcess.map(
      (file) =>
        new Promise<{ name: string; content: string } | null>((resolve) => {
          if (file.size > 2 * 1024 * 1024) { // 2MB limit
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
      if (e.target) e.target.value = "";
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

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendPrompt();
  };

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
    <div className="h-screen bg-gray-50 text-gray-900 font-sans antialiased flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} w-80 flex flex-col`}
      >
        <header className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h1 className="text-xl font-semibold">AidGPT</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-700 lg:hidden"
          >
            <Menu size={20} />
          </button>
        </header>

        <div className="p-4 space-y-4">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Chat
          </button>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
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
                  onClick={() => {
                    setCurrentChatId(c.id);
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${c.id === currentChatId ? "bg-gray-700" : "hover:bg-gray-700/50"}`}
                >
                  <MessageSquare size={16} className="flex-shrink-0" />
                  <span className="truncate flex-1">{c.title}</span>
                </button>
                <button
                  onClick={() => deleteChat(c.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </nav>

        <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
          AidGPT Assistant
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/60 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-10 lg:hidden">
          <div className="max-w-5xl mx-auto flex items-center justify-between p-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
            <div className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
              {statusMsg ||
                (loading ? (
                  <TypingIndicator />
                ) : (
                  <span className="text-green-600">Ready</span>
                ))}
            </div>
          </div>
        </header>

        <main
          className="flex-1 overflow-hidden flex flex-col"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m) => (
              <Message key={m.id} m={m} onEdit={handleEditMessage} />
            ))}
            {loading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot
                      size={18}
                      className="text-gray-600 transform -scale-x-100"
                    />
                  </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-2xl rounded-bl-none">
                    <TypingIndicator />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-6 pb-6 pt-4 bg-gradient-to-t from-gray-50 to-transparent">
            {files.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-blue-100/80 border border-blue-200 rounded-lg pl-3 pr-2 py-1.5 text-sm"
                  >
                    <FileIcon className="w-4 h-4 text-blue-600" />
                    <div className="max-w-[160px]">
                      <div className="font-medium truncate text-blue-800">
                        {truncate(file.name, 20)}
                      </div>
                      <div className="text-xs text-blue-600">
                        {formatFileSize(file.content.length)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-1 text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleFormSubmit}
              className={`relative transition-all duration-200 ${isDragging ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
            >
              <div className="relative flex items-end bg-white border border-gray-300/70 rounded-xl shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message AidGPT..."
                  className="w-full p-4 pr-24 rounded-xl border-none focus:outline-none resize-none bg-transparent text-sm"
                  rows={1}
                  style={{ minHeight: "56px", maxHeight: "200px" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendPrompt();
                    }
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(
                      target.scrollHeight,
                      200
                    )}px`;
                  }}
                />

                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    aria-label="Attach file"
                  >
                    <Paperclip size={18} />
                  </button>

                  <button
                    type="submit"
                    disabled={loading || (!input.trim() && files.length === 0)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    aria-label="Send message"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <ArrowUp size={18} />
                    )}
                  </button>
                </div>
              </div>
            </form>
            {isDragging && (
              <div className="mt-2 text-sm text-center text-blue-600">
                Drop files to attach them
              </div>
            )}
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
              accept=".txt,.js,.ts,.jsx,.tsx,.json,.html,.css,.md,.py,.java,.c,.cpp,.cs,.php,.rb,.go,.rs,.swift,.kt"
            />
          </div>
        </main>
      </div>
    </div>
  );
}