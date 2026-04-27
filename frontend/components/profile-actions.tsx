"use client"

import Link from "next/link"
import { MessageSquare, Settings, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

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
  const { user } = useAuth()
  const isOwnProfile = user?.id === ownerUserId

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

  return (
    <div className="space-y-4">
      <Link href={`/messages?profileId=${profileId}`}>
        <Button size="lg" className="w-full">
          <MessageSquare className="h-4 w-4 mr-2" />
          Написать
        </Button>
      </Link>
    </div>
  )
}
