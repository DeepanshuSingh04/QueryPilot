import React, { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useDispatch, useSelector } from 'react-redux'
import { useChat } from '../hooks/useChat'
import { useAuth } from '../../auth/hook/useAuth'
import { setCurrentChatId, setError } from '../chat.slice'
import remarkGfm from 'remark-gfm'
import './dashboard.css'

const Mark = ({ className = '' }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
    <g stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
      <g transform="rotate(0 50 50)"><path d="M50 14 L73 60 L38 76" /></g>
      <g transform="rotate(120 50 50)"><path d="M50 14 L73 60 L38 76" strokeOpacity="0.7" /></g>
      <g transform="rotate(240 50 50)"><path d="M50 14 L73 60 L38 76" strokeOpacity="0.4" /></g>
    </g>
  </svg>
)

const SearchIcon = (props) => (
  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" {...props}>
    <circle cx="7" cy="7" r="5.2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M11 11 L14.5 14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const PlusIcon = (props) => (
  <svg viewBox="0 0 16 16" fill="none" width="13" height="13" {...props}>
    <path d="M8 2.5V13.5M2.5 8H13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

const ArrowIcon = (props) => (
  <svg viewBox="0 0 16 16" fill="none" width="13" height="13" {...props}>
    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const MenuIcon = (props) => (
  <svg viewBox="0 0 16 16" fill="none" width="16" height="16" {...props}>
    <path d="M2.5 4.5H13.5M2.5 8H13.5M2.5 11.5H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const SUGGESTIONS = [
  "Summarise this week's AI news and email it to my team",
  'Compare Zustand and Redux Toolkit for a mid-size app',
  'Find remote SDE internships and mail me the list',
  "What's changed in the latest React release?",
]

// group a flat list of chats into editorial date buckets, newest first
function groupChats(chatList) {
  const buckets = { Today: [], Yesterday: [], 'This week': [], Earlier: [] }
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  chatList
    .slice()
    .sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0))
    .forEach((c) => {
      const updated = c.lastUpdated ? new Date(c.lastUpdated) : null
      if (!updated) return buckets.Earlier.push(c)
      const diffDays = Math.floor((startOfToday - updated) / 86400000)
      if (diffDays <= 0) buckets.Today.push(c)
      else if (diffDays === 1) buckets.Yesterday.push(c)
      else if (diffDays < 7) buckets['This week'].push(c)
      else buckets.Earlier.push(c)
    })

  return Object.entries(buckets).filter(([, items]) => items.length > 0)
}

