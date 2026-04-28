"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, Settings, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { apiUrl } from "@/lib/api"
import { useAppAlert } from "@/components/app-alert-provider"

interface ProfileActionsProps {
  profileId: string
  ownerUserId: string
  role: "student" | "tutor"
}

export function ProfileActions({
  profileId,
  ownerUserId,
  role,
}: ProfileActionsProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { showAlert } = useAppAlert()
  const isOwnProfile = user?.id === ownerUserId
  const [sendingInterest, setSendingInterest] = useState(false)

  if (isOwnProfile) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <p className="font-medium">Это ваша анкета</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Здесь вы видите свою публичную страницу такой, какой ее видят другие студенты.
          </p>
        </div>

        <Link href="/dashboard">
          <Button className="w-full">
            <Settings className="mr-2 h-4 w-4" />
            Редактировать в кабинете
          </Button>
        </Link>
      </div>
    )
  }

  const handleInterest = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    setSendingInterest(true)

    try {
      const endpoint = role === "tutor" && user.role === "student"
        ? `/messages/${profileId}/interest`
        : `/messages/${profileId}`

      const body =
        role === "tutor" && user.role === "student"
          ? undefined
          : JSON.stringify({ text: "Здравствуйте! Хочу обсудить детали занятия." })

      const res = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        showAlert("Не удалось начать диалог", data?.message || "Попробуй еще раз немного позже.")
        return
      }

      router.push(`/messages?profileId=${profileId}`)
    } catch (error) {
      console.error(error)
      showAlert("Ошибка сервера", "Сейчас не удалось создать диалог. Попробуй позже.")
    } finally {
      setSendingInterest(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button size="lg" className="w-full" onClick={handleInterest} disabled={sendingInterest}>
        <MessageSquare className="h-4 w-4 mr-2" />
        {role === "tutor" && user?.role === "student" ? "Откликнуться" : "Написать"}
      </Button>
    </div>
  )
}
