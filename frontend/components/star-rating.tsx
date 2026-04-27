import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  reviewCount?: number
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  reviewCount,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: maxRating }).map((_, index) => {
          const filled = index < Math.floor(rating)
          const partial = index === Math.floor(rating) && rating % 1 > 0

          return (
            <Star
              key={index}
              className={cn(
                sizeClasses[size],
                filled || partial
                  ? "text-amber-400 fill-amber-400"
                  : "text-muted-foreground/30"
              )}
            />
          )
        })}
      </div>
      {showValue && (
        <span className={cn("font-medium text-foreground", textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          ({reviewCount})
        </span>
      )}
    </div>
  )
}
