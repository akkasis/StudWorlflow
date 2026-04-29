"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Send, LifeBuoy } from "lucide-react"
import { Header } from "@/components/header"
import { Protected } from "@/components/protected"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { apiUrl } from "@/lib/api"

interface SupportThreadSummary {
  userId: string
  name: string
  email: string
  lastMessage: string
  updatedAt: string
  lastSenderUserId?: number | null
}

interface SupportMessage {
  id: string
  senderUserId: number
  text: string
  createdAt: string
}

function SupportPageContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const requestedThreadId = searchParams.get("threadId")
  const [threads, setThreads] = useState<SupportThreadSummary[]>([])
  const [threadSearch, setThreadSearch] = useState("")
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [text, setText] = useState("")
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const isModerator = user?.role === "admin" || user?.role === "moderator"
  const filteredThreads = threads.filter((thread) => {
    const query = threadSearch.trim().toLowerCase()
    if (!query) return true

    return (
      thread.name.toLowerCase().includes(query) ||
      thread.email.toLowerCase().includes(query) ||
      thread.lastMessage.toLowerCase().includes(query)
    )
  })
  const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

  const markSupportSeen = (items: SupportMessage[]) => {
    if (!user || isModerator) return
    const latestMessage = items[items.length - 1]
    const seenAt = latestMessage?.createdAt || new Date().toISOString()
    localStorage.setItem(`support-last-seen-${user.id}`, seenAt)
  }

  const loadThreads = useCallback(async () => {
    if (!token) return
    const res = await fetch(apiUrl("/support/threads"), {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setThreads(data)
    setActiveThreadId((current) => {
      if (requestedThreadId && data.some((thread: SupportThreadSummary) => thread.userId === requestedThreadId)) {
        return requestedThreadId
      }

      return current || data[0]?.userId || null
    })
  }, [requestedThreadId, token])

  const loadMessages = useCallback(async (threadId?: string | null) => {
    if (!token) return
    const url = isModerator && threadId
      ? apiUrl(`/support/thread/${threadId}`)
      : apiUrl("/support/thread")
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setMessages(data.messages || [])
    if (!isModerator) {
      markSupportSeen(data.messages || [])
    }
  }, [isModerator, token, user?.id])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  useEffect(() => {
    if (!activeThreadId && isModerator) return
    void loadMessages(activeThreadId)
  }, [activeThreadId, isModerator, loadMessages])

  useEffect(() => {
    if (!token) return

    const interval = window.setInterval(() => {
      void loadThreads()
      void loadMessages(activeThreadId)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [activeThreadId, loadMessages, loadThreads, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  const sendMessage = async () => {
    if (!token || !text.trim()) return

    const url = isModerator && activeThreadId
      ? apiUrl(`/support/${activeThreadId}/reply`)
      : apiUrl("/support")

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    })

    setText("")
    await loadThreads()
    await loadMessages(activeThreadId)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <Protected>
      <div className="h-[100dvh] overflow-hidden bg-background">
        <Header />
        <div className="mt-16 h-[calc(100dvh-4rem)] flex min-h-0">
          {isModerator && (
            <aside className="hidden md:flex md:w-80 border-r border-border bg-card flex-col min-h-0">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold">Поддержка</h2>
                <p className="text-sm text-muted-foreground">Все обращения пользователей</p>
                <Input
                  value={threadSearch}
                  onChange={(event) => setThreadSearch(event.target.value)}
                  placeholder="Поиск по имени"
                  className="mt-4 h-10"
                />
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="divide-y divide-border">
                  {filteredThreads.map((thread) => (
                    <button
                      key={thread.userId}
                      className={cn(
                        "w-full text-left p-4 hover:bg-secondary/60",
                        activeThreadId === thread.userId && "bg-secondary",
                      )}
                      onClick={() => setActiveThreadId(thread.userId)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{thread.name}</p>
                        <span className="text-[11px] text-muted-foreground">
                          {formatTime(thread.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{thread.lastMessage || thread.email}</p>
                    </button>
                  ))}
                  {filteredThreads.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      По этому запросу ничего не найдено.
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </aside>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            <div className="border-b border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <LifeBuoy className="h-5 w-5 text-primary" />
                <div>
                  <h1 className="font-semibold">
                    {isModerator ? "Чат поддержки" : "Связь с поддержкой"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isModerator
                      ? "Отвечайте на обращения пользователей"
                      : "Опишите проблему, и модераторы вам ответят"}
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    Пока нет сообщений. Начните диалог с поддержкой.
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.senderUserId === Number(user?.id) ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3",
                        message.senderUserId === Number(user?.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border",
                      )}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          message.senderUserId === Number(user?.id)
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-border bg-card p-4">
              <div className="max-w-3xl mx-auto flex gap-3">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Напишите сообщение поддержке..."
                />
                <Button onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Protected>
  )
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <Protected>
          <div className="h-[100dvh] overflow-hidden bg-background">
            <Header />
            <div className="mt-16 flex h-[calc(100dvh-4rem)] items-center justify-center text-muted-foreground">
              Загрузка поддержки...
            </div>
          </div>
        </Protected>
      }
    >
      <SupportPageContent />
    </Suspense>
  )
}
