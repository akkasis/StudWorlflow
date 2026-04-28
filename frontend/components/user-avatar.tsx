"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  src?: string | null
  name: string
  isOnline?: boolean
  className?: string
  fallbackClassName?: string
  indicatorClassName?: string
}

export function UserAvatar({
  src,
  name,
  isOnline = false,
  className,
  fallbackClassName,
  indicatorClassName,
}: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="relative">
      <Avatar className={className}>
        <AvatarImage src={src || undefined} alt={name} />
        <AvatarFallback className={fallbackClassName}>{initials}</AvatarFallback>
      </Avatar>
      {isOnline ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500 shadow-sm shadow-emerald-500/40",
            indicatorClassName,
          )}
          aria-label="Пользователь в сети"
          title="В сети"
        />
      ) : null}
    </div>
  )
}
