"use client"

import { Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CircleAlert,
  Clock3,
  Copy,
  Download,
  FileText,
  MessageSquare,
  Mic,
  Paperclip,
  Pause,
  Pencil,
  Play,
  Reply,
  Search,
  Send,
  Square,
  Volume2,
  X,
} from "lucide-react"
import { Header } from "@/components/header"
import { Protected } from "@/components/protected"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { apiUrl } from "@/lib/api"
import { useAppAlert } from "@/components/app-alert-provider"
import { UserAvatar } from "@/components/user-avatar"

interface ConversationSummary {
  id: string
  profileId: string
  name: string
  avatar?: string | null
  role: string
  university: string
  isOnline?: boolean
  lastMessage: string
  lastMessageKind?: string
  timestamp: string
  lastSenderUserId: number | null
  unreadCount: number
}

interface MessageAttachment {
  id: string
  kind: "image" | "audio" | "voice" | "file"
  url: string
  fileName: string
  mimeType: string
  fileSize: number
  durationSec?: number | null
}

interface MessageReplyPreview {
  id: string
  senderUserId: number
  text: string
  kind: string
  attachments: MessageAttachment[]
}

interface ChatMessage {
  id: string
  senderUserId: number
  text: string
  kind: string
  createdAt: string
  editedAt?: string | null
  isEdited?: boolean
  status?: "sending" | "failed" | "delivered" | "read" | null
  attachments: MessageAttachment[]
  replyTo?: MessageReplyPreview | null
  optimistic?: boolean
}

interface ConversationResponse {
  conversationId: string | null
  participant: {
    profileId: string
    name: string
    avatar?: string | null
    role: string
    university: string
    isOnline?: boolean
  }
  messages: ChatMessage[]
}

interface ComposerFile {
  id: string
  file: File
  previewUrl?: string
}