const Dashboard = () => {
  const chat = useChat()
  const auth = useAuth()
  const dispatch = useDispatch()

  const [chatInput, setChatInput] = useState('')
  const [threadSearch, setThreadSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingUserMessage, setPendingUserMessage] = useState(null)

  const chats = useSelector((state) => state.chat.chats)
  const currentChatId = useSelector((state) => state.chat.currentChatId)
  const isLoading = useSelector((state) => state.chat.isLoading)
  const error = useSelector((state) => state.chat.error)
  const user = useSelector((state) => state.auth.user)

  useEffect(() => {           // dashboard page pr phochte hi initializeSocketConnection() ise caall krdete hain or socket.io connecct hojata hain user bhi
    chat.initializeSocketConnection()
    chat.handleGetChats()
  }, [])

  const handleSubmitMessage = async (event) => {
    event.preventDefault()
    const trimmedMessage = chatInput.trim()
    if (!trimmedMessage || pendingUserMessage) return

    setChatInput('')
    setPendingUserMessage(trimmedMessage)
    try {
      await chat.handleSendMessage({ message: trimmedMessage, chatId: currentChatId })
    } finally {
      setPendingUserMessage(null)
    }
  }

  const openChat = (chatId) => {
    chat.handleOpenChat(chatId, chats)
    setSidebarOpen(false)
  }

  // existing state/logic only — this just clears the active thread so the
  // next send (in handleSendMessage) creates a fresh chat, same as it does today
  const startNewThread = () => {
    dispatch(setCurrentChatId(null))
    setChatInput('')
    setSidebarOpen(false)
  }

  const chatList = Object.values(chats)
  const filteredChats = threadSearch.trim()
    ? chatList.filter((c) => c.title?.toLowerCase().includes(threadSearch.trim().toLowerCase()))
    : chatList
  const groupedChats = useMemo(() => groupChats(filteredChats), [filteredChats, threadSearch])

  const activeMessages = chats[currentChatId]?.messages ?? []
  const activeTitle = chats[currentChatId]?.title

  return (
    <main className="qp-dash flex h-screen w-full overflow-hidden bg-[var(--bg)] text-[var(--ink)]">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`qp-dash-sidebar fixed inset-y-0 left-0 z-40 flex w-[280px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)] md:static md:z-auto md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <Mark className="h-[18px] w-[18px] text-[var(--accent)]" />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">QueryPilot</span>
        </div>

        <div className="px-4">
          <button
            type="button"
            onClick={startNewThread}
            className="qp-dash-row flex w-full items-center gap-2 border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--ink-dim)] hover:border-[var(--ink-faint)] hover:text-[var(--ink)]"
          >
            <PlusIcon />
            New thread
          </button>
        </div>

        <div className="mt-4 px-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5 text-[var(--ink-faint)] focus-within:border-[var(--ink-dim)] focus-within:text-[var(--ink-dim)]">
            <SearchIcon />
            <input
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder="Search threads"
              className="w-full bg-transparent text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
            />
          </div>
        </div>

        <div className="qp-dash-scroll mt-2 flex-1 overflow-y-auto px-4 pb-4">
          {chatList.length === 0 && (
            <p className="mt-6 text-[12.5px] leading-relaxed text-[var(--ink-faint)]">
              No threads yet. Start one below.
            </p>
          )}
          {chatList.length > 0 && filteredChats.length === 0 && (
            <p className="mt-6 text-[12.5px] leading-relaxed text-[var(--ink-faint)]">No threads match "{threadSearch}".</p>
          )}

          {groupedChats.map(([label, items]) => (
            <div key={label} className="mt-5 first:mt-4">
              <p className="qp-dash-mono mb-1.5 px-1 text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                {label}
              </p>
              <div className="space-y-0.5">
                {items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openChat(c.id)}
                    className={`qp-dash-row group relative flex w-full items-center truncate px-3 py-2 text-left text-[13px] ${
                      c.id === currentChatId
                        ? 'bg-[var(--accent-dim)] text-[var(--ink)]'
                        : 'text-[var(--ink-dim)] hover:bg-white/[0.03] hover:text-[var(--ink)]'
                    }`}
                  >
                    {c.id === currentChatId && (
                      <span className="absolute left-0 top-1/2 h-3.5 w-[2px] -translate-y-1/2 bg-[var(--accent)]" />
                    )}
                    <span className="truncate pl-1">{c.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="qp-dash-mono px-5 py-2.5 text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
          Web search + email tools active
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3.5">
          <span className="truncate text-[12.5px] text-[var(--ink-dim)]" title={user?.email}>
            {user?.username || user?.email || 'Account'}
          </span>
          <button
            type="button"
            onClick={auth.handleLogout}
            className="qp-dash-row shrink-0 border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--ink-dim)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <section className="flex h-full min-w-0 flex-1 flex-col">

        {/* Top bar */}
        <header className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3.5 md:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-[var(--ink-dim)] hover:text-[var(--ink)] md:hidden"
            aria-label="Open threads"
          >
            <MenuIcon />
          </button>
          <h1 className="truncate text-[13.5px] font-medium text-[var(--ink-dim)]">
            {activeTitle || 'New thread'}
          </h1>
          {isLoading && (
            <span className="qp-dash-live thinking ml-auto" aria-hidden="true" />
          )}
        </header>

        {/* Messages / empty state */}
        <div className="qp-dash-scroll flex-1 overflow-y-auto">
          {activeMessages.length === 0 && !pendingUserMessage ? (
            <div className="mx-auto flex h-full max-w-[640px] flex-col justify-center px-6 py-12 md:px-10">
              <p className="qp-dash-mono mb-3 text-[10.5px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                QueryPilot
              </p>
              <h2 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.01em] md:text-[36px]">
                Research anything.
              </h2>
              <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[var(--ink-dim)]">
                Search the web. Follow the evidence. Build an answer.
              </p>

              <div className="mt-9 divide-y divide-[var(--border-soft)] border-y border-[var(--border-soft)]">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setChatInput(s)}
                    className="qp-dash-row group flex w-full items-center justify-between gap-4 py-3.5 text-left text-[14px] text-[var(--ink-dim)] hover:text-[var(--ink)]"
                  >
                    <span>{s}</span>
                    <ArrowIcon className="shrink-0 -translate-x-1 text-[var(--ink-faint)] opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:text-[var(--accent)] group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-[720px] px-5 py-8 md:px-10">
              <div className="space-y-7">
                {activeMessages.map((message, i) => (
                  <div key={message.id ?? i} className={message.role === 'user' ? 'flex justify-end' : ''}>
                    {message.role === 'user' ? (
                      <div className="max-w-[80%] w-fit bg-[var(--panel)] px-4 py-2.5 text-[14.5px] leading-relaxed text-[var(--ink)]">
                        {message.content}
                      </div>
                    ) : (
                      <div>
                        <p className="qp-dash-mono mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                          Agent
                        </p>
                        <div className="text-[14.5px] leading-relaxed text-[var(--ink)]">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-3 last:mb-0 text-[var(--ink)]/90">{children}</p>,
                              ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
                              ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
                              code: ({ children }) => (
                                <code className="qp-dash-mono bg-[var(--panel)] px-1 py-0.5 text-[12.5px] text-[var(--accent)]">
                                  {children}
                                </code>
                              ),
                              pre: ({ children }) => (
                                <pre className="qp-dash-mono mb-3 overflow-x-auto border border-[var(--border)] bg-[var(--panel)] p-3 text-[12.5px]">
                                  {children}
                                </pre>
                              ),
                            }}
                            remarkPlugins={[remarkGfm]}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {pendingUserMessage && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] w-fit bg-[var(--panel)] px-4 py-2.5 text-[14.5px] leading-relaxed text-[var(--ink)] opacity-60">
                      {pendingUserMessage}
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div>
                    <p className="qp-dash-mono mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">Agent</p>
                    <div className="qp-dash-dots flex items-center gap-1 py-1">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-[var(--border)] px-4 py-4 md:px-8 md:py-5">
          {error && (
            <div className="mx-auto mb-3 flex max-w-[720px] items-start gap-2 border-l-2 border-[var(--accent)] bg-[var(--accent-dim)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--ink-dim)]">
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => dispatch(setError(null))}
                className="text-[var(--ink-faint)] hover:text-[var(--ink)]"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}
          <form onSubmit={handleSubmitMessage} className="mx-auto flex max-w-[720px] items-center gap-3">
            <div className="qp-dash-input flex flex-1 items-center border border-[var(--border)] px-4 py-3 focus-within:border-[var(--ink-dim)]">
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask something, or paste a task…"
                className="w-full bg-transparent text-[14.5px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
              />
            </div>
            <button
              type="submit"
              disabled={!chatInput.trim() || !!pendingUserMessage}
              className="qp-dash-send flex h-[46px] w-[46px] shrink-0 items-center justify-center bg-[var(--accent)] text-[var(--bg)] disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:text-[var(--ink-faint)]"
              aria-label="Send"
            >
              <ArrowIcon />
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Dashboard