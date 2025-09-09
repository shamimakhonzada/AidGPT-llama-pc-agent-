import React from "react";

export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1">
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
      <div
        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}