function formatConversationTime(timestamp: string) {
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

function formatMessageTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`
  }

  return `${size} B`
}

function formatDuration(totalSeconds?: number | null) {
  if (!totalSeconds) return "00:00"

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function getConversationPreview(conversation: ConversationSummary) {
  if (conversation.lastMessage) {
    return conversation.lastMessage
  }

  if (conversation.lastMessageKind === "voice") {
    return "Голосовое сообщение"
  }

  if (conversation.lastMessageKind === "files" || conversation.lastMessageKind === "mixed") {
    return "Вложение"
  }

  return "Пока без сообщений"
}

function getReplySnippet(reply?: MessageReplyPreview | null) {
  if (!reply) return ""
  if (reply.text) return reply.text
  if (reply.attachments[0]?.kind === "voice") return "Голосовое сообщение"
  if (reply.attachments[0]?.kind === "image") return "Изображение"
  if (reply.attachments.length > 0) return reply.attachments[0].fileName
  return "Сообщение"
}

function StatusIcon({ status }: { status?: ChatMessage["status"] }) {
  if (status === "sending") {
    return <Clock3 className="h-3.5 w-3.5" />
  }

  if (status === "failed") {
    return <CircleAlert className="h-3.5 w-3.5 text-destructive" />
  }

  if (status === "read") {
    return <CheckCheck className="h-3.5 w-3.5" />
  }

  if (status === "delivered") {
    return <Check className="h-3.5 w-3.5" />
  }

  return null
}

function VoiceMessagePlayer({
  attachment,
  isOwnMessage,
}: {
  attachment: MessageAttachment
  isOwnMessage: boolean
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(attachment.durationSec || 0)
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  const bars = [32, 58, 44, 76, 50, 88, 36, 64, 46, 72, 54, 82, 42, 68, 48, 78, 38, 60]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoaded = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration))
      }
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoaded)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoaded)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio || !attachment.url) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    try {
      await audio.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }

  return (
    <div
      className={cn(
        "min-w-[250px] rounded-2xl px-1 py-1 sm:min-w-[310px]",
        isOwnMessage
          ? "bg-transparent"
          : "bg-transparent",
      )}
    >
      <audio ref={audioRef} src={attachment.url} preload="metadata" />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant={isOwnMessage ? "secondary" : "default"}
          className="h-11 w-11 shrink-0 rounded-full"
          onClick={togglePlayback}
          disabled={!attachment.url}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
        </Button>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Mic className="h-3.5 w-3.5" />
              Голосовое сообщение
            </span>
            <span className="tabular-nums opacity-80">
              {formatDuration(Math.round(currentTime) || duration)}
            </span>
          </div>

          <div className="relative h-9 overflow-hidden rounded-full">
            <div className="absolute inset-0 flex items-center gap-1">
              {bars.map((height, index) => (
                <span
                  key={index}
                  className={cn(
                    "w-1.5 rounded-full transition-colors",
                    isOwnMessage ? "bg-primary-foreground/35" : "bg-muted-foreground/30",
                  )}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div
              className="absolute inset-y-0 left-0 overflow-hidden transition-[width]"
              style={{ width: `${progress}%` }}
            >
              <div className="flex h-full items-center gap-1">
                {bars.map((height, index) => (
                  <span
                    key={index}
                    className={cn(
                      "w-1.5 shrink-0 rounded-full",
                      isOwnMessage ? "bg-primary-foreground" : "bg-primary",
                    )}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <Volume2 className="h-4 w-4 shrink-0 opacity-70" />
      </div>
    </div>
  )
}

function MessagesPageContent() {
  const { user } = useAuth()
  const { showAlert } = useAppAlert()
  const searchParams = useSearchParams()
  const requestedProfileId = searchParams.get("profileId")

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null)
  const [messagesList, setMessagesList] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [search, setSearch] = useState("")
  const [showConversations, setShowConversations] = useState(true)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [composerFiles, setComposerFiles] = useState<ComposerFile[]>([])
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null)
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingMs, setRecordingMs] = useState(0)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingStartedAtRef = useRef<number | null>(null)
  const recordingIntervalRef = useRef<number | null>(null)
  const selectedProfileIdRef = useRef<string | null>(null)

  const deferredSearch = useDeferredValue(search)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const filteredConversations = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    if (!query) return conversations

    return conversations.filter((conversation) => {
      return (
        conversation.name.toLowerCase().includes(query) ||
        conversation.university.toLowerCase().includes(query) ||
        getConversationPreview(conversation).toLowerCase().includes(query)
      )
    })
  }, [conversations, deferredSearch])

  useEffect(() => {
    selectedProfileIdRef.current = selectedConversation?.profileId || null
  }, [selectedConversation?.profileId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messagesList])

  useEffect(() => {
    return () => {
      setComposerFiles((current) => {
        current.forEach((item) => {
          if (item.previewUrl) {
            URL.revokeObjectURL(item.previewUrl)
          }
        })
        return current
      })
    }
  }, [])

  const loadConversations = async () => {
    if (!token) return []

    const res = await fetch(apiUrl("/messages/conversations"), {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      throw new Error("Failed to load conversations")
    }

    const data = (await res.json()) as ConversationSummary[]
    setConversations(data)

    if (selectedProfileIdRef.current) {
      const freshSelected = data.find((conversation) => conversation.profileId === selectedProfileIdRef.current)
      if (freshSelected) {
        setSelectedConversation(freshSelected)
      }
    }

    return data
  }

  const loadConversation = async (profileId: string) => {
    if (!token) return null

    const res = await fetch(apiUrl(`/messages/${profileId}`), {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      throw new Error("Failed to load conversation")
    }

    const data = (await res.json()) as ConversationResponse
    setMessagesList(data.messages)
    selectedProfileIdRef.current = profileId
    setSelectedConversation((current) => ({
      id: data.conversationId || current?.id || `draft_${profileId}`,
      profileId: data.participant.profileId,
      name: data.participant.name,
      avatar: data.participant.avatar,
      role: data.participant.role,
      university: data.participant.university,
      isOnline: data.participant.isOnline,
      lastMessage: data.messages[data.messages.length - 1]?.text || current?.lastMessage || "",
      lastMessageKind: data.messages[data.messages.length - 1]?.kind || current?.lastMessageKind || "text",
      timestamp: data.messages[data.messages.length - 1]?.createdAt || current?.timestamp || new Date().toISOString(),
      lastSenderUserId: data.messages[data.messages.length - 1]?.senderUserId || current?.lastSenderUserId || null,
      unreadCount: 0,
    }))

    setConversations((current) => {
      const existing = current.find((conversation) => conversation.profileId === profileId)

      if (existing) {
        return current.map((conversation) =>
          conversation.profileId === profileId
            ? {
                ...conversation,
                unreadCount: 0,
                lastMessage: data.messages[data.messages.length - 1]?.text || conversation.lastMessage,
                lastMessageKind: data.messages[data.messages.length - 1]?.kind || conversation.lastMessageKind,
                timestamp: data.messages[data.messages.length - 1]?.createdAt || conversation.timestamp,
                lastSenderUserId: data.messages[data.messages.length - 1]?.senderUserId || conversation.lastSenderUserId,
              }
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
          isOnline: data.participant.isOnline,
          lastMessage: "",
          lastMessageKind: "text",
          timestamp: new Date().toISOString(),
          lastSenderUserId: null,
          unreadCount: 0,
        },
        ...current,
      ]
    })

    return data
  }

  useEffect(() => {
    if (!token) return

    let isMounted = true

    const bootstrap = async () => {
      try {
        const conversationList = await loadConversations()
        const initialProfileId =
          requestedProfileId ||
          selectedProfileIdRef.current ||
          conversationList[0]?.profileId

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
  }, [requestedProfileId, token])

  useEffect(() => {
    if (!token) return

    const stream = new EventSource(`${apiUrl("/messages/stream")}?token=${encodeURIComponent(token)}`)

    stream.onmessage = () => {
      void loadConversations()
      if (selectedProfileIdRef.current) {
        void loadConversation(selectedProfileIdRef.current)
      }
    }

    stream.onerror = () => {
      stream.close()
    }

    return () => {
      stream.close()
    }
  }, [token])

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const clearComposerFiles = () => {
    setComposerFiles((current) => {
      current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl)
        }
      })
      return []
    })
  }

  const resetComposer = () => {
    setDraft("")
    setReplyTarget(null)
    setEditingMessage(null)
    clearComposerFiles()
  }

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setComposerFiles((current) => {
      if (current.length + files.length > 10) {
        showAlert("Слишком много файлов", "За одно сообщение можно отправить не больше 10 файлов.")
        return current
      }

      const next = files.map((file) => ({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      }))

      return [...current, ...next]
    })

    event.target.value = ""
  }

  const removeComposerFile = (id: string) => {
    setComposerFiles((current) =>
      current.filter((item) => {
        if (item.id === id && item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl)
        }
        return item.id !== id
      }),
    )
  }

  const startRecording = async () => {
    if (isRecording) return

    if (!navigator.mediaDevices?.getUserMedia) {
      showAlert("Запись недоступна", "Браузер не поддерживает запись голосовых сообщений.")
      return
    }

    try {
      clearComposerFiles()

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      mediaRecorderRef.current = recorder
      recordingStartedAtRef.current = Date.now()
      setRecordingMs(0)
      setIsRecording(true)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const durationMs = Math.max(0, Date.now() - (recordingStartedAtRef.current || Date.now()))
        stream.getTracks().forEach((track) => track.stop())

        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" })
        if (blob.size === 0) {
          return
        }

        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: blob.type || "audio/webm",
        })

        setComposerFiles([
          {
            id: `voice-${Date.now()}`,
            file,
          },
        ])
        setRecordingMs(durationMs)
        setIsRecording(false)
      }

      recorder.start()

      recordingIntervalRef.current = window.setInterval(() => {
        const startedAt = recordingStartedAtRef.current || Date.now()
        const nextDuration = Date.now() - startedAt
        setRecordingMs(nextDuration)

        if (nextDuration >= 5 * 60 * 1000) {
          recorder.stop()
          if (recordingIntervalRef.current) {
            window.clearInterval(recordingIntervalRef.current)
          }
        }
      }, 250)
    } catch (error) {
      console.error(error)
      showAlert("Нет доступа к микрофону", "Разреши доступ к микрофону в браузере и попробуй снова.")
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }

    mediaRecorderRef.current?.stop()
  }

  const sendMessage = async () => {
    if (!selectedConversation || !token || sending) return

    const trimmedDraft = draft.trim()
    const hasVoice = composerFiles.length === 1 && composerFiles[0].file.type.startsWith("audio/")

    if (!trimmedDraft && composerFiles.length === 0 && !editingMessage) {
      return
    }

    if (editingMessage) {
      setSending(true)
      try {
        const res = await fetch(apiUrl(`/messages/message/${editingMessage.id}`), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: trimmedDraft }),
        })

        const data = await res.json()
        if (!res.ok) {
          showAlert("Не удалось изменить сообщение", data.message || "Попробуй еще раз.")
          return
        }

        setMessagesList((current) => current.map((message) => (message.id === data.id ? data : message)))
        resetComposer()
      } catch (error) {
        console.error(error)
        showAlert("Ошибка", "Не получилось отредактировать сообщение.")
      } finally {
        setSending(false)
      }
      return
    }

    const optimisticId = `temp-${crypto.randomUUID()}`
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      senderUserId: Number(user?.id),
      text: trimmedDraft,
      kind: hasVoice ? "voice" : composerFiles.length > 0 ? (trimmedDraft ? "mixed" : "files") : "text",
      createdAt: new Date().toISOString(),
      status: "sending",
      attachments: composerFiles.map((item) => ({
        id: item.id,
        kind: item.file.type.startsWith("image/") ? "image" : item.file.type.startsWith("audio/") ? (hasVoice ? "voice" : "audio") : "file",
        url: item.previewUrl || "",
        fileName: item.file.name,
        mimeType: item.file.type,
        fileSize: item.file.size,
        durationSec: hasVoice ? Math.round(recordingMs / 1000) : null,
      })),
      replyTo: replyTarget
        ? {
            id: replyTarget.id,
            senderUserId: replyTarget.senderUserId,
            text: replyTarget.text,
            kind: replyTarget.kind,
            attachments: replyTarget.attachments,
          }
        : null,
      optimistic: true,
    }

    setMessagesList((current) => [...current, optimisticMessage])
    setSending(true)

    try {
      const formData = new FormData()
      formData.append("text", trimmedDraft)

      if (replyTarget) {
        formData.append("replyToMessageId", replyTarget.id)
      }

      if (hasVoice) {
        formData.append("isVoiceNote", "true")
        formData.append("voiceDurationSec", String(Math.round(recordingMs / 1000)))
      }

      composerFiles.forEach((item) => {
        formData.append("files", item.file)
      })

      const res = await fetch(apiUrl(`/messages/${selectedConversation.profileId}`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setMessagesList((current) =>
          current.map((message) =>
            message.id === optimisticId
              ? {
                  ...message,
                  status: "failed",
                }
              : message,
          ),
        )
        showAlert("Не удалось отправить сообщение", data.message || "Попробуй еще раз немного позже.")
        return
      }

      setMessagesList((current) => current.map((message) => (message.id === optimisticId ? data : message)))
      resetComposer()
      await loadConversations()
    } catch (error) {
      console.error(error)
      setMessagesList((current) =>
        current.map((message) =>
          message.id === optimisticId
            ? {
                ...message,
                status: "failed",
              }
            : message,
        ),
      )
      showAlert("Ошибка отправки", "Сообщение не отправилось. Попробуй еще раз.")
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  const selectedConversationLabel = useMemo(() => {
    if (!selectedConversation) return null
    return `${selectedConversation.role === "tutor" ? "Стутьютор" : "Студент"} • ${selectedConversation.university}`
  }, [selectedConversation])

  const canSend = draft.trim().length > 0 || composerFiles.length > 0 || Boolean(editingMessage)

  return (
    <Protected>
      <div className="h-[100dvh] overflow-hidden bg-background">
        <Header />

        <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
          <DialogContent className="max-w-5xl border-border/60 bg-background/95 p-2 sm:p-3">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Предпросмотр вложения"
                className="max-h-[85vh] w-full rounded-2xl object-contain"
              />
            ) : null}
          </DialogContent>
        </Dialog>

        <div className="mt-16 h-[calc(100dvh-4rem)] overflow-hidden px-3 py-3 sm:px-4 sm:py-4">
          <div className="mx-auto flex h-full max-w-[1600px] gap-3 overflow-hidden lg:gap-4">
            <aside
              className={cn(
                "min-h-0 w-full shrink-0 overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 shadow-sm backdrop-blur md:w-[23rem] lg:w-[26rem]",
                showConversations ? "flex" : "hidden md:flex",
                "flex-col",
              )}
            >
              <div className="border-b border-border/60 px-4 pb-4 pt-5 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Мессенджер
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold text-foreground">Чаты</h1>
                  </div>
                  <div className="rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
                    {conversations.length}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border/60 bg-background/70 px-3">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Поиск по чатам"
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1">
                <ScrollArea className="h-full">
                  <div className="space-y-2.5 p-3 sm:p-4">
                    {!loading && filteredConversations.length === 0 ? (
                      <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-background/55 px-5 py-8 text-center text-sm text-muted-foreground">
                        {conversations.length === 0
                          ? "Пока нет диалогов. Открой профиль стутьютора и начни переписку."
                          : "По этому запросу ничего не найдено."}
                      </div>
                    ) : null}

                    {filteredConversations.map((conversation) => {
                      const isSelected = selectedConversation?.profileId === conversation.profileId

                      return (
                        <button
                          key={conversation.profileId}
                          className={cn(
                            "group flex w-full min-w-0 items-start gap-3 overflow-hidden rounded-[1.6rem] border px-3.5 py-3 text-left transition-all",
                            isSelected
                              ? "border-primary/30 bg-secondary/55 shadow-sm"
                              : "border-border/60 bg-background/65 hover:border-primary/20 hover:bg-secondary/35",
                          )}
                          onClick={() => {
                            if (conversation.profileId !== selectedConversation?.profileId) {
                              void loadConversation(conversation.profileId)
                            }
                            if (window.innerWidth < 768) {
                              setShowConversations(false)
                            }
                          }}
                        >
                          <UserAvatar
                            src={conversation.avatar}
                            name={conversation.name}
                            isOnline={conversation.isOnline}
                            className="h-14 w-14"
                            indicatorClassName="h-3.5 w-3.5 border-[3px] border-card"
                          />

                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <p className="truncate font-medium text-foreground">{conversation.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{conversation.university}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-[11px] text-muted-foreground">{formatConversationTime(conversation.timestamp)}</p>
                                {conversation.unreadCount > 0 ? (
                                  <span className="mt-1 inline-flex min-w-5 justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                                    {conversation.unreadCount}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="mt-2 flex min-w-0 items-center gap-2 overflow-hidden">
                              {conversation.isOnline ? (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                              ) : (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/30" />
                              )}
                              <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                                {getConversationPreview(conversation)}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </aside>

            <section
              className={cn(
                "min-h-0 min-w-0 flex-1 overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 shadow-sm backdrop-blur",
                showConversations ? "hidden md:flex" : "flex",
                "flex-col",
              )}
            >
              {!selectedConversation ? (
                <div className="flex flex-1 items-center justify-center px-6">
                  <div className="max-w-md text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/60">
                      <MessageSquare className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <h2 className="mt-5 text-2xl font-semibold text-foreground">Диалог не выбран</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Выбери чат слева или начни переписку со страницы профиля. Новый интерфейс уже готов для личных диалогов без каналов, групп и лишних сущностей.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="border-b border-border/60 bg-background/55 px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setShowConversations(true)}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>

                      <UserAvatar
                        src={selectedConversation.avatar}
                        name={selectedConversation.name}
                        isOnline={selectedConversation.isOnline}
                        className="h-12 w-12"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold text-foreground">
                          {selectedConversation.name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {selectedConversationLabel}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {selectedConversation.isOnline
                            ? "В сети"
                            : `Последняя активность: ${formatConversationTime(selectedConversation.timestamp)}`}
                        </p>
                      </div>

                      {selectedConversation.role === "tutor" ? (
                        <Link href={`/profile/${selectedConversation.profileId}`}>
                          <Button variant="outline" className="rounded-full border-border/70">
                            Профиль
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.03),transparent_40%)]">
                    <ScrollArea className="h-full">
                      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:px-5">
                        {messagesList.length === 0 ? (
                          <div className="py-12 text-center text-sm text-muted-foreground">
                            Сообщений пока нет. Напиши первым и договорись о занятии.
                          </div>
                        ) : null}

                        {messagesList.map((message) => {
                          const isOwnMessage = message.senderUserId === Number(user?.id)

                          return (
                            <div
                              key={message.id}
                              className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}
                            >
                              <div className={cn("group flex max-w-[92%] gap-2 sm:max-w-[80%]", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="mt-1 h-8 w-8 shrink-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align={isOwnMessage ? "end" : "start"} className="rounded-2xl">
                                    <DropdownMenuItem onClick={() => setReplyTarget(message)}>
                                      <Reply className="h-4 w-4" />
                                      Ответить
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(message.text || getReplySnippet(message.replyTo))
                                          showAlert("Скопировано", "Текст сообщения скопирован в буфер обмена.")
                                        } catch (error) {
                                          console.error(error)
                                          showAlert("Ошибка", "Не удалось скопировать сообщение.")
                                        }
                                      }}
                                    >
                                      <Copy className="h-4 w-4" />
                                      Копировать
                                    </DropdownMenuItem>
                                    {isOwnMessage ? (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEditingMessage(message)
                                          setReplyTarget(null)
                                          setDraft(message.text)
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                        Изменить
                                      </DropdownMenuItem>
                                    ) : null}
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                <div
                                  className={cn(
                                    "rounded-[1.6rem] border px-4 py-3 shadow-sm",
                                    isOwnMessage
                                      ? "rounded-br-md border-primary/20 bg-primary text-primary-foreground"
                                      : "rounded-bl-md border-border/60 bg-background/90 text-foreground",
                                  )}
                                >
                                  {message.replyTo ? (
                                    <button
                                      type="button"
                                      className={cn(
                                        "mb-3 flex w-full flex-col rounded-2xl border px-3 py-2 text-left",
                                        isOwnMessage
                                          ? "border-primary-foreground/20 bg-primary-foreground/10"
                                          : "border-border/60 bg-secondary/35",
                                      )}
                                    >
                                      <span className="text-[11px] font-semibold">
                                        {message.replyTo.senderUserId === Number(user?.id) ? "Ты" : selectedConversation.name}
                                      </span>
                                      <span className="mt-1 truncate text-xs opacity-80">
                                        {getReplySnippet(message.replyTo)}
                                      </span>
                                    </button>
                                  ) : null}

                                  {message.text ? (
                                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                      {message.text}
                                    </p>
                                  ) : null}

                                  {message.attachments.length > 0 ? (
                                    <div className={cn("mt-3 space-y-3", message.text ? "pt-0" : "mt-0")}>
                                      {message.attachments
                                        .filter((attachment) => attachment.kind === "image")
                                        .map((attachment) => (
                                          <button
                                            key={attachment.id}
                                            type="button"
                                            onClick={() => setPreviewImage(attachment.url)}
                                            className="overflow-hidden rounded-2xl border border-border/40"
                                          >
                                            <img
                                              src={attachment.url}
                                              alt={attachment.fileName}
                                              className="max-h-72 w-full object-cover"
                                            />
                                          </button>
                                        ))}

                                      {message.attachments
                                        .filter((attachment) => attachment.kind === "voice" || attachment.kind === "audio")
                                        .map((attachment) => (
                                          attachment.kind === "voice" ? (
                                            <VoiceMessagePlayer
                                              key={attachment.id}
                                              attachment={attachment}
                                              isOwnMessage={isOwnMessage}
                                            />
                                          ) : (
                                          <div
                                            key={attachment.id}
                                            className={cn(
                                              "rounded-2xl border px-3 py-3",
                                              isOwnMessage
                                                ? "border-primary-foreground/20 bg-primary-foreground/10"
                                                : "border-border/60 bg-secondary/35",
                                            )}
                                          >
                                            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                                              <div className="flex items-center gap-2">
                                                <Mic className="h-4 w-4" />
                                                <span>{attachment.fileName}</span>
                                              </div>
                                              <span>{formatDuration(attachment.durationSec)}</span>
                                            </div>
                                            <audio controls src={attachment.url} className="h-10 w-full" preload="metadata" />
                                          </div>
                                          )
                                        ))}

                                      {message.attachments
                                        .filter((attachment) => attachment.kind === "file")
                                        .map((attachment) => (
                                          <a
                                            key={attachment.id}
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={cn(
                                              "flex items-center gap-3 rounded-2xl border px-3 py-3",
                                              isOwnMessage
                                                ? "border-primary-foreground/20 bg-primary-foreground/10"
                                                : "border-border/60 bg-secondary/35",
                                            )}
                                          >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background/70">
                                              <FileText className="h-4 w-4 text-foreground" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                                              <p className="text-xs opacity-75">{formatFileSize(attachment.fileSize)}</p>
                                            </div>
                                            <Download className="h-4 w-4 shrink-0" />
                                          </a>
                                        ))}
                                    </div>
                                  ) : null}

                                  <div
                                    className={cn(
                                      "mt-2 flex items-center gap-2 text-[11px]",
                                      isOwnMessage ? "justify-end text-primary-foreground/75" : "text-muted-foreground",
                                    )}
                                  >
                                    <span>{formatMessageTime(message.createdAt)}</span>
                                    {message.isEdited ? <span>изменено</span> : null}
                                    {isOwnMessage ? <StatusIcon status={message.status} /> : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}

                        <div ref={bottomRef} />
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="border-t border-border/60 bg-background/70 px-4 py-4 sm:px-5">
                    <div className="mx-auto max-w-5xl space-y-3">
                      {replyTarget ? (
                        <div className="flex items-start justify-between gap-3 rounded-[1.4rem] border border-border/60 bg-secondary/35 px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">
                              Ответ на {replyTarget.senderUserId === Number(user?.id) ? "свое сообщение" : selectedConversation.name}
                            </p>
                            <p className="mt-1 truncate text-sm text-muted-foreground">
                              {getReplySnippet(replyTarget)}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setReplyTarget(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}

                      {editingMessage ? (
                        <div className="flex items-start justify-between gap-3 rounded-[1.4rem] border border-border/60 bg-secondary/35 px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">Редактирование сообщения</p>
                            <p className="mt-1 truncate text-sm text-muted-foreground">
                              Изменения увидит собеседник сразу после сохранения.
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => {
                            setEditingMessage(null)
                            setDraft("")
                          }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}

                      {composerFiles.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {composerFiles.map((item) => (
                            <div
                              key={item.id}
                              className="flex max-w-full items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-2"
                            >
                              {item.previewUrl ? (
                                <img src={item.previewUrl} alt={item.file.name} className="h-10 w-10 rounded-xl object-cover" />
                              ) : item.file.type.startsWith("audio/") ? (
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/45">
                                  <Mic className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/45">
                                  <FileText className="h-4 w-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => removeComposerFile(item.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFilesSelected}
                      />

                      <div className="flex items-end gap-3 rounded-[1.8rem] border border-border/70 bg-card p-3 shadow-sm">
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 rounded-full"
                            onClick={openFilePicker}
                            disabled={isRecording}
                          >
                            <Paperclip className="h-5 w-5" />
                          </Button>

                          <Button
                            type="button"
                            variant={isRecording ? "default" : "ghost"}
                            size="icon"
                            className="h-11 w-11 rounded-full"
                            onClick={() => {
                              if (isRecording) {
                                stopRecording()
                              } else {
                                void startRecording()
                              }
                            }}
                            disabled={Boolean(editingMessage)}
                          >
                            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
                          </Button>
                        </div>

                        <div className="flex-1">
                          {isRecording ? (
                            <div className="flex min-h-14 items-center justify-between rounded-[1.2rem] border border-primary/20 bg-primary/5 px-4">
                              <div className="flex items-center gap-3">
                                <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                                <span className="text-sm font-medium text-foreground">Идет запись голосового</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatDuration(Math.round(recordingMs / 1000))}
                              </span>
                            </div>
                          ) : (
                            <Textarea
                              placeholder={editingMessage ? "Измени сообщение..." : "Введите сообщение..."}
                              value={draft}
                              onChange={(event) => setDraft(event.target.value)}
                              onKeyDown={handleKeyDown}
                              rows={1}
                              maxLength={2000}
                              className="min-h-14 max-h-48 resize-none rounded-[1.2rem] border-border/60 bg-background/65 px-4 py-4 shadow-none focus-visible:ring-0"
                            />
                          )}
                        </div>

                        <Button
                          type="button"
                          className="h-12 min-w-12 rounded-full px-4"
                          onClick={() => void sendMessage()}
                          disabled={!canSend || sending || isRecording}
                        >
                          {editingMessage ? <Pencil className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                          <span className="sr-only">Отправить сообщение</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
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
