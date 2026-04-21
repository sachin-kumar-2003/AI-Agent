import { useEffect, useState } from "react";
import { Plus, Trash2, MessageSquare, Pencil, Check } from "lucide-react";

const TITLES_STORAGE_KEY = "sidebar-chat-titles";

export default function Sidebar({
  threads,
  setThreadId,
  createNewChat,
  deleteChat,
}) {
  const [editingId, setEditingId] = useState(null);
  const [titles, setTitles] = useState(() => {
    try {
      const saved = window.localStorage.getItem(TITLES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      window.localStorage.removeItem(TITLES_STORAGE_KEY);
      return {};
    }
  });
  const [tempTitle, setTempTitle] = useState("");

  useEffect(() => {
    window.localStorage.setItem(TITLES_STORAGE_KEY, JSON.stringify(titles));
  }, [titles]);

  const startEditing = (id, current) => {
    setEditingId(id);
    setTempTitle(current);
  };

  const saveTitle = (id) => {
    const nextTitle = tempTitle.trim();

    setTitles((prev) => {
      if (!nextTitle) {
        const nextTitles = { ...prev };
        delete nextTitles[id];
        return nextTitles;
      }
      return { ...prev, [id]: nextTitle };
    });

    setEditingId(null);
    setTempTitle("");
  };

  return (
    <aside className="flex h-full w-80 flex-col border-r border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-100 
    dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">

      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 px-5 py-5 backdrop-blur 
      dark:border-slate-700 dark:bg-slate-900/80">
        
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
              Workspace
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Chats
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Keep your conversations tidy and easy to revisit.
            </p>
          </div>

          <button
            onClick={createNewChat}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-300/60 transition hover:-translate-y-0.5 hover:bg-slate-800 
            dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            aria-label="Create new chat"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 
        dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <MessageSquare size={15} className="text-slate-400 dark:text-slate-500" />
            <span>{threads.length} conversations</span>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500 shadow-sm 
          dark:bg-slate-700 dark:text-slate-300">
            SITE-BOT
          </span>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {threads.length === 0 ? (
          <div className="mx-2 mt-8 rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center shadow-sm 
          dark:border-slate-700 dark:bg-slate-800/70">
            
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 
            dark:bg-slate-700 dark:text-slate-300">
              <MessageSquare size={22} />
            </div>

            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              No chats yet
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Start a fresh conversation and it will appear here.
            </p>

            <button
              onClick={createNewChat}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 
              dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              <Plus size={16} />
              New chat
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread, index) => {
              const title = titles[thread] || `Chat ${index + 1}`;

              return (
                <div
                  key={thread}
                  onClick={() => setThreadId(thread)}
                  className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-transparent bg-white/80 px-3 py-3 shadow-sm transition 
                  hover:border-slate-200 hover:bg-white hover:shadow-md 
                  dark:bg-slate-800/70 dark:hover:bg-slate-800 dark:hover:border-slate-600"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition 
                    group-hover:bg-slate-900 group-hover:text-white 
                    dark:bg-slate-700 dark:text-slate-300 
                    dark:group-hover:bg-white dark:group-hover:text-slate-900">
                      <MessageSquare size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      {editingId === thread ? (
                        <input
                          value={tempTitle}
                          onChange={(e) => setTempTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveTitle(thread)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition 
                          focus:border-slate-900 
                          dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:border-slate-300"
                          autoFocus
                        />
                      ) : (
                        <>
                          <p
                            className="truncate text-sm font-medium text-slate-800 dark:text-slate-100"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              startEditing(thread, title);
                            }}
                          >
                            {title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                            Double-click to rename
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {editingId === thread ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          saveTitle(thread);
                        }}
                        className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50 
                        dark:hover:bg-slate-700"
                      >
                        <Check size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(thread, title);
                        }}
                        className="rounded-lg p-2 text-slate-400 opacity-0 transition group-hover:opacity-100 
                        hover:bg-sky-50 hover:text-sky-600 
                        dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-sky-400"
                      >
                        <Pencil size={16} />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(thread);
                      }}
                      className="rounded-lg p-2 text-slate-400 opacity-0 transition group-hover:opacity-100 
                      hover:bg-rose-50 hover:text-rose-600 
                      dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-rose-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white/70 px-4 py-3 
      dark:border-slate-700 dark:bg-slate-900/70">
        <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-xs text-slate-300 
        dark:bg-slate-800 dark:text-slate-400">
          <span className="font-medium tracking-[0.2em]">SITE-BOT</span>
          <span>v1.1</span>
        </div>
      </div>
    </aside>
  );
}