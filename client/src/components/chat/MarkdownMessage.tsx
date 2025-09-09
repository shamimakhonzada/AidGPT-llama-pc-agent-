import ReactMarkdown from "react-markdown";
// @ts-ignore
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// @ts-ignore
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownMessageProps {
  content: string;
  isDarkMode: boolean;
}

export default function MarkdownMessage({
  content,
  isDarkMode,
}: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      components={{
        // @ts-ignore
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              // @ts-ignore
              style={isDarkMode ? oneDark : oneLight}
              language={match[1]}
              PreTag="div"
              className="rounded-lg text-sm"
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code
              className={`px-1.5 py-0.5 rounded text-sm font-mono ${
                isDarkMode
                  ? "bg-slate-700 text-slate-200"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {children}
            </code>
          );
        },
        p({ children }) {
          return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
        },
        h1({ children }) {
          return (
            <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          );
        },
        h2({ children }) {
          return (
            <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0">
              {children}
            </h2>
          );
        },
        h3({ children }) {
          return (
            <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0">
              {children}
            </h3>
          );
        },
        ul({ children }) {
          return (
            <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
          );
        },
        ol({ children }) {
          return (
            <ol className="list-decimal list-inside mb-3 space-y-1">
              {children}
            </ol>
          );
        },
        li({ children }) {
          return <li className="leading-relaxed">{children}</li>;
        },
        blockquote({ children }) {
          return (
            <blockquote
              className={`border-l-4 pl-4 my-4 italic ${
                isDarkMode
                  ? "border-slate-600 text-slate-300"
                  : "border-gray-300 text-gray-600"
              }`}
            >
              {children}
            </blockquote>
          );
        },
        strong({ children }) {
          return <strong className="font-semibold">{children}</strong>;
        },
        em({ children }) {
          return <em className="italic">{children}</em>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
