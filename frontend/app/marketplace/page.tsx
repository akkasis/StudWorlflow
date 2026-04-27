"use client"

import { useState, useMemo } from "react"
import { Search, SlidersHorizontal, X, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StudentCard } from "@/components/student-card"
import { students } from "@/lib/mock-data"

const allTags = [
  "programming",
  "python",
  "algorithms",
  "math",
  "calculus",
  "statistics",
  "english",
  "writing",
  "essays",
  "physics",
  "chemistry",
  "biology",
  "economics",
  "finance",
]

const universities = [
  "MIT",
  "Stanford",
  "Harvard",
  "UC Berkeley",
  "Columbia",
  "Yale",
  "Princeton",
  "NYU",
]

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 100])
  const [minRating, setMinRating] = useState(0)
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([])
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = student.name.toLowerCase().includes(query)
        const matchesTags = student.tags.some((tag) =>
          tag.toLowerCase().includes(query)
        )
        const matchesDescription = student.description.toLowerCase().includes(query)
        const matchesCourse = student.course.toLowerCase().includes(query)
        if (!matchesName && !matchesTags && !matchesDescription && !matchesCourse) {
          return false
        }
      }

      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some((tag) =>
          student.tags.includes(tag)
        )
        if (!hasMatchingTag) return false
      }

      if (
        student.pricePerHour < priceRange[0] ||
        student.pricePerHour > priceRange[1]
      ) {
        return false
      }

      if (student.rating < minRating) {
        return false
      }

      if (selectedUniversities.length > 0) {
        if (!selectedUniversities.includes(student.university)) {
          return false
        }
      }

      return true
    })
  }, [searchQuery, selectedTags, priceRange, minRating, selectedUniversities])

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
    setPriceRange([0, 100])
    setMinRating(0)
    setSelectedUniversities([])
  }

  const hasActiveFilters =
    selectedTags.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 100 ||
    minRating > 0 ||
    selectedUniversities.length > 0

  const FiltersContent = () => (
    <div className="space-y-8">
      {/* Tags Filter */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">Skills</h3>
        <div className="space-y-3">
          {allTags.map((tag) => (
            <div key={tag} className="flex items-center gap-3">
              <Checkbox
                id={`tag-${tag}`}
                checked={selectedTags.includes(tag)}
                onCheckedChange={() => toggleTag(tag)}
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor={`tag-${tag}`}
                className="text-sm font-normal cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                {tag}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">Price Range</h3>
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={100}
            step={5}
            className="mt-2"
          />
          <div className="flex justify-between mt-3 text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}/hr</span>
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">Rating</h3>
        <div className="space-y-3">
          {[4.5, 4.0, 3.5, 0].map((rating) => (
            <div key={rating} className="flex items-center gap-3">
              <Checkbox
                id={`rating-${rating}`}
                checked={minRating === rating}
                onCheckedChange={() => setMinRating(minRating === rating ? 0 : rating)}
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor={`rating-${rating}`}
                className="text-sm font-normal cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                {rating === 0 ? "Any rating" : `${rating}+ stars`}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* University Filter */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">University</h3>
        <div className="space-y-3">
          {universities.map((university) => (
            <div key={university} className="flex items-center gap-3">
              <Checkbox
                id={`uni-${university}`}
                checked={selectedUniversities.includes(university)}
                onCheckedChange={() => toggleUniversity(university)}
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor={`uni-${university}`}
                className="text-sm font-normal cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                {university}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full border-border/50"
          onClick={clearAllFilters}
        >
          Clear all filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed inset-0 bg-noise pointer-events-none" />
      <Header />

      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Explore tutors</h1>
            <p className="mt-2 text-muted-foreground text-lg">
              {filteredStudents.length} tutors available
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, subject, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-card border-border/50 rounded-xl"
              />
            </div>

            {/* Mobile Filter Button */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden shrink-0 h-12 px-4 border-border/50 rounded-xl">
                  <SlidersHorizontal className="h-5 w-5" />
                  {hasActiveFilters && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {selectedTags.length + selectedUniversities.length + (minRating > 0 ? 1 : 0)}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto bg-card border-border/50">
                <SheetHeader>
                  <SheetTitle className="text-foreground">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FiltersContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer bg-primary/20 text-primary hover:bg-primary/30 border-0"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  <X className="ml-1.5 h-3 w-3" />
                </Badge>
              ))}
              {selectedUniversities.map((uni) => (
                <Badge
                  key={uni}
                  variant="secondary"
                  className="cursor-pointer bg-accent/20 text-accent hover:bg-accent/30 border-0"
                  onClick={() => toggleUniversity(uni)}
                >
                  {uni}
                  <X className="ml-1.5 h-3 w-3" />
                </Badge>
              ))}
              {minRating > 0 && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer bg-chart-3/20 text-chart-3 hover:bg-chart-3/30 border-0"
                  onClick={() => setMinRating(0)}
                >
                  {minRating}+ stars
                  <X className="ml-1.5 h-3 w-3" />
                </Badge>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 100) && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer bg-chart-4/20 text-chart-4 hover:bg-chart-4/30 border-0"
                  onClick={() => setPriceRange([0, 100])}
                >
                  ${priceRange[0]} - ${priceRange[1]}/hr
                  <X className="ml-1.5 h-3 w-3" />
                </Badge>
              )}
              <button
                onClick={clearAllFilters}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 rounded-2xl border border-border/50 bg-card/80 p-6">
                <h2 className="font-semibold text-foreground mb-6">Filters</h2>
                <FiltersContent />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Results Grid */}
              {filteredStudents.length > 0 ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredStudents.map((student) => (
                    <StudentCard key={student.id} student={student} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary mb-6">
                    <Search className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">No tutors found</h3>
                  <p className="mt-2 text-muted-foreground">
                    Try adjusting your filters or search query
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6 border-border/50"
                    onClick={clearAllFilters}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
