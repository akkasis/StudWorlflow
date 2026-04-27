"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, ArrowUpDown, CircleHelp, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StudentCard, StudentData } from "@/components/student-card"

const SORT_OPTIONS = [
  { value: "popular", label: "По популярности" },
  { value: "newest", label: "Сначала новые" },
  { value: "price", label: "По цене" },
]

export default function MarketplacePage() {
  const [students, setStudents] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("popular")
  const [searchQuery, setSearchQuery] = useState("")
  const [showTips, setShowTips] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem("marketplace_help_dismissed")
    setShowTips(!dismissed)
  }, [])

  useEffect(() => {
    setLoading(true)

    fetch(`http://localhost:3001/profiles?sort=${sortBy}`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sortBy])

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (!searchQuery) return true

      const query = searchQuery.toLowerCase()
      return (
        student.name.toLowerCase().includes(query) ||
        student.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        student.description.toLowerCase().includes(query)
      )
    })
  }, [students, searchQuery])

  const dismissTips = () => {
    localStorage.setItem("marketplace_help_dismissed", "1")
    setShowTips(false)
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Каталог тьюторов</h1>
              <p className="text-muted-foreground">
                Выбирай студентов РАНХиГС по рейтингу, цене и свежести анкет.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[250px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени, навыкам или описанию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12"
                />
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-sm outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {showTips && (
            <div className="mt-6 rounded-3xl border border-primary/20 bg-primary/8 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Первая подсказка</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Сначала отсортируй по популярности, потом открой 2–3 анкеты и сравни отзывы, цену и описание.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link href="/help">
                    <Button variant="outline">
                      <CircleHelp className="mr-2 h-4 w-4" />
                      Как пользоваться
                    </Button>
                  </Link>
                  <Button onClick={dismissTips}>Понятно</Button>
                </div>
              </div>
            </div>
          )}

          {loading && <p className="mt-6">Загрузка...</p>}

          {!loading && filteredStudents.length === 0 && (
            <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-center">
              <p className="text-lg font-semibold">Ничего не найдено</p>
              <p className="mt-2 text-muted-foreground">
                Попробуй изменить запрос или переключить сортировку.
              </p>
            </div>
          )}

          <div className="mt-8 grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
