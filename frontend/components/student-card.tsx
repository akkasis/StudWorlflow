import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/star-rating"
import { MapPin, Verified } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"

export interface StudentData {
  id: string
  name: string
  avatar?: string
  isOnline?: boolean
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
            <UserAvatar
              src={student.avatar}
              name={student.name}
              isOnline={student.isOnline}
              className="h-14 w-14 ring-2 ring-border"
              fallbackClassName="bg-primary/20 text-primary font-semibold text-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate text-lg">
              {student.name}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{student.university}</span>
            </div>
            {student.isOnline ? (
              <p className="mt-1 text-xs font-medium text-emerald-500">Сейчас в сети</p>
            ) : null}
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
