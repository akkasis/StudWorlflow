"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Search, ArrowRight, Zap, Shield, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StudentCard, StudentData } from "@/components/student-card"
import { apiUrl } from "@/lib/api"

// ❌ УДАЛЯЕМ mock-data
// import { students, categories, testimonials } from "@/lib/mock-data"

// 👉 временно оставим категории и отзывы как есть
import { categories, testimonials } from "@/lib/mock-data"

export default function HomePage() {
  const [students, setStudents] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl("/profiles"))
      .then((res) => res.json())
      .then((data) => {
        setStudents(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const featuredStudents = students.slice(0, 6)

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed inset-0 bg-noise pointer-events-none" />
      
      <Header />

      <main className="flex-1 pt-16">

        {/* HERO ОСТАЁТСЯ КАК ЕСТЬ */}
        <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">

              <Badge className="mb-6 px-4 py-2 bg-secondary border-border/50 text-muted-foreground">
                <Zap className="h-3.5 w-3.5 mr-2 text-primary" />
                Выбирают студенты
              </Badge>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold">
                Найди тьютора, который{" "}
                <span className="text-gradient">реально понимает</span>
              </h1>
              
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Общайся со студентами-тьюторами, которые уже отлично прошли твои предметы.
              </p>

              <div className="mt-10 flex w-full max-w-4xl flex-col gap-3 mx-auto sm:flex-row sm:items-stretch">
                <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                    placeholder="С чем нужна помощь?"
                    className="h-14 pl-12 text-base"
                  />
                </div>

                <Link href="/marketplace" className="shrink-0">
                  <Button size="lg" className="h-14 w-full px-8 sm:w-auto">
                    Найти тьютора
                    <ArrowRight className="ml-2 h-4 w-4" />
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
              Популярные тьюторы
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
