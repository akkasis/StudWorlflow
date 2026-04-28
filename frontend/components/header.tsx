"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import {
  Menu,
  X,
  GraduationCap,
  LogOut,
  UserRound,
  MessageSquareMore,
  CircleHelp,
  Search,
  LifeBuoy,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { apiUrl } from "@/lib/api"

interface ConversationSummary {
  unreadCount: number
}

interface SupportThreadResponse {
  messages: Array<{
    id: string
    senderUserId: number
    text: string
    createdAt: string
  }>
}

const navItems = [
  { href: "/marketplace", label: "Стутьюторы", icon: Search },
  { href: "/help", label: "Помощь", icon: CircleHelp },
  { href: "/support", label: "Поддержка", icon: LifeBuoy },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout, loading } = useAuth()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [supportAttention, setSupportAttention] = useState(false)

  useEffect(() => {
    if (!user || user.role === "admin" || user.role === "moderator") {
      setSupportAttention(false)
      return
    }

    const token = localStorage.getItem("token")
    if (!token) return

    const loadSupportState = async () => {
      try {
        const res = await fetch(apiUrl("/support/thread"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) return

        const data: SupportThreadResponse = await res.json()
        const lastMessage = data.messages[data.messages.length - 1]
        const seenAt = localStorage.getItem(`support-last-seen-${user.id}`)

        if (!lastMessage) {
          setSupportAttention(false)
          return
        }

        const repliedBySupport = lastMessage.senderUserId !== Number(user.id)
        const isUnreadReply =
          !seenAt || new Date(lastMessage.createdAt).getTime() > new Date(seenAt).getTime()

        setSupportAttention(repliedBySupport && isUnreadReply && pathname !== "/support")
      } catch (error) {
        console.error(error)
      }
    }

    void loadSupportState()
    const interval = window.setInterval(() => {
      void loadSupportState()
    }, 5000)

    return () => window.clearInterval(interval)
  }, [user, pathname])

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0)
      return
    }

    const token = localStorage.getItem("token")
    if (!token) return

    const loadUnread = async () => {
      try {
        const res = await fetch(apiUrl("/messages/conversations"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) return

        const data: ConversationSummary[] = await res.json()
        setUnreadMessages(data.reduce((sum, item) => sum + item.unreadCount, 0))
      } catch (error) {
        console.error(error)
      }
    }

    void loadUnread()
    const interval = window.setInterval(() => {
      void loadUnread()
    }, 5000)

    return () => window.clearInterval(interval)
  }, [user])

  const unreadLabel = useMemo(() => {
    if (!unreadMessages) return null
    return unreadMessages > 99 ? "99+" : String(unreadMessages)
  }, [unreadMessages])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/70 glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-sm">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="leading-none">
                <span className="text-xl font-bold tracking-tight">
                  Skill<span className="text-gradient">ent</span>
                </span>
              </div>
            </Link>
            <ThemeToggle />
          </div>

          <nav className="hidden md:flex items-center gap-2 rounded-2xl border border-border/70 bg-card/75 px-2 py-1.5 shadow-sm">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all",
                    isActive
                      ? "bg-secondary text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.href === "/support" && supportAttention ? (
                    <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      !
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {loading ? null : user ? (
              <>
                <Link href="/messages" className="relative">
                  <Button variant="ghost" size="icon" aria-label="Сообщения" className="rounded-xl">
                    <MessageSquareMore className="h-5 w-5" />
                  </Button>
                  {unreadLabel && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                      {unreadLabel}
                    </span>
                  )}
                </Link>

                <Link href="/dashboard">
                  <Button variant="ghost" size="icon" aria-label="Личный кабинет" className="rounded-xl">
                    <UserRound className="h-5 w-5" />
                  </Button>
                </Link>

                {(user.role === "admin" || user.role === "moderator") && (
                  <Link href="/admin">
                    <Button variant="ghost" size="icon" aria-label="Админка" className="rounded-xl">
                      <Shield className="h-5 w-5" />
                    </Button>
                  </Link>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="rounded-xl"
                  aria-label="Выйти"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="rounded-xl">
                    Войти
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="rounded-xl glow-primary">
                    Регистрация
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden rounded-xl p-2 hover:bg-secondary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/70 glass">
          <nav className="flex flex-col p-4 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-secondary"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.href === "/support" && supportAttention ? (
                    <Badge className="ml-auto">!</Badge>
                  ) : null}
                </Link>
              )
            })}

            <Link href="/dashboard" className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-secondary">
              <UserRound className="h-4 w-4" />
              <span>Личный кабинет</span>
            </Link>

            <Link href="/messages" className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-secondary">
              <MessageSquareMore className="h-4 w-4" />
              <span>Сообщения</span>
              {unreadLabel && <Badge>{unreadLabel}</Badge>}
            </Link>

            <div className="h-px bg-border my-2" />

            {user ? (
              <Button onClick={logout} className="rounded-xl">Выйти</Button>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="w-full rounded-xl">Войти</Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full rounded-xl glow-primary">Регистрация</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
