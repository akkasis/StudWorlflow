"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-2.5 py-1.5">
        <Sun className="h-4 w-4 text-primary" />
        <Switch checked={false} disabled aria-label="Theme toggle" />
        <Moon className="h-4 w-4 text-muted-foreground" />
      </div>
    )
  }

  const isDark = theme === "dark"

  return (
    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-2.5 py-1.5 shadow-sm">
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
