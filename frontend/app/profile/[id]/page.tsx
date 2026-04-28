import { notFound } from "next/navigation"
import { MapPin, Clock, CheckCircle, BookOpen, Sparkles, MessageCircleMore } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StarRating } from "@/components/star-rating"
import { ProfileActions } from "@/components/profile-actions"
import { AddReview } from "@/components/add-review"
import { apiUrl } from "@/lib/api"
import { UserAvatar } from "@/components/user-avatar"

export const dynamic = "force-dynamic"

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

async function getProfile(id: string) {
  const res = await fetch(apiUrl(`/profiles/${id}`), {
    cache: "no-store",
  })

  if (!res.ok) return null

  return res.json()
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  const profile = await getProfile(id)

  if (!profile) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Card className="overflow-hidden border-border/70 shadow-sm">
            {profile.banner ? (
              <div
                className="h-40 bg-cover bg-center"
                style={{ backgroundImage: `url(${profile.banner})` }}
              />
            ) : (
              <div className="h-32 bg-[radial-gradient(circle_at_top_left,rgba(121,168,214,0.22),transparent_42%),linear-gradient(135deg,rgba(121,168,214,0.14),rgba(165,208,226,0.08),rgba(121,168,214,0.16))]" />
            )}

            <CardContent className="relative pt-0 pb-6 px-6">
              <div className="pointer-events-none absolute inset-x-6 top-5 h-24 rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(121,168,214,0.12),transparent_45%)]" />
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <UserAvatar
                  src={profile.avatar}
                  name={profile.name}
                  isOnline={profile.isOnline}
                  className="h-28 w-28 -mt-14 border-4 border-card shadow-md"
                  indicatorClassName="h-5 w-5 border-[3px] border-card"
                />

                <div className="flex-1 pt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">{profile.name}</h1>
                    <Badge variant="secondary">
                      {profile.role === "tutor" ? "Тьютор РАНХиГС" : "Студент РАНХиГС"}
                    </Badge>
                    {profile.verified && <Badge variant="outline">Верифицированный пользователь</Badge>}
                    {profile.isOnline ? <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">В сети</Badge> : null}
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.university}</span>
                    <span>•</span>
                    <span>{profile.course} курс</span>
                  </div>

                  <div className="mt-3">
                    <StarRating
                      rating={profile.rating}
                      showValue
                      reviewCount={profile.reviewCount}
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-card/75 px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        Курс
                      </div>
                      <p className="mt-2 text-lg font-semibold">{profile.course}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card/75 px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Отзывов
                      </div>
                      <p className="mt-2 text-lg font-semibold">{profile.reviewCount}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card/75 px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <MessageCircleMore className="h-3.5 w-3.5 text-primary" />
                        Формат
                      </div>
                      <p className="mt-2 text-sm font-semibold">
                        {profile.availability?.formats?.length
                          ? profile.availability.formats
                              .map((item: string) => (item === "online" ? "Онлайн" : "Оффлайн"))
                              .join(", ")
                          : "Уточняется в чате"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-[280px]">
                  <div className="rounded-[1.75rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] p-4 shadow-sm">
                    <div className="text-right mb-4">
                      <span className="text-3xl font-bold">
                        {profile.pricePerHour} ₽
                      </span>
                      <span className="text-muted-foreground">/час</span>
                    </div>
                    <ProfileActions
                      profileId={id}
                      ownerUserId={profile.userId}
                      role={profile.role}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>О тьюторе</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-7 text-[15px]">
                    {profile.description || "Тьютор пока не добавил описание."}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>Навыки и направления</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2.5">
                  {profile.tags.length > 0 ? (
                    profile.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-sm">
                        #{tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Навыки пока не добавлены.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>Отзывы ({profile.reviewCount})</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {profile.reviews.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Пока нет отзывов. Они появятся после первых занятий.
                    </p>
                  )}

                  {profile.reviews.map((r: any, index: number) => (
                    <div key={r.id}>
                      <div
                        className={`rounded-2xl border p-4 ${
                          r.verified
                            ? "border-primary/40 bg-primary/8 shadow-sm"
                            : "border-border/70 bg-card/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{r.userName}</p>
                            {r.verified ? (
                              <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                                Подтвержден модерацией
                              </Badge>
                            ) : null}
                          </div>
                          <Badge variant="secondary">★ {r.rating}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground leading-6">
                          {r.text}
                        </p>
                      </div>

                      {index < profile.reviews.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {profile.role === "tutor" && (
                <AddReview profileId={id} ownerUserId={profile.userId} />
              )}
            </div>

            <div className="space-y-6">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>Формат работы</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!profile.availability?.formats?.length &&
                  !profile.availability?.primeDays?.length &&
                  !profile.availability?.primeTime &&
                  !profile.availability?.note ? (
                    <p className="text-sm text-muted-foreground leading-6">
                      Формат работы и график тьютор уточняет индивидуально. Обычно все детали можно быстро обсудить в чате.
                    </p>
                  ) : null}

                  {profile.availability?.formats?.length ? (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>
                        {profile.availability.formats
                          .map((item: string) => (item === "online" ? "Онлайн" : "Оффлайн"))
                          .join(", ")}
                      </span>
                    </div>
                  ) : null}

                  {profile.availability?.primeDays?.length ? (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4" />
                      <span>{profile.availability.primeDays.join(", ")}</span>
                    </div>
                  ) : null}

                  {profile.availability?.primeTime ? (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4" />
                      <span>{profile.availability.primeTime}</span>
                    </div>
                  ) : null}

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-1" />
                    <span>
                      {profile.availability?.note || "Свободный график, формат работы по договоренности"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
