import React, { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUp, Paperclip, Loader2, X, File as FileIcon, Mic, MicOff } from "lucide-react";

interface FileData {
  name: string;
  content: string;
}

interface InputBoxProps {
  input: string;
  files: FileData[];
  loading: boolean;
  isDragging: boolean;
  isDarkMode: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFileUpload: (files: FileList) => void;
  onRemoveFile: (index: number) => void;
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

export default function InputBox({
  input,
  files,
  loading,
  isDragging,
  isDarkMode,
  onInputChange,
  onSend,
  onFileUpload,
  onRemoveFile,
}: InputBoxProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSend();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
      if (e.target) e.target.value = "";
    }
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsListening(true);
    };

    recognitionInstance.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onInputChange(input + transcript);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    setRecognition(recognitionInstance);
    recognitionInstance.start();
  };

  const stopVoiceRecognition = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return (
    <div className={`px-6 pb-6 pt-4 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {files.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 rounded-lg pl-3 pr-2 py-2 text-sm shadow-sm ${
                isDarkMode
                  ? 'bg-gray-700 border border-gray-600 text-gray-200'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              <FileIcon className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-blue-600'}`} />
              <div className="max-w-[160px]">
                <div className="font-medium truncate">
                  {truncate(file.name, 20)}
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                  {formatFileSize(file.content.length)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                className={`ml-1 transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-blue-500 hover:text-blue-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleFormSubmit}
        className={`relative transition-all duration-200 ${
          isDragging
            ? isDarkMode
              ? "ring-2 ring-blue-500 bg-blue-900/20"
              : "ring-2 ring-blue-500 bg-blue-50/50"
            : ""
        }`}
      >
        <div className={`relative flex items-end rounded-2xl shadow-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-colors ${
          isDarkMode
            ? 'bg-gray-800 border border-gray-600'
            : 'bg-white border border-gray-300'
        }`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Message AidGPT..."
            className={`w-full p-4 pr-24 rounded-2xl border-none focus:outline-none resize-none bg-transparent text-sm transition-colors ${
              isDarkMode
                ? 'text-white placeholder-gray-400'
                : 'text-gray-900 placeholder-gray-500'
            }`}
            rows={1}
            style={{ minHeight: "56px", maxHeight: "200px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
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
              onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Attach file"
            >
              <Paperclip size={20} />
            </button>

            <button
              type="submit"
              disabled={loading || (!input.trim() && files.length === 0)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                loading || (!input.trim() && files.length === 0)
                  ? isDarkMode
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ArrowUp size={20} />
              )}
            </button>
          </div>
        </div>
      </form>
      {isDragging && (
        <div className="mt-3 text-sm text-center text-blue-400 font-medium">
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
  );
}