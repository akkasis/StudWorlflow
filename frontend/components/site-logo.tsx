import Image from "next/image"
import { cn } from "@/lib/utils"

interface SiteLogoProps {
  className?: string
  markClassName?: string
  textClassName?: string
}

export function SiteLogo({
  className,
  markClassName,
  textClassName,
}: SiteLogoProps) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <Image
        src="/logo.png"
        alt="Skillent"
        width={1024}
        height={1024}
        className={cn("h-10 w-10 rounded-2xl object-cover shadow-sm", markClassName)}
      />
      <span className={cn("text-xl font-bold tracking-tight", textClassName)}>
        Skill<span className="text-gradient">ent</span>
      </span>
    </span>
  )
}
