import { memo } from "react";

interface TypingIndicatorProps {
  isDarkMode?: boolean;
}

const TypingIndicator = ({ isDarkMode = false }: TypingIndicatorProps) => {
  const dotColor = isDarkMode ? "bg-blue-300" : "bg-blue-400";

  return (
    <div className="flex items-center space-x-1">
      <div className={`w-2 h-2 ${dotColor} rounded-full animate-pulse`} />
      <div
        className={`w-2 h-2 ${dotColor} rounded-full animate-pulse`}
        style={{ animationDelay: "0.2s" }}
      />
      <div
        className={`w-2 h-2 ${dotColor} rounded-full animate-pulse`}
        style={{ animationDelay: "0.4s" }}
      />
    </div>
  );
};

export default memo(TypingIndicator);
