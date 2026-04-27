import Link from "next/link"
import { Search, ArrowRight, Zap, Shield, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StudentCard } from "@/components/student-card"
import { students, categories, testimonials } from "@/lib/mock-data"

export default function HomePage() {
  const featuredStudents = students.slice(0, 6)

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background noise texture */}
      <div className="fixed inset-0 bg-noise pointer-events-none" />
      
      <Header />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
          {/* Gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <Badge className="mb-6 px-4 py-2 bg-secondary border-border/50 text-muted-foreground">
                <Zap className="h-3.5 w-3.5 mr-2 text-primary" />
                Trusted by 10,000+ students
              </Badge>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
                Learn from peers who{" "}
                <span className="text-gradient">get it</span>
              </h1>
              
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto text-pretty">
                Connect with student tutors who aced your exact courses. Get personalized help from someone who recently conquered the same challenges.
              </p>

              {/* Search Box */}
              <div className="mt-10 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="What do you need help with?"
                    className="pl-12 h-14 text-base bg-card border-border/50 rounded-xl"
                  />
                </div>
                <Link href="/marketplace">
                  <Button size="lg" className="h-14 px-8 rounded-xl glow-primary w-full sm:w-auto">
                    Find Tutors
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Social Proof */}
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Avatar key={i} className="h-10 w-10 border-2 border-background">
                      <AvatarImage src={`https://i.pravatar.cc/150?img=${i + 10}`} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">4.9</span> from 2,000+ reviews
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-20 sm:py-24 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Browse by subject
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">
                Find experts in any field
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link 
                  key={category.tag} 
                  href={`/marketplace?tag=${category.tag}`}
                  className="group"
                >
                  <div className="flex flex-col items-center p-6 rounded-2xl border border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card transition-all">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      {category.icon}
                    </div>
                    <h3 className="font-medium text-foreground text-center">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.count}+ tutors
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Tutors Section */}
        <section className="py-20 sm:py-24 bg-card/30 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
              <div>
                <Badge className="mb-3 bg-accent/20 text-accent border-0">
                  Top Rated
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  Featured tutors
                </h2>
                <p className="mt-2 text-muted-foreground text-lg">
                  Highly rated by their peers
                </p>
              </div>
              <Link href="/marketplace">
                <Button variant="outline" className="border-border/50 hover:border-primary/50">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredStudents.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-24 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Why students choose PeerHub
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-2xl border border-border/50 bg-card/50">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 mb-6">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Peer-to-peer learning
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Learn from students who recently took your exact courses and understand the challenges firsthand.
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl border border-border/50 bg-card/50">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 mb-6">
                  <Shield className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Verified students
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  All tutors are verified students with proven academic records in their subjects.
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl border border-border/50 bg-card/50">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-chart-3/20 mb-6">
                  <Zap className="h-7 w-7 text-chart-3" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Flexible scheduling
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Book sessions that fit your schedule. Get help when you need it, on your terms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 sm:py-24 bg-card/30 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Loved by students
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">
                Real feedback from our community
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.id} 
                  className="p-6 rounded-2xl border border-border/50 bg-card/80"
                >
                  <div className="flex mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star 
                        key={i} 
                        className={`h-5 w-5 ${i <= testimonial.rating ? 'fill-primary text-primary' : 'text-muted'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed mb-6">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.university}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-24 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 p-8 sm:p-12 lg:p-16">
              {/* Gradient orbs */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/30 rounded-full blur-3xl" />
              
              <div className="relative text-center max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">
                  Ready to start tutoring?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Share your knowledge, help fellow students, and earn money doing what you love.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/signup">
                    <Button size="lg" className="glow-primary w-full sm:w-auto">
                      Become a Tutor
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/marketplace">
                    <Button size="lg" variant="outline" className="border-border/50 w-full sm:w-auto">
                      Browse Tutors
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
