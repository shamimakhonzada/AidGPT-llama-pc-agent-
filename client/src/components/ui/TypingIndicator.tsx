export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
      <div
        className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
        style={{ animationDelay: "0.2s" }}
      />
      <div
        className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
        style={{ animationDelay: "0.4s" }}
      />
    </div>
  );
}
