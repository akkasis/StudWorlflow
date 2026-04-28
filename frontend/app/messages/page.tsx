"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Send, ArrowLeft, MoreVertical, MessageSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Header } from "@/components/header"
import { Protected } from "@/components/protected"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { apiUrl } from "@/lib/api"
import { useAppAlert } from "@/components/app-alert-provider"

interface ConversationSummary {
  id: string
  profileId: string
  name: string
  avatar?: string | null
  role: string
  university: string
  lastMessage: string
  timestamp: string
  lastSenderUserId: number | null
  unreadCount: number
}

interface ChatMessage {
  id: string
  senderUserId: number
  text: string
  createdAt: string
}

interface ConversationResponse {
  conversationId: string | null
  participant: {
    profileId: string
    name: string
    avatar?: string | null
    role: string
    university: string
  }
  messages: ChatMessage[]
}

function MessagesPageContent() {
  const { user } = useAuth()
  const { showAlert } = useAppAlert()
  const searchParams = useSearchParams()
  const requestedProfileId = searchParams.get("profileId")

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null)
  const [messagesList, setMessagesList] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [showConversations, setShowConversations] = useState(true)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const formatConversationTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  const loadConversations = useCallback(async () => {
    if (!token) return []

    const res = await fetch(apiUrl("/messages/conversations"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      throw new Error("Failed to load conversations")
    }

    const data = await res.json()
    setConversations(data)
    if (selectedConversation) {
      const freshSelected = data.find(
        (conversation: ConversationSummary) =>
          conversation.profileId === selectedConversation.profileId,
      )

      if (freshSelected) {
        setSelectedConversation((current) =>
          current
            ? {
                ...current,
                ...freshSelected,
                unreadCount: 0,
              }
            : current,
        )
      }
    }
    return data as ConversationSummary[]
  }, [selectedConversation, token])

  const loadConversation = useCallback(async (profileId: string) => {
    if (!token) return null

    const res = await fetch(apiUrl(`/messages/${profileId}`), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      throw new Error("Failed to load conversation")
    }

    const data: ConversationResponse = await res.json()
    setMessagesList(data.messages)
    setSelectedConversation((current) => {
      if (current?.profileId === profileId) {
        return {
          ...current,
          unreadCount: 0,
        }
      }

      return {
        id: data.conversationId || `draft_${profileId}`,
        profileId: data.participant.profileId,
        name: data.participant.name,
        avatar: data.participant.avatar,
        role: data.participant.role,
        university: data.participant.university,
        lastMessage: data.messages[data.messages.length - 1]?.text || "",
        timestamp: data.messages[data.messages.length - 1]?.createdAt || new Date().toISOString(),
        lastSenderUserId: data.messages[data.messages.length - 1]?.senderUserId || null,
        unreadCount: 0,
      }
    })

    setConversations((current) => {
      const existing = current.find((conversation) => conversation.profileId === profileId)

      if (existing) {
        return current.map((conversation) =>
          conversation.profileId === profileId
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        )
      }

      return [
        {
          id: data.conversationId || `draft_${profileId}`,
          profileId: data.participant.profileId,
          name: data.participant.name,
          avatar: data.participant.avatar,
          role: data.participant.role,
          university: data.participant.university,
          lastMessage: "",
          timestamp: new Date().toISOString(),
          lastSenderUserId: null,
          unreadCount: 0,
        },
        ...current,
      ]
    })

    return data
  }, [token])

  useEffect(() => {
    if (!token) return

    let isMounted = true

    const bootstrap = async () => {
      try {
        const conversationList = await loadConversations()
        const initialProfileId = requestedProfileId || conversationList[0]?.profileId

        if (initialProfileId && isMounted) {
          await loadConversation(initialProfileId)
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      isMounted = false
    }
  }, [loadConversation, loadConversations, requestedProfileId, token])

  useEffect(() => {
    if (!token || !selectedConversation) return

    const interval = window.setInterval(() => {
      void loadConversations()
      void loadConversation(selectedConversation.profileId)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [loadConversation, loadConversations, selectedConversation, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messagesList])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !token) return

    setSending(true)

    try {
      const res = await fetch(
        apiUrl(`/messages/${selectedConversation.profileId}`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: newMessage,
          }),
        },
      )

      const data = await res.json()

      if (!res.ok) {
        showAlert("Не удалось отправить сообщение", data.message || "Попробуй еще раз немного позже.")
        return
      }

      setMessagesList((current) => [...current, data])
      setNewMessage("")
      await loadConversations()
      await loadConversation(selectedConversation.profileId)
    } catch (error) {
      console.error(error)
      showAlert("Ошибка отправки", "Сообщение не отправилось. Попробуй еще раз.")
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSendMessage()
    }
  }

  const selectedConversationLabel = useMemo(() => {
    if (!selectedConversation) return null

    return `${selectedConversation.role === "tutor" ? "Тьютор" : "Студент"} • ${selectedConversation.university}`
  }, [selectedConversation])

  return (
    <Protected>
      <div className="h-[100dvh] overflow-hidden bg-background">
        <Header />

        <div className="mt-16 h-[calc(100dvh-4rem)] flex overflow-hidden min-h-0">
          <aside
            className={cn(
              "w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col min-h-0",
              "md:block",
              showConversations ? "block" : "hidden",
            )}
          >
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Сообщения</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Пиши студентам и тьюторам напрямую.
              </p>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="divide-y divide-border">
                {!loading && conversations.length === 0 && (
                  <div className="p-6 text-sm text-muted-foreground">
                    Пока нет диалогов. Открой профиль тьютора и начни переписку.
                  </div>
                )}

                {conversations.map((conversation) => (
                  <button
                    key={conversation.profileId}
                    className={cn(
                      "w-full flex items-start gap-3 p-4 text-left hover:bg-secondary/50 transition-colors",
                      selectedConversation?.profileId === conversation.profileId && "bg-secondary",
                    )}
                    onClick={() => {
                      void loadConversation(conversation.profileId)
                      setShowConversations(false)
                    }}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.avatar || undefined} alt={conversation.name} />
                        <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                      </Avatar>
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-primary rounded-full border-2 border-card text-[10px] text-primary-foreground flex items-center justify-center">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground truncate">
                          {conversation.name}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatConversationTime(conversation.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {conversation.role === "tutor" ? "Тьютор" : "Студент"} • {conversation.university}
                      </p>
                      <p className="text-sm truncate mt-1 text-muted-foreground">
                        {conversation.lastMessage || "Начни разговор первым"}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-muted-foreground">
                          Последняя активность: {formatConversationTime(conversation.timestamp)}
                        </p>
                        {conversation.unreadCount > 0 ? (
                          <span className="text-[11px] font-medium text-primary">
                            {conversation.unreadCount} непрочит.
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          <div
            className={cn(
              "flex-1 flex flex-col bg-background min-h-0",
              "md:block",
              showConversations ? "hidden md:flex" : "flex",
            )}
          >
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-sm">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-semibold">Диалог не выбран</h3>
                  <p className="mt-2 text-muted-foreground">
                    Выбери существующий чат или напиши тьютору из его профиля.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setShowConversations(true)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.avatar || undefined} alt={selectedConversation.name} />
                    <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {selectedConversation.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversationLabel}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Последняя активность: {formatConversationTime(selectedConversation.timestamp)}
                    </p>
                  </div>
                  <Link href={`/profile/${selectedConversation.profileId}`}>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                <ScrollArea className="flex-1 min-h-0 p-4">
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {messagesList.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-12">
                        Сообщений пока нет. Напиши первым и договорись о занятии.
                      </div>
                    )}

                    {messagesList.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.senderUserId === Number(user?.id)
                            ? "justify-end"
                            : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5",
                            message.senderUserId === Number(user?.id)
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-card border border-border rounded-bl-md",
                          )}
                        >
                          {message.text.startsWith("Отклик на анкету") ? (
                            <div
                              className={cn(
                                "mb-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
                                message.senderUserId === Number(user?.id)
                                  ? "bg-primary-foreground/15 text-primary-foreground"
                                  : "bg-primary/10 text-primary",
                              )}
                            >
                              Отклик
                            </div>
                          ) : null}
                          <p className="text-sm leading-relaxed">{message.text}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              message.senderUserId === Number(user?.id)
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground",
                            )}
                          >
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border bg-card">
                  <div className="flex gap-3 max-w-3xl mx-auto">
                    <Input
                      placeholder="Напиши сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="flex-1"
                    />
                    <Button onClick={() => void handleSendMessage()} disabled={!newMessage.trim() || sending}>
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Отправить сообщение</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Protected>
  )
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <Protected>
          <div className="h-[100dvh] overflow-hidden bg-background">
            <Header />
            <div className="mt-16 flex h-[calc(100dvh-4rem)] items-center justify-center text-muted-foreground">
              Загрузка сообщений...
            </div>
          </div>
        </Protected>
      }
    >
      <MessagesPageContent />
    </Suspense>
  )
}
