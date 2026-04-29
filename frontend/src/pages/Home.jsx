import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Bot,
  Copy,
  Menu,
  Moon,
  SendHorizonal,
  Sparkles,
  Sun,
  User,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import { delete_thread, get_chat, get_thread } from "../services/api.js";
import useDarkMode from "../hooks/useDarkMode";
const backend_url = import.meta.env.VITE_BACKEND_URL;
console.log("Backend URL:", backend_url);

export default function Home() {
  const [isDark, toggleDark] = useDarkMode();
  const [threads, setThreads] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    const res = await get_thread();
    const nextThreads = res.data.threads || [];

    setThreads(nextThreads);

    if (nextThreads.length > 0) {
      setThreadId(nextThreads[0]);
    }
  };

  useEffect(() => {
    if (threadId) {
      fetchChat(threadId);
    }
  }, [threadId]);

  const fetchChat = async (id) => {
    const res = await get_chat(id);
    setMessages(res.data.history || []);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const currentInput = input;
    const userMessage = { role: "user", content: currentInput };

    setInput("");
    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "assistant", content: "Typing..." },
    ]);

    const response = await fetch(`${backend_url}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: currentInput, thread_id: threadId }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      aiText += decoder.decode(value);

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: aiText,
        };
        return updated;
      });
    }
  };

  const createNewChat = () => {
    const newId = crypto.randomUUID();
    setThreads((prev) => [newId, ...prev]);
    setThreadId(newId);
    setMessages([]);
  };

  const deleteChat = (id) => {
    delete_thread(id);

    setThreads((prev) => {
      const nextThreads = prev.filter((t) => t !== id);

      if (threadId === id) {
        setThreadId(nextThreads[0] || null);
        if (nextThreads.length === 0) {
          setMessages([]);
        }
      }

      return nextThreads;
    });
  };

  const copyToClipboard = async (text, index) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_24%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_48%,_#ecfeff_100%)] text-slate-900 dark:bg-none dark:bg-slate-950 dark:text-slate-100">
      {sidebarOpen && (
        <Sidebar
          threads={threads}
          setThreadId={setThreadId}
          createNewChat={createNewChat}
          deleteChat={deleteChat}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        {/* ── Header ── */}
        <header className="border-b border-white/60 bg-white/70 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-6 dark:border-slate-700/60 dark:bg-slate-900/80">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Toggle sidebar"
              >
                <Menu size={18} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-300/70 dark:bg-white dark:text-slate-900 dark:shadow-slate-900/70">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
                      SITE-BOT
                    </h1>
                    <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                      Your conversational workspace
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDark}
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm sm:block dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                Online
              </div>
            </div>
          </div>
        </header>

        {/* ── Chat area ── */}
        <section className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 dark:bg-slate-950">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-4xl items-center justify-center">
              <div className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/75 p-8 text-center shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/75">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-300/70 dark:bg-white dark:text-slate-900 dark:shadow-slate-900/50">
                  <Sparkles size={24} />
                </div>
                <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Start a smarter conversation
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 sm:text-base dark:text-slate-400">
                  Ask questions, generate ideas, review code, or draft content.
                  Your replies will stream in here as the assistant thinks.
                </p>
                <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      Explore
                    </p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                      Brainstorm product ideas, names, and launch copy.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      Build
                    </p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                      Get code help, markdown, and formatted technical answers.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      Refine
                    </p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                      Edit text, summarize content, and polish responses fast.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-5xl space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex w-full ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`group flex w-full gap-3 ${
                      msg.role === "user"
                        ? "max-w-3xl flex-row-reverse"
                        : "max-w-4xl"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
                    </div>

                    <div
                      className={`relative min-w-0 rounded-[1.5rem] border px-5 py-4 shadow-sm ${
                        msg.role === "user"
                          ? "border-blue-500 bg-blue-600 text-white shadow-blue-200/70 dark:shadow-blue-900/40"
                          : "border-white/80 bg-white/85 text-slate-800 shadow-slate-200/70 backdrop-blur dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:shadow-slate-900/50"
                      }`}
                    >
                      {msg.role !== "user" && (
                        <button
                          onClick={() => copyToClipboard(msg.content, i)}
                          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                        >
                          <Copy size={12} />
                          {copiedIndex === i ? "Copied" : "Copy"}
                        </button>
                      )}

                      <div
                        className={`prose prose-sm max-w-none ${
                          msg.role === "user"
                            ? "prose-invert"
                            : "prose-slate dark:prose-invert"
                        } prose-pre:bg-transparent prose-pre:p-0 prose-code:rounded prose-code:px-1 prose-code:py-0.5`}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ className, children, ...props }) {
                              const match = /language-(\w+)/.exec(
                                className || "",
                              );
                              const codeText = String(children).replace(/\n$/, "");
                              const isInline = !match;

                              if (!isInline && match) {
                                return (
                                  <div className="overflow-hidden rounded-2xl border border-slate-700 my-3">
                                    <div className="flex items-center justify-between bg-slate-900 px-4 py-2 text-xs text-slate-300">
                                      <span className="font-medium uppercase tracking-[0.18em]">
                                        {match[1]}
                                      </span>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(codeText, `code-${i}`)
                                        }
                                        className="rounded-full border border-slate-700 px-2.5 py-1 text-slate-300 transition hover:border-slate-500 hover:text-white"
                                      >
                                        {copiedIndex === `code-${i}`
                                          ? "Copied"
                                          : "Copy"}
                                      </button>
                                    </div>

                                    <SyntaxHighlighter
                                      style={oneDark}
                                      language={match[1]}
                                      wrapLongLines
                                      showLineNumbers
                                      customStyle={{
                                        margin: 0,
                                        padding: "1rem",
                                        background: "#0f172a",
                                      }}
                                    >
                                      {codeText}
                                    </SyntaxHighlighter>
                                  </div>
                                );
                              }

                              return (
                                <code
                                  className={`rounded px-1.5 py-0.5 font-semibold ${
                                    msg.role === "user"
                                      ? "bg-white/15 text-white"
                                      : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                                  }`}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                            table({ children }) {
                              return (
                                <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                                  <table className="w-full text-sm">
                                    {children}
                                  </table>
                                </div>
                              );
                            },
                            thead({ children }) {
                              return (
                                <thead className="bg-slate-100 dark:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-600">
                                  {children}
                                </thead>
                              );
                            },
                            tbody({ children }) {
                              return <tbody className="divide-y divide-slate-200 dark:divide-slate-700">{children}</tbody>;
                            },
                            tr({ children }) {
                              return <tr className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">{children}</tr>;
                            },
                            th({ children }) {
                              return (
                                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100 first:pl-4 last:pr-4">
                                  {children}
                                </th>
                              );
                            },
                            td({ children }) {
                              return (
                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 first:pl-4 last:pr-4 break-words">
                                  {children}
                                </td>
                              );
                            },
                            a({ href, children }) {
                              return (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline transition underline-offset-2 decoration-blue-300 dark:decoration-blue-600"
                                >
                                  {children}
                                </a>
                              );
                            },
                            blockquote({ children }) {
                              return (
                                <blockquote className="my-3 border-l-4 border-blue-500 bg-slate-50 dark:bg-slate-800 pl-4 py-2 pr-3 rounded-r-lg italic text-slate-700 dark:text-slate-300">
                                  {children}
                                </blockquote>
                              );
                            },
                            h1({ children }) {
                              return <h1 className="text-2xl font-bold mt-4 mb-2 text-slate-900 dark:text-slate-100">{children}</h1>;
                            },
                            h2({ children }) {
                              return <h2 className="text-xl font-bold mt-3 mb-2 text-slate-900 dark:text-slate-100">{children}</h2>;
                            },
                            h3({ children }) {
                              return <h3 className="text-lg font-bold mt-3 mb-1.5 text-slate-900 dark:text-slate-100">{children}</h3>;
                            },
                            ol({ children }) {
                              return <ol className="list-decimal list-inside space-y-1.5 my-2 text-slate-700 dark:text-slate-300">{children}</ol>;
                            },
                            ul({ children }) {
                              return <ul className="list-disc list-inside space-y-1.5 my-2 text-slate-700 dark:text-slate-300">{children}</ul>;
                            },
                            li({ children }) {
                              return <li className="ml-2">{children}</li>;
                            },
                            p({ children }) {
                              return <p className="my-2 leading-relaxed text-slate-700 dark:text-slate-300">{children}</p>;
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div ref={chatEndRef} />
            </div>
          )}
        </section>

        {/* ── Footer / Input ── */}
        <footer className="border-t border-white/60 bg-white/75 px-4 py-4 backdrop-blur-xl sm:px-6 dark:border-slate-700/60 dark:bg-slate-900/80">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1">
                  <textarea
                    rows={1}
                    className="max-h-40 min-h-[52px] w-full resize-none rounded-2xl border-0 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:bg-slate-100 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-600"
                    placeholder="Ask anything, request code, or continue the conversation..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                </div>

                <button
                  onClick={sendMessage}
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white shadow-lg shadow-slate-300/70 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:shadow-slate-900/50 dark:hover:bg-white"
                >
                  <SendHorizonal size={16} />
                  Send
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between px-1 text-xs text-slate-400 dark:text-slate-500">
                <span>Press Enter to send</span>
                <span>Shift + Enter for a new line</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}