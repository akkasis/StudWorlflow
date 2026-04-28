"use client"

import { ChangeEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Plus,
  X,
  Save,
  MessageSquare,
  Star,
  ExternalLink,
  Target,
  Upload,
  ImagePlus,
  ShieldCheck,
  PanelsTopLeft,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Header } from "@/components/header"
import { Protected } from "@/components/protected"
import { useAuth } from "@/context/auth-context"
import { apiUrl } from "@/lib/api"
import { useAppAlert } from "@/components/app-alert-provider"

interface RecentReview {
  id: number
  rating: number
  text: string
  createdAt: string
  userName: string
  verified?: boolean
}

interface ProfileData {
  id: string
  userId: string
  name: string
  avatar?: string | null
  banner?: string | null
  university: string
  course: string
  role: "student" | "tutor"
  tags: string[]
  rating: number
  reviewCount: number
  description: string
  pricePerHour: number
  recentReviews: RecentReview[]
  verified?: boolean
  availability?: {
    formats: string[]
    primeDays: string[]
    primeTime: string
    note: string
  } | null
}

interface ConversationSummary {
  id: string
  profileId: string
  unreadCount: number
}

const UNIVERSITY_NAME = "РАНХиГС"
const dayOptions = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
const formatOptions = [
  { label: "Онлайн", value: "online" },
  { label: "Оффлайн", value: "offline" },
]

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { showAlert } = useAppAlert()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [recentConversations, setRecentConversations] = useState<ConversationSummary[]>([])
  const [newTag, setNewTag] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [bannerLoading, setBannerLoading] = useState(false)

  useEffect(() => {
    if (!user || user.role === "admin" || user.role === "moderator") {
      return
    }

    const token = localStorage.getItem("token")
    if (!token) return

    Promise.all([
      fetch(apiUrl("/profiles/me"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.json()),
      fetch(apiUrl("/messages/conversations"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.json()),
    ])
      .then(([profileData, conversationsData]) => {
        setProfile(profileData)
        setRecentConversations(conversationsData.slice(0, 4))
      })
      .catch((error) => {
        console.error(error)
      })
  }, [user])

  const isTutor = profile?.role === "tutor"

  const toggleAvailabilityFormat = (format: string) => {
    if (!profile) return
    const current = profile.availability || {
      formats: [],
      primeDays: [],
      primeTime: "",
      note: "",
    }

    const formats = current.formats.includes(format)
      ? current.formats.filter((item) => item !== format)
      : [...current.formats, format]

    setProfile({
      ...profile,
      availability: {
        ...current,
        formats,
      },
    })
  }

  const toggleAvailabilityDay = (day: string) => {
    if (!profile) return
    const current = profile.availability || {
      formats: [],
      primeDays: [],
      primeTime: "",
      note: "",
    }

    const primeDays = current.primeDays.includes(day)
      ? current.primeDays.filter((item) => item !== day)
      : [...current.primeDays, day]

    setProfile({
      ...profile,
      availability: {
        ...current,
        primeDays,
      },
    })
  }

  const handleAddTag = () => {
    if (!profile) return

    const tag = newTag.trim()
    if (tag && !profile.tags.includes(tag)) {
      setProfile({
        ...profile,
        tags: [...profile.tags, tag],
      })
      setNewTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    if (!profile) return

    setProfile({
      ...profile,
      tags: profile.tags.filter((item) => item !== tag),
    })
  }

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    void uploadProfileAsset(file, "avatar")
  }

  const handleBannerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile || profile.role !== "tutor") return

    void uploadProfileAsset(file, "banner")
  }

  const uploadProfileAsset = async (file: File, kind: "avatar" | "banner") => {
    const token = localStorage.getItem("token")
    if (!token || !profile) return

    if (kind === "avatar") {
      setAvatarLoading(true)
    } else {
      setBannerLoading(true)
    }

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(apiUrl(`/profiles/upload/${kind}`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.url) {
        showAlert(
          "Ошибка загрузки",
          data?.message || "Не удалось загрузить изображение. Попробуй выбрать другой файл.",
        )
        return
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              ...(kind === "avatar"
                ? { avatar: data.url }
                : { banner: data.url }),
            }
          : current,
      )
    } catch (error) {
      console.error(error)
      showAlert("Ошибка загрузки", "Сейчас не удалось загрузить файл. Попробуй еще раз.")
    } finally {
      if (kind === "avatar") {
        setAvatarLoading(false)
      } else {
        setBannerLoading(false)
      }
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    const token = localStorage.getItem("token")
    setIsSaving(true)

    try {
      const payload: Record<string, unknown> = {
        name: profile.name,
        university: UNIVERSITY_NAME,
        course: Number(profile.course),
        avatar: profile.avatar,
        availability: profile.availability,
      }

      if (isTutor) {
        payload.description = profile.description
        payload.tags = profile.tags
        payload.pricePerHour = profile.pricePerHour
        payload.banner = profile.banner
      }

      const res = await fetch(apiUrl("/profiles"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        showAlert("Не удалось сохранить профиль", data.message || "Проверь заполнение полей и попробуй снова.")
        return
      }

      setProfile(data)
      showAlert("Готово", "Изменения в профиле успешно сохранены.")
    } catch (error) {
      console.error(error)
      showAlert("Ошибка сервера", "Сейчас не удалось сохранить профиль. Попробуй еще раз чуть позже.")
    } finally {
      setIsSaving(false)
    }
  }

  const initials = useMemo(() => {
    return profile?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }, [profile])

  if (!loading && (user?.role === "admin" || user?.role === "moderator")) {
    return (
      <Protected>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 p-6 pt-24">
            <div className="mx-auto max-w-4xl">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>Кабинет администратора</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-7">
                    Для администраторов и модераторов личная анкета не обязательна. Все основные инструменты доступны в панели модерации.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/admin">
                      <Button className="rounded-xl">Открыть админку</Button>
                    </Link>
                    <Link href="/support">
                      <Button variant="outline" className="rounded-xl">
                        Чат поддержки
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </Protected>
    )
  }

  if (!profile) {
    return (
      <Protected>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <div className="pt-24 px-6">Загрузка...</div>
        </div>
      </Protected>
    )
  }

  return (
    <Protected>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 p-6 pt-24">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">Личный кабинет</h1>
                <p className="text-muted-foreground mt-1">
                  Управляй профилем, сообщениями и своей активностью в Skillent.
                </p>
              </div>

              <div className="flex gap-3">
                {isTutor && (
                  <Link href={`/profile/${profile.id}`}>
                    <Button variant="outline" className="rounded-xl">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Публичная анкета
                    </Button>
                  </Link>
                )}
                <Link href="/messages">
                  <Button className="rounded-xl">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Открыть сообщения
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>Обзор аккаунта</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <Avatar className="h-20 w-20 shrink-0 shadow-sm">
                      <AvatarImage src={profile.avatar || ""} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold">{profile.name}</h2>
                      <p className="text-muted-foreground break-all">{user?.email}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {profile.university} • {profile.course} курс • {profile.role === "tutor" ? "Тьютор" : "Студент"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {profile.role === "tutor" ? "Тьютор" : "Студент"}
                        </Badge>
                        {profile.avatar ? <Badge variant="outline">Аватар добавлен</Badge> : null}
                        {isTutor && profile.banner ? <Badge variant="outline">Баннер добавлен</Badge> : null}
                        {profile.verified ? <Badge variant="outline">Подтвержденный тьютор</Badge> : null}
                      </div>
                    </div>
                  </div>

                  <div className={`grid gap-3 ${isTutor ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                    <Card className="border-border/60 shadow-none">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-sm">Диалоги</span>
                        </div>
                        <p className="mt-2 text-2xl font-semibold">{recentConversations.length}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-none">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Star className="h-4 w-4" />
                          <span className="text-sm">
                            {isTutor ? "Рейтинг" : "Статус"}
                          </span>
                        </div>
                        {isTutor ? (
                          <p className="mt-2 text-2xl font-semibold">
                            {profile.rating.toFixed(1)}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground leading-6">
                            Профиль готов к поиску тьютора и переписке.
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {isTutor && (
                      <Card className="border-border/60 shadow-none">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-sm">Отзывов</span>
                          </div>
                          <p className="mt-2 text-2xl font-semibold">{profile.reviewCount}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>

              {isTutor ? (
                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Недавние отзывы</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile.recentReviews.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Пока нет отзывов. Заверши несколько сессий, чтобы они появились здесь.
                      </p>
                    )}

                    {profile.recentReviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-2xl border border-border/70 bg-card/70 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{review.userName}</p>
                            {review.verified ? (
                              <Badge variant="outline">Подтвержден</Badge>
                            ) : null}
                          </div>
                          <Badge variant="secondary">★ {review.rating}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-6">
                          {review.text}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Твоя следующая цель</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl bg-primary/10 p-4 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <p className="font-medium">
                          Профиль готов к работе
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Добавь имя, курс и аватар, чтобы выглядеть увереннее в переписке.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/70 p-4 space-y-3 bg-card/70">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="font-medium">Идея на сегодня</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Выбери одного тьютора по нужному предмету и напиши ему первым в чат.
                      </p>
                      <Link href="/marketplace">
                        <Button className="w-full rounded-xl">Перейти в каталог</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="border-border/70 shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-primary/12 via-accent/30 to-primary/8" />
              <CardContent className="relative pt-0 px-6 pb-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                  <div className="w-full lg:w-[240px] -mt-12">
                    <div className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 shadow-md">
                          <AvatarImage src={profile.avatar || ""} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <p className="mt-4 font-semibold">{profile.name}</p>
                        <p className="text-sm text-muted-foreground">{UNIVERSITY_NAME}</p>

                        <label className="mt-4 w-full cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-secondary px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary/80">
                            {avatarLoading ? (
                              <>
                                <Upload className="h-4 w-4" />
                                <span>Загрузка...</span>
                              </>
                            ) : (
                              <>
                                <ImagePlus className="h-4 w-4" />
                                <span>Загрузить аватар</span>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold">
                        {isTutor ? "Анкета тьютора" : "Профиль студента"}
                      </h2>
                      <p className="mt-2 text-muted-foreground">
                        Заполни профиль так, чтобы другим было проще понять, кто ты и чем можешь помочь.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                        <Field>
                          <FieldLabel>Имя</FieldLabel>
                          <Input
                            value={profile.name}
                            onChange={(e) =>
                              setProfile({ ...profile, name: e.target.value })
                            }
                            className="mt-2 rounded-xl"
                          />
                        </Field>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                        <Field>
                          <FieldLabel>Университет</FieldLabel>
                          <Input
                            value={UNIVERSITY_NAME}
                            disabled
                            className="mt-2 rounded-xl opacity-100"
                          />
                        </Field>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-card/70 p-4 md:col-span-2">
                        <Field>
                          <FieldLabel>Курс</FieldLabel>
                          <Input
                            value={profile.course || ""}
                            onChange={(e) =>
                              setProfile({ ...profile, course: e.target.value })
                            }
                            className="mt-2 rounded-xl"
                          />
                        </Field>
                      </div>

                      {isTutor && (
                        <>
                          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 md:col-span-2">
                            <Field>
                              <FieldLabel>Баннер анкеты</FieldLabel>
                              <div className="mt-3 space-y-3">
                                <div className="overflow-hidden rounded-2xl border border-border/70 bg-secondary/40">
                                  {profile.banner ? (
                                    <img
                                      src={profile.banner}
                                      alt="Баннер анкеты"
                                      className="h-40 w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-40 items-center justify-center bg-gradient-to-r from-primary/12 via-accent/30 to-primary/8 text-sm text-muted-foreground">
                                      Баннер пока не добавлен
                                    </div>
                                  )}
                                </div>

                                <label className="block cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleBannerChange}
                                  />
                                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-secondary px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary/80">
                                    {bannerLoading ? (
                                      <>
                                        <Upload className="h-4 w-4" />
                                        <span>Загрузка баннера...</span>
                                      </>
                                    ) : (
                                      <>
                                        <PanelsTopLeft className="h-4 w-4" />
                                        <span>Загрузить баннер</span>
                                      </>
                                    )}
                                  </div>
                                </label>
                              </div>
                            </Field>
                          </div>

                          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 md:col-span-2">
                            <Field>
                              <FieldLabel>О себе</FieldLabel>
                              <Textarea
                                value={profile.description || ""}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    description: e.target.value,
                                  })
                                }
                                className="mt-2 min-h-32 rounded-xl"
                                placeholder="Коротко расскажи, чем ты помогаешь и в чем твоя сильная сторона."
                              />
                            </Field>
                          </div>

                          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 md:col-span-2">
                            <Field>
                              <FieldLabel>Навыки</FieldLabel>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {profile.tags.map((tag) => (
                                  <Badge key={tag} className="px-3 py-1.5">
                                    {tag}
                                    <X
                                      className="ml-2 h-3 w-3 cursor-pointer"
                                      onClick={() => handleRemoveTag(tag)}
                                    />
                                  </Badge>
                                ))}
                              </div>

                              <div className="mt-4 flex gap-2">
                                <Input
                                  value={newTag}
                                  onChange={(e) => setNewTag(e.target.value)}
                                  placeholder="Например: высшая математика"
                                  className="rounded-xl"
                                />
                                <Button type="button" onClick={handleAddTag} className="rounded-xl">
                                  <Plus />
                                </Button>
                              </div>
                            </Field>
                          </div>

                          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 md:col-span-2">
                            <Field>
                              <FieldLabel>Цена за час, ₽</FieldLabel>
                              <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="Например: 1500"
                                value={profile.pricePerHour ? String(profile.pricePerHour) : ""}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    pricePerHour: Number(
                                      e.target.value.replace(/[^\d]/g, ""),
                                    ),
                                  })
                                }
                                className="mt-2 rounded-xl"
                              />
                            </Field>
                          </div>

                          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 md:col-span-2">
                            <Field>
                              <FieldLabel>Формат и график работы</FieldLabel>
                              <div className="mt-3 space-y-4">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Предпочтительный формат
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {formatOptions.map((option) => {
                                      const selected = profile.availability?.formats.includes(option.value)
                                      return (
                                        <button
                                          key={option.value}
                                          type="button"
                                          onClick={() => toggleAvailabilityFormat(option.value)}
                                          className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                                            selected
                                              ? "border-primary bg-primary/10 text-foreground"
                                              : "border-border bg-background text-muted-foreground"
                                          }`}
                                        >
                                          {option.label}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Примерные дни
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {dayOptions.map((day) => {
                                      const selected = profile.availability?.primeDays.includes(day)
                                      return (
                                        <button
                                          key={day}
                                          type="button"
                                          onClick={() => toggleAvailabilityDay(day)}
                                          className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                                            selected
                                              ? "border-primary bg-primary/10 text-foreground"
                                              : "border-border bg-background text-muted-foreground"
                                          }`}
                                        >
                                          {day}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>

                                <Input
                                  value={profile.availability?.primeTime || ""}
                                  onChange={(e) =>
                                    setProfile({
                                      ...profile,
                                      availability: {
                                        formats: profile.availability?.formats || [],
                                        primeDays: profile.availability?.primeDays || [],
                                        primeTime: e.target.value,
                                        note: profile.availability?.note || "",
                                      },
                                    })
                                  }
                                  placeholder="Например: будни после 18:00"
                                  className="rounded-xl"
                                />

                                <Textarea
                                  value={profile.availability?.note || ""}
                                  onChange={(e) =>
                                    setProfile({
                                      ...profile,
                                      availability: {
                                        formats: profile.availability?.formats || [],
                                        primeDays: profile.availability?.primeDays || [],
                                        primeTime: profile.availability?.primeTime || "",
                                        note: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="Опционально: свободный график, формат по договоренности и т.д."
                                  className="min-h-24 rounded-xl"
                                />
                              </div>
                            </Field>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button onClick={handleSaveProfile} disabled={isSaving} className="rounded-xl px-6">
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Сохранение..." : "Сохранить изменения"}
                      </Button>
                    </div>
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
