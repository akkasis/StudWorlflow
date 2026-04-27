import Link from "next/link"
import { notFound } from "next/navigation"
import { MessageSquare, MapPin, Clock, CheckCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StarRating } from "@/components/star-rating"
import { AddReview } from "@/components/add-review"

export const dynamic = "force-dynamic"

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

async function getProfile(id: string) {
  const res = await fetch(`http://localhost:3001/profiles/${id}`, {
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

  const initials = profile.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">

          {/* HEADER */}
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/30" />

            <CardContent className="relative pt-0 pb-6 px-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">

                <Avatar className="h-28 w-28 -mt-14 border-4 border-card">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 pt-2">
                  <h1 className="text-3xl font-bold">{profile.name}</h1>

                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.university}</span>
                    <span>•</span>
                    <span>{profile.course}</span>
                  </div>

                  <div className="mt-2">
                    <StarRating
                      rating={profile.rating}
                      showValue
                      reviewCount={profile.reviewCount}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-2">
                  <div className="text-right">
                    <span className="text-3xl font-bold">
                      ${profile.pricePerHour}
                    </span>
                    <span className="text-muted-foreground">/hr</span>
                  </div>

                  <Link href="/messages">
                    <Button size="lg">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </Link>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* CONTENT */}
          <div className="grid lg:grid-cols-3 gap-6 mt-6">

            {/* LEFT */}
            <div className="lg:col-span-2 space-y-6">

              {/* ABOUT */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {profile.description}
                  </p>
                </CardContent>
              </Card>

              {/* SKILLS */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Expertise</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {profile.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              {/* REVIEWS */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Reviews ({profile.reviewCount})
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">

                  {profile.reviews.map((r: any, index: number) => (
                    <div key={r.id}>
                      <div className="border p-3 rounded-lg">
                        <p className="font-medium">{r.userEmail}</p>
                        <p className="text-sm text-muted-foreground">
                          ⭐ {r.rating}
                        </p>
                        <p className="mt-1">{r.text}</p>
                      </div>

                      {index < profile.reviews.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}

                </CardContent>
              </Card>

              {/* 👇 ВОТ СЮДА ДОБАВЛЕНА ФОРМА */}
              <AddReview profileId={id} />

            </div>

            {/* RIGHT */}
            <div className="space-y-6">

              {/* AVAILABILITY */}
              <Card>
                <CardHeader>
                  <CardTitle>Availability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4" />
                    <span>Fast response</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Online sessions</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Flexible scheduling</span>
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