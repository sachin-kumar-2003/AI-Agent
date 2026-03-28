import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { get_thread, get_chat, delete_thread } from "../services/api.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Bot, User, Copy } from "lucide-react";

export default function Home() {
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
    setThreads(res.data.threads);

    if (res.data.threads?.length > 0) {
      setThreadId(res.data.threads[0]);
    }
  };

  useEffect(() => {
    if (threadId) fetchChat(threadId);
  }, [threadId]);

  const fetchChat = async (id) => {
    const res = await get_chat(id);
    setMessages(res.data.history);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };

    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "assistant", content: "Typing..." },
    ]);

    const response = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: input, thread_id: threadId }),
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

    setInput("");
  };

  const createNewChat = () => {
    const newId = crypto.randomUUID();
    setThreads((prev) => [newId, ...prev]);
    setThreadId(newId);
    setMessages([]);
  };

  const deleteChat = (id) => {
    delete_thread(id);
    setThreads((prev) => prev.filter((t) => t !== id));

    if (threadId === id) {
      setThreadId(threads[0] || null);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      
      {/* Sidebar Toggle */}
      {sidebarOpen && (
        <Sidebar
          threads={threads}
          setThreadId={setThreadId}
          createNewChat={createNewChat}
          deleteChat={deleteChat}
        />
      )}

      <div className="flex flex-col flex-1">
        
        {/* Header */}
        <div className="p-4 bg-white/70 backdrop-blur shadow flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-2 rounded-lg hover:bg-gray-200 transition"
            >
              ☰
            </button>

            <div>
              <h1 className="text-xl font-bold">SITE-BOT</h1>
              <p className="text-xs text-gray-500">AI Assistant</p>
            </div>
          </div>

          <div className="text-xs text-green-500">● Online</div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              Start a conversation 🚀
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              
              <div className="flex gap-3 max-w-[85%]">
                
                {msg.role !== "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                )}

                <div className={`relative prose prose-sm break-words overflow-hidden px-4 py-3 rounded-2xl shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white rounded-br-none prose-invert"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}>
                  
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeText = String(children).replace(/\n$/, "");

                        if (!inline && match) {
                          return (
                            <div className="relative overflow-auto">
                              <button
                                onClick={() => copyToClipboard(codeText, i)}
                                className="absolute top-2 right-2 text-xs bg-gray-700 text-white px-2 py-1 rounded flex items-center gap-1"
                              >
                                <Copy size={12} />
                                {copiedIndex === i ? "Copied" : "Copy"}
                              </button>

                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ margin: 0, borderRadius: "0.5rem" }}
                                {...props}
                              >
                                {codeText}
                              </SyntaxHighlighter>
                            </div>
                          );
                        }

                        return (
                          <code className="bg-gray-200 px-1 py-0.5 rounded break-words">
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <User size={16} />
                  </div>
                )}

              </div>
            </div>
          ))}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t flex items-center gap-3">
          <input
            type="text"
            className="flex-1 border rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button
            onClick={sendMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full shadow-md transition"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
}