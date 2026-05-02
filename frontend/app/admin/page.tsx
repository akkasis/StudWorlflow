"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Protected } from "@/components/protected"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Search, ExternalLink, LifeBuoy, MessagesSquare } from "lucide-react"
import { apiUrl } from "@/lib/api"
import { useAppAlert } from "@/components/app-alert-provider"
import { UserAvatar } from "@/components/user-avatar"

interface AdminUser {
  id: string
  email: string
  role: "student" | "tutor" | "moderator" | "admin"
  tutorVerified: boolean
  isOnline?: boolean
  ban: { permanent?: boolean; until?: string; reason?: string } | null
  profile: {
    id: string
    name: string
    university: string
    course: number
    role: string
    rating: number
    avatar?: string | null
    description?: string
    pricePerHour?: number
  } | null
}

interface AdminReview {
  id: number
  text: string
  rating: number
  profileId: string
  authorUserId: string
  tutorUserId: string
  tutorName: string
  userName: string
  verified: boolean
}

interface UserContext {
  user: {
    id: string
    email: string
    role: "student" | "tutor" | "moderator" | "admin"
    createdAt: string
    tutorVerified: boolean
    isOnline?: boolean
    ban: { permanent?: boolean; until?: string; reason?: string } | null
  }
  profile: {
    id: string
    name: string
    university: string
    course: number
    role: string
    rating: number
    description: string
    pricePerHour: number
    avatar?: string | null
    banner?: string | null
    isOnline?: boolean
    availability?: {
      formats: string[]
      primeDays: string[]
      primeTime: string
      note: string
    } | null
  } | null
  supportMessages: Array<{
    id: string
    senderUserId: number
    text: string
    createdAt: string
  }>
  recentConversations: Array<{
    id: string
    partnerName: string
    partnerEmail: string
    partnerRole: string
    lastMessage: string
    updatedAt: string
  }>
}

interface AdminConversationSummary {
  id: string
  updatedAt: string
  participantOne: {
    profileId: string
    userId: string
    name: string
    email: string
    role: string
    avatar?: string | null
  }
  participantTwo: {
    profileId: string
    userId: string
    name: string
    email: string
    role: string
    avatar?: string | null
  }
  lastMessage: string
  lastMessageAt: string
}

interface AdminConversationDetails {
  id: string
  participantOne: AdminConversationSummary["participantOne"]
  participantTwo: AdminConversationSummary["participantTwo"]
  messages: Array<{
    id: string
    senderUserId: string
    senderName: string
    senderAvatar?: string | null
    text: string
    createdAt: string
  }>
}

