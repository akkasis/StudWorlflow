"use client"

import { useEffect, useMemo, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LifeBuoy, MessageSquareMore } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { apiUrl } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

interface ConversationSummary {
  profileId: string
  name: string
  lastMessage: string
  timestamp: string
  lastSenderUserId: number | null
  unreadCount: number
}

interface SupportThreadSummary {
  userId: string
  name: string
  lastMessage: string
  updatedAt: string
  lastSenderUserId: number | null
}

interface SupportThreadResponse {
  userId: string
  messages: Array<{
    id: string
    senderUserId: number
    text: string
    createdAt: string
  }>
}

function useSoftNotificationSound() {
  const contextRef = useRef<AudioContext | null>(null)

  return useMemo(
    () => () => {
      try {
        const AudioContextClass =
          window.AudioContext ||
          // @ts-expect-error webkit fallback for Safari
          window.webkitAudioContext

        if (!AudioContextClass) return

        if (!contextRef.current) {
          contextRef.current = new AudioContextClass()
        }

        const context = contextRef.current
        const oscillator = context.createOscillator()
        const gainNode = context.createGain()

        oscillator.type = "sine"
        oscillator.frequency.value = 784
        gainNode.gain.value = 0.0001

        oscillator.connect(gainNode)
        gainNode.connect(context.destination)

        const now = context.currentTime
        gainNode.gain.exponentialRampToValueAtTime(0.018, now + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.24)

        oscillator.start(now)
        oscillator.stop(now + 0.25)
      } catch (error) {
        console.error(error)
      }
    },
    [],
  )
}

export function SiteNotifications() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const playSound = useSoftNotificationSound()
  const initializedRef = useRef(false)
  const conversationsRef = useRef<Record<string, string>>({})
  const supportRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user) {
      initializedRef.current = false
      conversationsRef.current = {}
      supportRef.current = null
      return
    }

    const token = localStorage.getItem("token")
    if (!token) return

    const notify = ({
      title,
      description,
      href,
      actionLabel,
      icon,
    }: {
      title: string
      description: string
      href: string
      actionLabel: string
      icon: "message" | "support"
    }) => {
      toast({
        title,
        description,
        onClick: () => {
          router.push(href)
        },
        className: "cursor-pointer",
        action: (
          <ToastAction
            altText={actionLabel}
            onClick={(event) => {
              event.stopPropagation()
              router.push(href)
            }}
            className="rounded-xl border-border/70 bg-primary/10 px-3 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            {icon === "message" ? (
              <MessageSquareMore className="mr-2 h-4 w-4" />
            ) : (
              <LifeBuoy className="mr-2 h-4 w-4" />
            )}
            {actionLabel}
          </ToastAction>
        ),
      })
      playSound()
    }

    const poll = async () => {
      try {
        const conversationRes = await fetch(apiUrl("/messages/conversations"), {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (conversationRes.ok) {
          const conversations: ConversationSummary[] = await conversationRes.json()
          const nextConversationState: Record<string, string> = {}

          conversations.forEach((conversation) => {
            nextConversationState[conversation.profileId] = conversation.timestamp

            if (!initializedRef.current) {
              return
            }

            const previousTimestamp = conversationsRef.current[conversation.profileId]
            const isNewIncoming =
              previousTimestamp &&
              previousTimestamp !== conversation.timestamp &&
              conversation.lastSenderUserId !== Number(user.id) &&
              conversation.unreadCount > 0

            if (isNewIncoming) {
              notify({
                title: `Новое сообщение от ${conversation.name}`,
                description:
                  conversation.lastMessage || "Открой чат, чтобы посмотреть сообщение.",
                href: `/messages?profileId=${conversation.profileId}`,
                actionLabel: "Открыть чат",
                icon: "message",
              })
            }
          })

          conversationsRef.current = nextConversationState
        }

        if (user.role === "admin" || user.role === "moderator") {
          const supportRes = await fetch(apiUrl("/support/threads"), {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (supportRes.ok) {
            const threads: SupportThreadSummary[] = await supportRes.json()
            const newestThread = threads[0]

            if (newestThread) {
              if (
                initializedRef.current &&
                supportRef.current &&
                supportRef.current !== newestThread.updatedAt &&
                newestThread.lastSenderUserId !== Number(user.id) &&
                pathname !== "/support"
              ) {
                notify({
                  title: `Новое обращение: ${newestThread.name}`,
                  description:
                    newestThread.lastMessage || "Пользователь написал в поддержку.",
                  href: `/support?threadId=${newestThread.userId}`,
                  actionLabel: "Открыть тред",
                  icon: "support",
                })
              }

              supportRef.current = newestThread.updatedAt
            }
          }
        } else {
          const supportRes = await fetch(apiUrl("/support/thread"), {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (supportRes.ok) {
            const thread: SupportThreadResponse = await supportRes.json()
            const lastMessage = thread.messages[thread.messages.length - 1]

            if (lastMessage) {
              if (
                initializedRef.current &&
                supportRef.current &&
                supportRef.current !== lastMessage.createdAt &&
                lastMessage.senderUserId !== Number(user.id) &&
                pathname !== "/support"
              ) {
                notify({
                  title: "Новое сообщение от поддержки",
                  description: lastMessage.text || "Поддержка ответила в чате.",
                  href: "/support",
                  actionLabel: "Открыть чат",
                  icon: "support",
                })
              }

              supportRef.current = lastMessage.createdAt
            }
          }
        }

        initializedRef.current = true
      } catch (error) {
        console.error(error)
      }
    }

    void poll()
    const interval = window.setInterval(() => {
      void poll()
    }, 5000)

    return () => window.clearInterval(interval)
  }, [pathname, playSound, user])

  return null
}
