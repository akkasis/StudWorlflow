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
import { students, reviews } from "@/lib/mock-data"

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  const student = students.find((s) => s.id === id)

  if (!student) {
    notFound()
  }

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Header */}
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/30" />
            <CardContent className="relative pt-0 pb-6 px-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Avatar */}
                <Avatar className="h-28 w-28 -mt-14 border-4 border-card shadow-lg">
                  <AvatarImage src={student.avatar} alt={student.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                        {student.name}
                      </h1>
                      <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{student.university}</span>
                        <span>&bull;</span>
                        <span>{student.course}</span>
                      </div>
                      <div className="mt-2">
                        <StarRating
                          rating={student.rating}
                          showValue
                          reviewCount={student.reviewCount}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2">
                      <div className="text-right">
                        <span className="text-3xl font-bold text-foreground">
                          ${student.pricePerHour}
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
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {student.description}
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    I&apos;m passionate about helping fellow students understand complex concepts. 
                    My teaching style focuses on building intuition and problem-solving skills 
                    rather than just memorization. I believe that anyone can master challenging 
                    subjects with the right guidance and approach.
                  </p>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {student.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-sm">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle>Reviews ({student.reviewCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reviews.map((review, index) => (
                      <div key={review.id}>
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.avatar} alt={review.studentName} />
                            <AvatarFallback>{review.studentName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-foreground">
                                  {review.studentName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {review.date}
                                </p>
                              </div>
                              <StarRating rating={review.rating} size="sm" />
                            </div>
                            <p className="mt-2 text-muted-foreground leading-relaxed">
                              {review.text}
                            </p>
                          </div>
                        </div>
                        {index < reviews.length - 1 && (
                          <Separator className="mt-6" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Hourly Rate</p>
                      <p className="text-sm text-muted-foreground">Standard session</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      ${student.pricePerHour}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Package (5 hrs)</p>
                      <p className="text-sm text-muted-foreground">10% discount</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      ${Math.round(student.pricePerHour * 5 * 0.9)}
                    </p>
                  </div>
                  <Link href="/messages" className="block">
                    <Button className="w-full" size="lg">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact for booking
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Availability Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Usually responds within 2 hours</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Available for online sessions</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Flexible scheduling</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust & Safety */}
              <Card>
                <CardHeader>
                  <CardTitle>Trust & Safety</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Identity verified</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>University email confirmed</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Member since 2024</span>
                    </div>
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
