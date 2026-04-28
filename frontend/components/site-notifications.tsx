"use client"

import { useEffect, useMemo, useRef } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { apiUrl } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

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

    const notify = (title: string, description: string) => {
      toast({
        title,
        description,
      })
      playSound()
    }

    const poll = async () => {
      try {
        const conversationRes = await fetch(apiUrl("/messages/conversations"), {
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
              notify(
                `Новое сообщение от ${conversation.name}`,
                conversation.lastMessage || "Открой чат, чтобы посмотреть сообщение.",
              )
            }
          })

          conversationsRef.current = nextConversationState
        }

        if (user.role === "admin" || user.role === "moderator") {
          const supportRes = await fetch(apiUrl("/support/threads"), {
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
                notify(
                  `Новое обращение: ${newestThread.name}`,
                  newestThread.lastMessage || "Пользователь написал в поддержку.",
                )
              }

              supportRef.current = newestThread.updatedAt
            }
          }
        } else {
          const supportRes = await fetch(apiUrl("/support/thread"), {
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
                notify(
                  "Новое сообщение от поддержки",
                  lastMessage.text || "Поддержка ответила в чате.",
                )
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
