"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StudentCard, StudentData } from "@/components/student-card"

// ❌ убрали mock students
// import { students } from "@/lib/mock-data"

const allTags = [
  "programming","python","algorithms","math","calculus","statistics",
  "english","writing","essays","physics","chemistry","biology",
  "economics","finance",
]

const universities = [
  "MIT","Stanford","Harvard","UC Berkeley","Columbia","Yale","Princeton","NYU",
]

export default function MarketplacePage() {
  const [students, setStudents] = useState<StudentData[]>([]) // 🔥 теперь реальные данные
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 5000]) // 🔥 под реальные цены
  const [minRating, setMinRating] = useState(0)
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([])
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // 🔥 ЗАГРУЗКА С BACKEND
  useEffect(() => {
    fetch("http://localhost:3001/profiles")
      .then((res) => res.json())
      .then((data) => {
        setStudents(data)
        setLoading(false)
      })
  }, [])

  // 🔥 ВСЯ ЛОГИКА ФИЛЬТРА ОСТАЁТСЯ
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !student.name.toLowerCase().includes(query) &&
          !student.tags.some((t) => t.toLowerCase().includes(query)) &&
          !student.description.toLowerCase().includes(query)
        ) return false
      }

      if (selectedTags.length > 0) {
        if (!selectedTags.some((tag) => student.tags.includes(tag))) return false
      }

      if (
        student.pricePerHour < priceRange[0] ||
        student.pricePerHour > priceRange[1]
      ) return false

      if (student.rating < minRating) return false

      if (selectedUniversities.length > 0) {
        if (!selectedUniversities.includes(student.university)) return false
      }

      return true
    })
  }, [students, searchQuery, selectedTags, priceRange, minRating, selectedUniversities])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const toggleUniversity = (university: string) => {
    setSelectedUniversities((prev) =>
      prev.includes(university)
        ? prev.filter((u) => u !== university)
        : [...prev, university]
    )
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedTags([])
    setPriceRange([0, 5000])
    setMinRating(0)
    setSelectedUniversities([])
  }

  const hasActiveFilters =
    selectedTags.length > 0 ||
    minRating > 0 ||
    selectedUniversities.length > 0

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-7xl px-4 py-8">

          <h1 className="text-3xl font-bold mb-6">Explore tutors</h1>

          {/* 🔍 поиск */}
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-6"
          />

          {loading && <p>Загрузка...</p>}

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
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