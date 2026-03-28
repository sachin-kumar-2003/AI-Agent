import { useState } from "react";
import { Plus, Trash2, MessageSquare, Pencil, Check } from "lucide-react";

export default function Sidebar({ threads, setThreadId, createNewChat, deleteChat }) {
  const [editingId, setEditingId] = useState(null);
  const [titles, setTitles] = useState({});
  const [tempTitle, setTempTitle] = useState("");

  const startEditing = (id, current) => {
    setEditingId(id);
    setTempTitle(current);
  };

  const saveTitle = (id) => {
    setTitles((prev) => ({ ...prev, [id]: tempTitle || "Untitled" }));
    setEditingId(null);
  };

  return (
    <div className="w-72 bg-white border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chats</h2>
        <button
          onClick={createNewChat}
          className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {threads.length === 0 && (
          <div className="text-sm text-gray-400 text-center mt-10">
            No chats yet
          </div>
        )}

        {threads.map((thread, index) => {
          const title = titles[thread] || `Chat ${index + 1}`;

          return (
            <div
              key={thread}
              className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition"
              onClick={() => setThreadId(thread)}
            >
              <div className="flex items-center gap-2 overflow-hidden w-full">
                <MessageSquare size={16} className="text-gray-500" />

                {editingId === thread ? (
                  <input
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="text-sm border px-1 rounded w-full"
                    onKeyDown={(e) => e.key === "Enter" && saveTitle(thread)}
                    autoFocus
                  />
                ) : (
                  <span
                    className="text-sm truncate"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startEditing(thread, title);
                    }}
                  >
                    {title}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 ml-2">
                {editingId === thread ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveTitle(thread);
                    }}
                    className="text-green-500"
                  >
                    <Check size={16} />
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(thread, title);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500"
                  >
                    <Pencil size={16} />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(thread);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t text-xs text-gray-400 text-center">
        SITE-BOT v1.1
      </div>
    </div>
  );
}
