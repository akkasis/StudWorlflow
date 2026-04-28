"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      aria-label="Переключение темы"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group relative flex h-11 w-[78px] items-center overflow-hidden rounded-full border px-1.5 shadow-sm transition-all duration-300",
        isDark
          ? "border-border/60 bg-[linear-gradient(135deg,rgba(34,40,58,0.96),rgba(18,23,34,0.96))] shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          : "border-primary/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(228,238,252,0.98))] ring-1 ring-primary/15 shadow-[0_10px_28px_rgba(121,168,214,0.18)]",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-y-1.5 left-1.5 z-0 w-8 rounded-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isDark
            ? "translate-x-9 bg-[radial-gradient(circle_at_35%_35%,rgba(198,220,255,0.98),rgba(118,142,189,0.92))] shadow-[0_0_22px_rgba(120,160,255,0.42)]"
            : "translate-x-0 bg-[radial-gradient(circle_at_35%_35%,rgba(255,248,214,1),rgba(255,195,87,0.95))] shadow-[0_0_22px_rgba(255,194,82,0.38)]",
        )}
      />

      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isDark ? "translate-x-9" : "translate-x-0",
        )}
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full">
          <Sun
            className={cn(
              "absolute h-4 w-4 text-amber-950 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isDark
                ? "scale-50 rotate-90 opacity-0"
                : "scale-100 rotate-0 opacity-100",
            )}
          />
          <Moon
            className={cn(
              "absolute h-4 w-4 text-slate-900 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isDark
                ? "scale-100 rotate-0 opacity-100"
                : "scale-50 -rotate-90 opacity-0",
            )}
          />
        </span>
      </span>
    </button>
  )
}
