import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/star-rating"
import { MapPin, Verified } from "lucide-react"

export interface StudentData {
  id: string
  name: string
  avatar?: string
  university: string
  course: string
  tags: string[]
  rating: number
  reviewCount: number
  description: string
  pricePerHour: number
  verified?: boolean
}

interface StudentCardProps {
  student: StudentData
}

export function StudentCard({ student }: StudentCardProps) {
  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Link href={`/profile/${student.id}`} className="group block">
      <div
        className={`relative h-full rounded-2xl border bg-card p-5 transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 ${
          student.verified
            ? "border-primary/35 shadow-md shadow-primary/10 ring-1 ring-primary/15"
            : "border-border/50"
        }`}
      >
        {student.verified && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Verified className="h-3.5 w-3.5" />
            Верифицированный тьютор
          </div>
        )}

        {/* Top Section */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-border">
              <AvatarImage src={student.avatar} alt={student.name} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            {student.verified && (
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                <Verified className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate text-lg">
              {student.name}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{student.university}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mt-4 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {student.description}
        </p>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {student.tags.slice(0, 3).map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="text-xs font-normal bg-secondary/80 hover:bg-secondary border-0"
            >
              {tag}
            </Badge>
          ))}
          {student.tags.length > 3 && (
            <Badge variant="outline" className="text-xs font-normal border-border/50">
              +{student.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Bottom Section */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <StarRating rating={student.rating} size="sm" />
            <span className="text-sm text-muted-foreground">
              ({student.reviewCount})
            </span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-foreground">
              {student.pricePerHour} ₽
            </span>
            <span className="text-sm text-muted-foreground">/час</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
