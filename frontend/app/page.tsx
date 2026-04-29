"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { BookOpenCheck, ClipboardCheck, GraduationCap, Search, UserRound, WalletCards } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { EducationIconBackground } from "@/components/education-icon-background"
import { SiteLogo } from "@/components/site-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { StudentCard, StudentData } from "@/components/student-card"
import { useAuth } from "@/context/auth-context"
import { apiUrl } from "@/lib/api"

const landingFeatures = [
  {
    title: "Понимай быстрее",
    text: "Найди студента, который уже сдал твой предмет\nи объяснит без лишней теории — просто и по делу.",
    icon: BookOpenCheck,
  },
  {
    title: "Сдай экзамен без стресса",
    text: "Готовься к КР, зачётам и экзаменам с теми,\nкто уже прошёл это и знает, что реально важно.",
    icon: ClipboardCheck,
  },
  {
    title: "Зарабатывай на своих знаниях",
    text: "Помогай другим студентам разобраться в предметах\nи получай деньги за то, что ты уже умеешь.",
    icon: WalletCards,
  },
]

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const [students, setStudents] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(apiUrl("/profiles"))
      .then((res) => res.json())
      .then((data) => {
        setStudents(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [authLoading, user])

  const featuredStudents = students.slice(0, 6)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-noise pointer-events-none" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <header className="relative z-20">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <SiteLogo textClassName="hidden sm:inline" />
            </Link>

            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-xl">
                  Войти
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="rounded-xl px-3 glow-primary sm:px-4">
                  Регистрация
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative flex-1">
          <section className="relative overflow-hidden">
            <EducationIconBackground />
            <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24 lg:px-8">
              <h1 className="max-w-5xl text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">
                Понимаешь предмет?{" "}
                <span className="text-gradient">Зарабатывай</span>.
                <br />
                Не понимаешь?{" "}
                Найдем тебе сту<span className="text-gradient">{"{тьютора}"}</span>.
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
                Стутьютор — студент, который уже прошёл этот предмет
                <br className="hidden sm:block" />
                и объяснит тебе так, как сам хотел бы понять.
              </p>

              <div className="mt-12 grid w-full gap-4 md:grid-cols-3">
                {landingFeatures.map((feature) => {
                  const Icon = feature.icon

                  return (
                    <div
                      key={feature.title}
                      className="rounded-3xl border border-border/70 bg-card/85 p-6 text-left shadow-lg shadow-primary/5 backdrop-blur transition-all hover:border-primary/40 hover:shadow-primary/10"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="mt-5 text-xl font-semibold">{feature.title}</h2>
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {feature.text}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
                <Link href="/signup?role=tutor" className="w-full sm:w-auto">
                  <Button size="lg" className="h-14 w-full px-8 sm:w-52">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Стать партнером
                  </Button>
                </Link>
                <Link href="/signup?role=student" className="w-full sm:w-auto">
                  <Button size="lg" className="h-14 w-full px-8 sm:w-52">
                    <UserRound className="mr-2 h-4 w-4" />
                    Стать клиентом
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 pt-16">

        {/* HERO ОСТАЁТСЯ КАК ЕСТЬ */}
        <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
          <EducationIconBackground />
          
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold">
                Найди стутьютора, который{" "}
                <span className="text-gradient">реально понимает</span>
              </h1>
              
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Общайся со студентами, которые уже отлично прошли твои предметы.
              </p>

              <div className="mt-10 flex w-full max-w-4xl flex-col gap-3 mx-auto sm:flex-row sm:items-stretch">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="С чем нужна помощь?"
                    className="h-14 border-2 border-primary/35 bg-card/95 pl-12 text-base shadow-md shadow-primary/10 hover:border-primary/60 focus-visible:border-primary dark:border-border dark:bg-card/70 dark:shadow-none"
                  />
                </div>

                <Link href="/marketplace" className="shrink-0">
                  <Button size="lg" className="h-14 w-full px-8 sm:w-14 sm:px-0" aria-label="Найти стутьютора">
                    <Search className="h-5 w-5" />
                  </Button>
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* 🔥 ВАЖНО — НАША ДИНАМИКА */}
        <section className="py-20 bg-card/30 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4">

            <h2 className="text-3xl font-bold mb-10">
              Популярные анкеты
            </h2>

            {loading && <p>Загрузка...</p>}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredStudents.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