export default function AdminPage() {
  const { user } = useAuth()
  const { showAlert, showConfirm } = useAppAlert()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [overview, setOverview] = useState<{
    users: number
    profiles: number
    reviews: number
    students: number
    tutors: number
    onlineUsers: number
  } | null>(null)
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [conversations, setConversations] = useState<AdminConversationSummary[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<AdminConversationDetails | null>(null)
  const [conversationSearch, setConversationSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [showAllUsers, setShowAllUsers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const loadData = async () => {
    if (!token) return

    const [overviewRes, usersRes, reviewsRes, conversationsRes] = await Promise.all([
      fetch(apiUrl("/admin/overview"), {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(apiUrl("/admin/users"), {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(apiUrl("/admin/reviews"), {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(apiUrl("/admin/conversations"), {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])

    if (!overviewRes.ok || !usersRes.ok || !reviewsRes.ok || !conversationsRes.ok) {
      setOverview(null)
      setUsers([])
      setReviews([])
      setConversations([])
      return
    }

    setOverview(await overviewRes.json())
    setUsers(await usersRes.json())
    setReviews(await reviewsRes.json())
    setConversations(await conversationsRes.json())
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    const loadContext = async () => {
      if (!token || !selectedUserId) {
        setUserContext(null)
        return
      }

      try {
        const res = await fetch(apiUrl(`/admin/users/${selectedUserId}/context`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          setUserContext(null)
          return
        }

        setUserContext(await res.json())
      } catch (error) {
        console.error(error)
        setUserContext(null)
      }
    }

    void loadContext()
  }, [selectedUserId, token])

  useEffect(() => {
    const loadConversations = async () => {
      if (!token) {
        setConversations([])
        return
      }

      try {
        const query = conversationSearch.trim()
        const suffix = query ? `?q=${encodeURIComponent(query)}` : ""
        const res = await fetch(apiUrl(`/admin/conversations${suffix}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          setConversations([])
          return
        }

        setConversations(await res.json())
      } catch (error) {
        console.error(error)
        setConversations([])
      }
    }

    void loadConversations()
  }, [conversationSearch, token])

  useEffect(() => {
    const loadConversation = async () => {
      if (!token || !selectedConversationId) {
        setSelectedConversation(null)
        return
      }

      try {
        const res = await fetch(apiUrl(`/admin/conversations/${selectedConversationId}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          setSelectedConversation(null)
          return
        }

        setSelectedConversation(await res.json())
      } catch (error) {
        console.error(error)
        setSelectedConversation(null)
      }
    }

    void loadConversation()
  }, [selectedConversationId, token])

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return users.filter((item) => {
      const matchesRole = roleFilter === "all" ? true : item.role === roleFilter
      const matchesQuery =
        !query ||
        item.email.toLowerCase().includes(query) ||
        item.profile?.name?.toLowerCase().includes(query)

      return matchesRole && matchesQuery
    })
  }, [users, searchQuery, roleFilter])

  const visibleUsers = showAllUsers ? users : filteredUsers
  const selectedUser =
    users.find((item) => item.id === selectedUserId) ||
    (visibleUsers.length === 1 ? visibleUsers[0] : null)
  const selectedUserReviews = reviews.filter((review) => {
    if (!selectedUser) return false

    if (selectedUser.role === "tutor") {
      return review.tutorUserId === selectedUser.id
    }

    return review.authorUserId === selectedUser.id
  })

  if (user?.role !== "admin" && user?.role !== "moderator") {
    return (
      <Protected>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="pt-24 px-6">Недостаточно прав</div>
        </div>
      </Protected>
    )
  }

  const updateUser = async (userId: string, payload: Record<string, unknown>) => {
    if (!token) return
    const res = await fetch(apiUrl(`/admin/users/${userId}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      showAlert("Не удалось обновить пользователя", data?.message || "Попробуй еще раз.")
      return
    }
    await loadData()
    if (selectedUserId === userId) {
      const contextRes = await fetch(apiUrl(`/admin/users/${userId}/context`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (contextRes.ok) {
        setUserContext(await contextRes.json())
      }
    }
  }

  const updateReview = async (reviewId: number, payload: Record<string, unknown>) => {
    if (!token) return
    await fetch(apiUrl(`/admin/reviews/${reviewId}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    await loadData()
  }

  const deleteReview = async (reviewId: number) => {
    if (!token) return
    await fetch(apiUrl(`/admin/reviews/${reviewId}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    await loadData()
  }

  const deleteUser = async (userId: string) => {
    if (!token) return

    const confirmed = await showConfirm(
      "Удалить аккаунт?",
      "Точно удалить этот аккаунт? Это действие необратимо: исчезнут профиль, отзывы и связанные данные пользователя.",
      {
        confirmLabel: "Удалить",
        cancelLabel: "Отмена",
        destructive: true,
      },
    )

    if (!confirmed) {
      return
    }

    const res = await fetch(apiUrl(`/admin/users/${userId}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      showAlert("Не удалось удалить аккаунт", data?.message || "Попробуй еще раз.")
      return
    }

    if (selectedUserId === userId) {
      setSelectedUserId(null)
      setUserContext(null)
    }

    await loadData()
    showAlert("Аккаунт удален", "Пользователь и его связанные данные были удалены.")
  }

  return (
    <Protected>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-6 pb-10">
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Админка</h1>
              <p className="text-muted-foreground mt-1">
                Модерация пользователей, анкет, отзывов и ролей.
              </p>
            </div>

            {overview && (
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Пользователи</p><p className="text-3xl font-bold mt-2">{overview.users}</p></CardContent></Card>
                <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Анкеты</p><p className="text-3xl font-bold mt-2">{overview.profiles}</p></CardContent></Card>
                <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Отзывы</p><p className="text-3xl font-bold mt-2">{overview.reviews}</p></CardContent></Card>
                <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Онлайн</p><p className="text-3xl font-bold mt-2">{overview.onlineUsers}</p></CardContent></Card>
                <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Студенты</p><p className="text-3xl font-bold mt-2">{overview.students}</p></CardContent></Card>
                <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Тьюторы</p><p className="text-3xl font-bold mt-2">{overview.tutors}</p></CardContent></Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Все диалоги пользователей</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="relative max-w-xl">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={conversationSearch}
                    onChange={(e) => setConversationSearch(e.target.value)}
                    placeholder="Поиск по имени, почте или тексту последнего сообщения"
                    className="pl-11"
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                  <div className="space-y-3">
                    {conversations.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                        Диалоги не найдены.
                      </div>
                    ) : (
                      conversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          onClick={() => setSelectedConversationId(conversation.id)}
                          className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                            selectedConversationId === conversation.id
                              ? "border-primary bg-primary/8"
                              : "border-border bg-card hover:bg-secondary/70"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              src={conversation.participantOne.avatar}
                              name={conversation.participantOne.name}
                              className="h-10 w-10"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">
                                {conversation.participantOne.name} → {conversation.participantTwo.name}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground truncate">
                                {conversation.participantOne.email} • {conversation.participantTwo.email}
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                            {conversation.lastMessage || "Сообщений пока нет"}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {new Date(conversation.lastMessageAt).toLocaleString("ru-RU")}
                          </p>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="rounded-3xl border border-border bg-card p-5">
                    {!selectedConversation ? (
                      <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                        Выбери диалог слева, и здесь появится полная переписка.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-3 py-2">
                            <UserAvatar
                              src={selectedConversation.participantOne.avatar}
                              name={selectedConversation.participantOne.name}
                              className="h-10 w-10"
                            />
                            <div>
                              <p className="font-medium">{selectedConversation.participantOne.name}</p>
                              <p className="text-xs text-muted-foreground">{selectedConversation.participantOne.email}</p>
                            </div>
                          </div>
                          <span className="text-muted-foreground">↔</span>
                          <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-3 py-2">
                            <UserAvatar
                              src={selectedConversation.participantTwo.avatar}
                              name={selectedConversation.participantTwo.name}
                              className="h-10 w-10"
                            />
                            <div>
                              <p className="font-medium">{selectedConversation.participantTwo.name}</p>
                              <p className="text-xs text-muted-foreground">{selectedConversation.participantTwo.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                          {selectedConversation.messages.map((message) => (
                            <div key={message.id} className="rounded-2xl border border-border p-4">
                              <div className="flex flex-wrap items-center gap-3">
                                <Badge variant="outline">{message.senderName}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.createdAt).toLocaleString("ru-RU")}
                                </span>
                              </div>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Поиск пользователя</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 lg:grid-cols-[1.4fr_220px_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск по имени или почте"
                      className="pl-11"
                    />
                  </div>

                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-10 rounded-xl border-border bg-card text-sm">
                      <SelectValue placeholder="Все роли" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/70 bg-card/95 shadow-2xl">
                      <SelectItem value="all">Все роли</SelectItem>
                      <SelectItem value="student">Студент</SelectItem>
                      <SelectItem value="tutor">Стутьютор</SelectItem>
                      <SelectItem value="moderator">Модератор</SelectItem>
                      <SelectItem value="admin">Администратор</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => setShowAllUsers((current) => !current)}
                  >
                    {showAllUsers ? "Скрыть общий список" : "Показать всех"}
                  </Button>
                </div>

                <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
                  <div className="space-y-3">
                    {visibleUsers.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                        Пользователь не найден. Попробуй изменить имя, почту или фильтр по роли.
                      </div>
                    ) : (
                      visibleUsers.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedUserId(item.id)}
                          className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                            selectedUser?.id === item.id
                              ? "border-primary bg-primary/8"
                              : "border-border bg-card hover:bg-secondary/70"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <UserAvatar
                              src={item.profile?.avatar}
                              name={item.profile?.name || item.email}
                              isOnline={item.isOnline}
                              className="h-11 w-11"
                              fallbackClassName="bg-primary/15 text-primary"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold">{item.profile?.name || item.email}</p>
                                <Badge>{item.role}</Badge>
                                {item.tutorVerified ? <Badge variant="outline">Верифицирован</Badge> : null}
                                {item.ban ? <Badge variant="destructive">Ограничен</Badge> : null}
                                {item.isOnline ? <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">В сети</Badge> : null}
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">{item.email}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div>
                    {!selectedUser ? (
                      <div className="rounded-3xl border border-dashed border-border p-8 text-sm text-muted-foreground">
                        Выбери пользователя слева, и здесь появятся все действия модерации, анкета и связанные отзывы.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="rounded-3xl border border-border bg-card p-5 space-y-4">
                          <div className="flex items-start gap-4">
                            <UserAvatar
                              src={userContext?.profile?.avatar || selectedUser.profile?.avatar}
                              name={selectedUser.profile?.name || selectedUser.email}
                              isOnline={selectedUser.isOnline}
                              className="h-16 w-16"
                              fallbackClassName="bg-primary/15 text-primary text-lg"
                              indicatorClassName="h-4.5 w-4.5"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-semibold">
                                  {selectedUser.profile?.name || selectedUser.email}
                                </h3>
                                <Badge>{selectedUser.role}</Badge>
                                {selectedUser.tutorVerified ? <Badge variant="outline">Верифицирован</Badge> : null}
                                {selectedUser.ban ? <Badge variant="destructive">Ограничен</Badge> : null}
                                {selectedUser.isOnline ? <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">В сети</Badge> : null}
                              </div>

                              <p className="mt-2 text-sm text-muted-foreground">{selectedUser.email}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {selectedUser.profile ? (
                              <Link href={`/profile/${selectedUser.profile.id}`} target="_blank">
                                <Button variant="outline" className="gap-2">
                                  <ExternalLink className="h-4 w-4" />
                                  Открыть анкету
                                </Button>
                              </Link>
                            ) : null}
                            <Link href="/support" target="_blank">
                              <Button variant="outline" className="gap-2">
                                <LifeBuoy className="h-4 w-4" />
                                Открыть поддержку
                              </Button>
                            </Link>
                          </div>

                          {selectedUser.profile ? (
                            <div className="grid gap-3 md:grid-cols-3">
                              <Input
                                defaultValue={selectedUser.profile.name}
                                onBlur={(e) =>
                                  fetch(apiUrl(`/admin/profiles/${selectedUser.profile?.id}`), {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ name: e.target.value }),
                                  }).then(() => loadData())
                                }
                              />
                              <Input
                                type="number"
                                defaultValue={selectedUser.profile.course}
                                onBlur={(e) =>
                                  fetch(apiUrl(`/admin/profiles/${selectedUser.profile?.id}`), {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ course: Number(e.target.value) }),
                                  }).then(() => loadData())
                                }
                              />
                              <Input disabled value={selectedUser.profile.university} />
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                              У этого аккаунта нет публичной анкеты. Это нормально для администратора.
                            </div>
                          )}

                          {userContext?.profile?.availability ? (
                            <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4 text-sm">
                              <p className="font-medium">Формат работы и график</p>
                              <p className="mt-2 text-muted-foreground">
                                Форматы: {userContext.profile.availability.formats.length ? userContext.profile.availability.formats.join(", ") : "не указаны"}
                              </p>
                              <p className="text-muted-foreground">
                                Дни: {userContext.profile.availability.primeDays.length ? userContext.profile.availability.primeDays.join(", ") : "не указаны"}
                              </p>
                              <p className="text-muted-foreground">
                                Время: {userContext.profile.availability.primeTime || "не указано"}
                              </p>
                              {userContext.profile.availability.note ? (
                                <p className="mt-2 text-muted-foreground">{userContext.profile.availability.note}</p>
                              ) : null}
                            </div>
                          ) : null}

                          {selectedUser.ban ? (
                            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                              <p className="font-medium">Ограничения пользователя</p>
                              <p className="mt-2 text-muted-foreground">
                                {selectedUser.ban.permanent
                                  ? "Перманентный бан"
                                  : selectedUser.ban.until
                                    ? `Ограничение до ${new Date(selectedUser.ban.until).toLocaleString("ru-RU")}`
                                    : "Ограничение активно"}
                              </p>
                              {selectedUser.ban.reason ? (
                                <p className="mt-1 text-muted-foreground">{selectedUser.ban.reason}</p>
                              ) : null}
                            </div>
                          ) : null}

                          {selectedUser.profile?.role === "tutor" ? (
                            <div className="grid gap-3 md:grid-cols-2">
                              <Textarea
                                defaultValue={selectedUser.profile.description || ""}
                                onBlur={(e) =>
                                  fetch(apiUrl(`/admin/profiles/${selectedUser.profile?.id}`), {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ description: e.target.value }),
                                  }).then(() => loadData())
                                }
                                placeholder="Описание анкеты стутьютора"
                              />
                              <Input
                                defaultValue={selectedUser.profile.pricePerHour || 0}
                                inputMode="numeric"
                                onBlur={(e) =>
                                  fetch(apiUrl(`/admin/profiles/${selectedUser.profile?.id}`), {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                      pricePerHour: Number(e.target.value.replace(/[^\d]/g, "")),
                                    }),
                                  }).then(() => loadData())
                                }
                                placeholder="Цена в рублях"
                              />
                            </div>
                          ) : null}

                          <div className="flex flex-wrap gap-2">
                            {user.role === "admin" && (
                              <>
                                <Button variant="outline" onClick={() => updateUser(selectedUser.id, { role: "moderator" })}>Сделать модератором</Button>
                                <Button variant="outline" onClick={() => updateUser(selectedUser.id, { role: "admin" })}>Сделать админом</Button>
                                <Button variant="outline" onClick={() => updateUser(selectedUser.id, { role: selectedUser.profile?.role === "tutor" ? "tutor" : "student" })}>Сбросить роль</Button>
                              </>
                            )}
                            <Button variant="outline" onClick={() => updateUser(selectedUser.id, { tutorVerified: !selectedUser.tutorVerified })}>
                              {selectedUser.tutorVerified ? "Снять верификацию" : "Верифицировать стутьютора"}
                            </Button>
                            <Button variant="outline" onClick={() => updateUser(selectedUser.id, { banType: "temporary", banDays: 7, banReason: "Решение модерации" })}>
                              Бан 7 дней
                            </Button>
                            <Button variant="outline" onClick={() => updateUser(selectedUser.id, { banType: "permanent", banReason: "Перманентный бан" })}>
                              Перманентный бан
                            </Button>
                            <Button variant="outline" onClick={() => updateUser(selectedUser.id, { banType: "clear" })}>
                              Снять ограничения
                            </Button>
                            {user.role === "admin" ? (
                              <Button variant="destructive" onClick={() => deleteUser(selectedUser.id)}>
                                Удалить аккаунт
                              </Button>
                            ) : null}
                          </div>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-2">
                          <div className="rounded-3xl border border-border bg-card p-5">
                            <div className="mb-4 flex items-center gap-2">
                              <MessagesSquare className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <h3 className="text-lg font-semibold">Недавние диалоги</h3>
                                <p className="text-sm text-muted-foreground">
                                  Последние переписки выбранного пользователя.
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {userContext?.recentConversations?.length ? (
                                userContext.recentConversations.map((conversation) => (
                                  <div key={conversation.id} className="rounded-2xl border border-border p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-medium">{conversation.partnerName}</p>
                                      <Badge variant="outline">{conversation.partnerRole}</Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">{conversation.partnerEmail}</p>
                                    <p className="mt-3 text-sm">{conversation.lastMessage || "Сообщений пока нет"}</p>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      {new Date(conversation.updatedAt).toLocaleString("ru-RU")}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                                  У пользователя пока нет диалогов.
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="rounded-3xl border border-border bg-card p-5">
                            <div className="mb-4 flex items-center gap-2">
                              <LifeBuoy className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <h3 className="text-lg font-semibold">Поддержка</h3>
                                <p className="text-sm text-muted-foreground">
                                  Последние сообщения пользователя в чате поддержки.
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {userContext?.supportMessages?.length ? (
                                userContext.supportMessages.map((message) => (
                                  <div key={message.id} className="rounded-2xl border border-border p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant={message.senderUserId === Number(selectedUser.id) ? "secondary" : "outline"}>
                                        {message.senderUserId === Number(selectedUser.id) ? "Пользователь" : "Поддержка"}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(message.createdAt).toLocaleString("ru-RU")}
                                      </span>
                                    </div>
                                    <p className="mt-3 text-sm">{message.text}</p>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                                  Обращений в поддержку пока нет.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-border bg-card p-5">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold">Отзывы пользователя</h3>
                            <p className="text-sm text-muted-foreground">
                              Для стутьютора здесь показаны отзывы на его анкету, а для студента или администратора отзывы, которые он оставлял сам.
                            </p>
                          </div>

                          <div className="space-y-4">
                            {selectedUserReviews.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                                У выбранного пользователя пока нет отзывов для модерации.
                              </div>
                            ) : (
                              selectedUserReviews.map((review) => (
                                <div key={review.id} className="rounded-2xl border border-border p-4 space-y-3">
                                  <div className="flex flex-wrap gap-2 items-center">
                                    <p className="font-semibold">{review.userName}</p>
                                    <span className="text-muted-foreground">→</span>
                                    <p>{review.tutorName}</p>
                                    <Badge variant="secondary">★ {review.rating}</Badge>
                                    {review.verified ? <Badge variant="outline">Подтвержден модерацией</Badge> : null}
                                  </div>
                                  <Textarea
                                    defaultValue={review.text}
                                    onBlur={(e) => updateReview(review.id, { text: e.target.value })}
                                  />
                                  <Input
                                    type="number"
                                    min={1}
                                    max={5}
                                    defaultValue={review.rating}
                                    onBlur={(e) => updateReview(review.id, { rating: Number(e.target.value) })}
                                  />
                                  <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" onClick={() => updateReview(review.id, { verified: !review.verified })}>
                                      {review.verified ? "Снять пометку" : "Подтвердить модерацией"}
                                    </Button>
                                    <Button variant="destructive" onClick={() => deleteReview(review.id)}>
                                      Удалить отзыв
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </Protected>
  )
}
