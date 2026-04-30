import { notFound } from "next/navigation"
import { MapPin, Clock, CheckCircle } from "lucide-react"
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

function formatAverageGrade(value?: number | null) {
  if (value === null || value === undefined) {
    return null
  }

  return value.toFixed(2).replace(/\.?0+$/, "")
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  const profile = await getProfile(id)

  if (!profile) {
    notFound()
  }

  const averageGrade = formatAverageGrade(profile.averageGrade)

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
              <div className="h-32 bg-gradient-to-r from-primary/15 via-accent/50 to-primary/10" />
            )}

            <CardContent className="relative px-6 pb-6 pt-0">
              <div className="flex flex-col items-start gap-6 sm:flex-row">
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
                      {profile.role === "tutor" ? "Стутьютор" : "Студент"}
                    </Badge>
                    {profile.verified ? (
                      <Badge variant="outline">Верифицированный пользователь</Badge>
                    ) : null}
                    {profile.isOnline ? (
                      <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">В сети</Badge>
                    ) : null}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-muted-foreground">
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
                </div>

                {profile.role === "tutor" ? (
                  <div className="w-full pt-2 sm:min-w-[220px] sm:w-auto">
                    <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
                      <p className="text-sm text-muted-foreground">Стоимость занятия</p>
                      <p className="mt-1 text-2xl font-semibold">от {profile.pricePerHour} ₽</p>
                      {averageGrade ? (
                        <div className="mt-3 rounded-xl bg-secondary/60 px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Средний балл
                          </p>
                          <p className="mt-1 text-lg font-semibold">{averageGrade} / 5</p>
                        </div>
                      ) : null}

                      <div className="mt-4">
                        <ProfileActions
                          profileId={id}
                          ownerUserId={profile.userId}
                          role={profile.role}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>О стутьюторе</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-7 text-muted-foreground">
                    {profile.description || "Стутьютор пока не добавил описание."}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>Навыки и направления</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {profile.tags.length > 0 ? (
                    profile.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Навыки пока не добавлены.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>Отзывы ({profile.reviewCount})</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {profile.reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Пока нет отзывов. Они появятся после первых занятий.
                    </p>
                  ) : null}

                  {profile.reviews.map((r: any, index: number) => (
                    <div key={r.id}>
                      <div className="rounded-lg border p-4">
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
                        <p className="mt-2 text-sm leading-6 text-muted-foreground whitespace-pre-wrap break-words">{r.text}</p>
                      </div>

                      {index < profile.reviews.length - 1 ? <Separator className="mt-4" /> : null}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {profile.role === "tutor" ? (
                <AddReview profileId={id} ownerUserId={profile.userId} reviews={profile.reviews} />
              ) : null}
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
                    <p className="text-sm leading-6 text-muted-foreground">
                      Формат работы и график стутьютор уточняет индивидуально. Обычно все детали можно быстро обсудить в чате.
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
                    <CheckCircle className="mt-1 h-4 w-4 text-primary" />
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
