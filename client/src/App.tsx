import React, {
  useEffect,
  useState,
  useRef,
  type FormEvent,
  useCallback,
} from "react";

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
function IconSend(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-3-9-9-3 19-8z" />
    </svg>
  );
}

function IconAttachment(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function IconGPT(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 8V16M8 12H16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" />
    </svg>
  );
}

function IconClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconFile(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M13 2v7h7" />
    </svg>
  );
}

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

function IconCopy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function IconEdit(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
  );
}

function TypingIndicator() {
  return (
    <div className="flex space-x-1">
      <div
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
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
      className={`group w-full flex ${
        m.role === "user" ? "justify-end" : "justify-start"
      } mb-4 animate-fade-in`}
    >
      <div
        className={`flex max-w-[90%] ${
          m.role === "user" ? "flex-row-reverse" : ""
        }`}
      >
        <div className="relative group">
          {/* Message bubble */}
          <div
            className={`p-4 rounded-2xl transition-all duration-300 ${
              m.role === "user"
                ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-br-none ml-8"
                : "bg-gray-100 text-gray-900 rounded-bl-none mr-8"
            }`}
          >
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-3 text-sm bg-white/10 border border-indigo-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  rows={Math.min(editText.split("\n").length + 1, 10)}
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
                    className="px-3 py-1.5 text-xs bg-indigo-500/30 hover:bg-indigo-500/50 rounded-lg transition-colors"
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

            {/* File attachments */}
            {m.files && m.files.length > 0 && (
              <div
                className={`mt-4 pt-3 border-t ${
                  m.role === "user" ? "border-indigo-300/50" : "border-gray-300"
                }`}
              >
                <div className="text-xs font-medium mb-2 opacity-80">
                  Attachments:
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.files.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs shadow-sm ${
                        m.role === "user"
                          ? "bg-indigo-500/20 text-indigo-100"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      <IconFile className="w-4 h-4" />
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

            {/* (timestamps removed) */}
          </div>

          {/* Floating Action Buttons (only on hover) */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              m.role === "user" ? "-left-9" : "-right-9"
            }`}
          >
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-full shadow bg-white hover:bg-gray-100 transition"
              title="Copy"
            >
              {copied ? (
                <IconCheck className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <IconCopy className="w-3.5 h-3.5 text-gray-600" />
              )}
            </button>

            {/* Edit (only for user) */}
            {m.role === "user" && onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-full shadow bg-indigo-500 hover:bg-indigo-600 text-white transition"
                title="Edit"
              >
                <IconEdit className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main App Component ---
export default function App() {
  const [messages, setMessages] = useState<MessageProps["m"][]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [files, setFiles] = useState<{ name: string; content: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sysMsg: MessageProps["m"] = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "Hello! I'm your AI assistant. You can attach files to your messages for me to analyze.",
    };
    setMessages([sysMsg]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function pushMessage(
    role: "user" | "assistant",
    text: string,
    files: { name: string; content: string }[] = []
  ) {
    const newMessage = {
      id: crypto.randomUUID(),
      role,
      text,
      files: files.length > 0 ? files : undefined,
    };
    setMessages((s) => [...s, newMessage]);
    return newMessage;
  }

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
      // Reset input to allow selecting same file again
      if (e.target) e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  async function sendPrompt(prompt: string) {
    if (!prompt || loading) return;

    pushMessage("user", prompt, files);
    setLoading(true);
    setStatusMsg("Analyzing your request...");
    setInput("");
    const filesToSend = [...files];
    setFiles([]);

    try {
      const payload = {
        prompt,
        files: filesToSend,
      };

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${errorText}`);
      }

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
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === msgId ? { ...m, text: accumulated } : m
                  )
                );
              } else if (parsed.type === "complete") {
                // Optionally correct text if needed
                if (parsed.data.reply) {
                  accumulated = parsed.data.reply;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === msgId ? { ...m, text: accumulated } : m
                    )
                  );
                }
                if (parsed.data.results?.length) {
                  const summary = parsed.data.results
                    .map((r: any) => {
                      const action = r.action?.action || r.action?.type || "?";
                      const path = r.action?.path || "";
                      const success =
                        r.result?.ok === true || (r.result && !r.result.error);
                      return `${action} ${
                        path ? `-> ${truncate(path, 100)}` : ""
                      }: ${
                        success
                          ? "✓ Success"
                          : `✗ Error: ${r.result?.error || "Unknown"}`
                      }`;
                    })
                    .join("\n");
                  // pushMessage("assistant", `Actions executed:\n${summary}`);
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
      pushMessage("assistant", `Sorry, I encountered an error: ${err.message}`);
      setStatusMsg("Error");
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(null), 3000);
      inputRef.current?.focus();
    }
  }

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() || files.length > 0) {
      sendPrompt(input);
    }
  };

  const handleEditMessage = (id: string, newText: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, text: newText } : msg))
    );
  };

  const startNewChat = () => {
    const sysMsg: MessageProps["m"] = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "Hello! I'm your AI assistant. You can attach files to your messages for me to analyze.",
    };
    setMessages([sysMsg]);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 font-sans antialiased flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-20 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Conversations
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <IconGPT className="w-4 h-4" />
            New Chat
          </button>

          <div className="mt-4 space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Current Chat
            </div>
            <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
              {messages.length} messages
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">AidGPT Assistant</div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
              >
                <IconMenu className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white">
                <IconGPT className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">AidGPT</h1>
                <p className="text-xs text-gray-500">
                  Your intelligent local file assistant
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500 font-medium px-3 py-1 rounded-full bg-gray-100">
              {statusMsg || (loading ? <TypingIndicator /> : "Ready")}
            </div>
          </div>
        </header>

        {/* Main Chat Area */}
        <main className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto px-4 py-6">
          <div
            className="flex-1 overflow-y-auto mb-4 space-y-6 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            style={{ scrollbarGutter: "stable" }}
          >
            {messages.map((m) => (
              <Message key={m.id} m={m} onEdit={handleEditMessage} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <IconGPT className="w-4 h-4 text-gray-700" />
                  </div>
                  <div className="p-4 bg-gray-100 rounded-2xl rounded-bl-none">
                    <TypingIndicator />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="sticky bottom-0 bg-transparent pt-6 pb-4">
            {/* File attachments preview */}
            {files.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <IconFile className="w-4 h-4 text-blue-600" />
                    <div className="max-w-[160px]">
                      <div className="font-medium truncate">
                        {truncate(file.name, 20)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(file.content.length)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <IconClose className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleFormSubmit}
              className={`relative rounded-xl border ${
                isDragging
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                  : "border-gray-300/70 bg-white"
              } shadow-lg transition-all duration-200 ${
                // Only show focus ring when form is focused but not dragging
                !isDragging
                  ? "focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
                  : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message AidGPT or drag files here..."
                className="w-full p-4 pr-16 rounded-xl border-none focus:outline-none resize-none bg-transparent"
                rows={1}
                style={{ minHeight: "60px", maxHeight: "200px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() || files.length > 0) {
                      sendPrompt(input);
                    }
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
                onFocus={() => setIsDragging(false)} // Clear drag state when typing
              />

              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    inputRef.current?.focus(); // Maintain focus after file selection
                  }}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  aria-label="Attach file"
                >
                  <IconAttachment />
                </button>

                <button
                  type="submit"
                  disabled={loading || (!input && files.length === 0)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    loading || (!input && files.length === 0)
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  }`}
                  aria-label="Send message"
                >
                  {loading ? <Spinner /> : <IconSend />}
                </button>
              </div>
            </form>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
              accept=".txt,.js,.ts,.jsx,.tsx,.json,.html,.css,.md,.py,.java,.c,.cpp,.cs,.php,.rb,.go,.rs,.swift,.kt"
            />

            <p className="text-xs text-center text-gray-500 mt-2">
              {isDragging
                ? "Drop files to attach them"
                : "AidGPT can analyze text files. Max 3 files, 2MB each. Supported: code, text, docs"}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
