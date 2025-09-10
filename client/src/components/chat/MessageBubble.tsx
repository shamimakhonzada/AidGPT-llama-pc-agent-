import { useState, memo } from "react";
import { Copy, Check, Pencil, File as FileIcon, Bot } from "lucide-react";
import MarkdownMessage from "./MarkdownMessage";

interface MessageProps {
  m: {
    id: string;
    role: "user" | "assistant";
    text: string;
    files?: { name: string; content: string }[];
  };
  onEdit?: (id: string, newText: string) => void;
  isDarkMode?: boolean;
}

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

const MessageBubble = ({
  m,
  onEdit,
  isDarkMode = false,
}: MessageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(m.text);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(m.text);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2000);
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
      className={`group flex w-full animate-fade-in ${
        m.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex max-w-[90%] sm:max-w-[85%] md:max-w-[80%] items-start gap-2 sm:gap-3 ${
          m.role === "user" ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm ${
            m.role === "user"
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
              : isDarkMode
              ? "bg-gradient-to-br from-gray-600 to-gray-700 text-gray-300"
              : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600"
          }`}
        >
          <Bot size={16} />
        </div>
        <div className="relative flex-1">
          <div
            className={`p-3 sm:p-4 rounded-2xl shadow-lg transition-all duration-300 ${
              m.role === "user"
                ? "bg-blue-600 text-white rounded-br-md shadow-blue-500/25"
                : isDarkMode
                ? "bg-gray-700 text-white rounded-bl-md border border-gray-600 shadow-gray-900/50"
                : "bg-white text-gray-900 rounded-bl-md border border-gray-200 shadow-gray-200/50"
            }`}
          >
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-3 text-sm bg-white/10 border border-blue-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                    className="px-3 py-1.5 text-xs bg-blue-500/30 hover:bg-blue-500/50 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed">
                <MarkdownMessage content={m.text} isDarkMode={isDarkMode} />
              </div>
            )}

            {m.files && m.files.length > 0 && (
              <div
                className={`mt-3 sm:mt-4 pt-2 sm:pt-3 border-t ${
                  m.role === "user" ? "border-blue-300/50" : "border-gray-200"
                }`}
              >
                <div className="text-xs font-medium mb-1 sm:mb-2 opacity-80">
                  Attachments:
                </div>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {m.files.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-xl text-xs shadow-sm ${
                        m.role === "user"
                          ? "bg-blue-400/50 text-blue-100"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <FileIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium max-w-[100px] sm:max-w-[120px] truncate">
                        {truncate(file.name, 15)}
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
            className={`absolute top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              m.role === "user" ? "-left-12" : "-right-12"
            }`}
          >
            <button
              onClick={handleCopy}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-gray-200 transition text-gray-600 shadow-sm"
              title={copyError ? "Copy failed" : copied ? "Copied!" : "Copy"}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : copyError ? (
                <Copy className="w-4 h-4 text-red-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {m.role === "user" && onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-gray-200 transition text-gray-600 shadow-sm"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MessageBubble);
