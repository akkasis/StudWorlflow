"use client"

import { Moon, Sun } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const isDark = theme === "dark"

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-2.5 py-1.5 shadow-sm transition-colors",
        isDark
          ? "border border-border/60 bg-card/70"
          : "border border-primary/30 bg-white/95 ring-1 ring-primary/15",
      )}
    >
      <Sun className={`h-4 w-4 ${isDark ? "text-muted-foreground" : "text-primary"}`} />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Переключение темы"
      />
      <Moon className={`h-4 w-4 ${isDark ? "text-primary" : "text-muted-foreground"}`} />
    </div>
  )
}
