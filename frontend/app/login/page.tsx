"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { SiteLogo } from "@/components/site-logo"
import { useAuth } from "@/context/auth-context"
import { apiUrl } from "@/lib/api"
import { useAppAlert } from "@/components/app-alert-provider"

export default function LoginPage() {
  const LOGIN_FAIL_WINDOW_MS = 15_000
  const LOGIN_FAIL_LIMIT = 5
  const LOGIN_COOLDOWN_MS = 15_000
  const FAILURES_STORAGE_KEY = "skillent-login-failures"
  const COOLDOWN_STORAGE_KEY = "skillent-login-cooldown-until"

  const router = useRouter()
  const { login } = useAuth()
  const { showAlert } = useAppAlert()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const storedCooldown = Number(localStorage.getItem(COOLDOWN_STORAGE_KEY) || 0)

    if (storedCooldown > Date.now()) {
      setCooldownUntil(storedCooldown)
      return
    }

    localStorage.removeItem(COOLDOWN_STORAGE_KEY)
  }, [])

  useEffect(() => {
    if (!cooldownUntil) return

    const interval = window.setInterval(() => {
      setNow(Date.now())
      const storedCooldown = Number(localStorage.getItem(COOLDOWN_STORAGE_KEY) || 0)

      if (!storedCooldown || storedCooldown <= Date.now()) {
        localStorage.removeItem(COOLDOWN_STORAGE_KEY)
        setCooldownUntil(0)
        setNow(Date.now())
        return
      }

      setCooldownUntil(storedCooldown)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [cooldownUntil])

  const cooldownSeconds = useMemo(
    () => Math.max(0, Math.ceil((cooldownUntil - now) / 1000)),
    [cooldownUntil, now],
  )
  const isCooldownActive = cooldownUntil > now

  const registerFailedAttempt = () => {
    const now = Date.now()
    const storedAttempts = JSON.parse(localStorage.getItem(FAILURES_STORAGE_KEY) || "[]") as number[]
    const recentAttempts = storedAttempts.filter((value) => now - value < LOGIN_FAIL_WINDOW_MS)
    const nextAttempts = [...recentAttempts, now]

    if (nextAttempts.length >= LOGIN_FAIL_LIMIT) {
      const nextCooldownUntil = now + LOGIN_COOLDOWN_MS
      localStorage.setItem(COOLDOWN_STORAGE_KEY, String(nextCooldownUntil))
      localStorage.removeItem(FAILURES_STORAGE_KEY)
      setCooldownUntil(nextCooldownUntil)
      showAlert(
        "Воу-воу, сбавь скорость",
        "Слишком много попыток входа подряд. Подожди 15 секунд или воспользуйся восстановлением пароля.",
      )
      return
    }

    localStorage.setItem(FAILURES_STORAGE_KEY, JSON.stringify(nextAttempts))
  }

  const clearFailedAttempts = () => {
    localStorage.removeItem(FAILURES_STORAGE_KEY)
    localStorage.removeItem(COOLDOWN_STORAGE_KEY)
    setCooldownUntil(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isCooldownActive) {
      showAlert(
        "Немного подожди",
        "Сейчас вход временно ограничен. Подожди пару секунд или воспользуйся сбросом пароля.",
      )
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        registerFailedAttempt()
        showAlert("Не удалось войти", data?.message || "Проверь email и пароль, а затем попробуй снова.")
        setIsLoading(false)
        return
      }

      clearFailedAttempts()
      const user = await login(data.access_token)

      setIsLoading(false)

      if (user?.role === "admin" || user?.role === "moderator") {
        router.push("/admin")
      } else {
        router.push(user?.role === "tutor" ? "/dashboard" : "/marketplace")
      }

    } catch (err) {
      showAlert("Ошибка сервера", "Сейчас не удалось выполнить вход. Попробуй еще раз чуть позже.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative">
      <div className="fixed inset-0 bg-noise pointer-events-none" />

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        <div className="w-full max-w-md">

          <Link href="/" className="flex items-center gap-3 mb-12">
            <SiteLogo markClassName="rounded-xl" textClassName="text-2xl" />
          </Link>

          <h1 className="text-3xl font-bold">С возвращением</h1>
          <p className="mt-2 text-muted-foreground">
            Войди, чтобы продолжить работу
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <FieldGroup>

              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                  disabled={isCooldownActive}
                />
              </Field>

              <Field>
                <FieldLabel>Password</FieldLabel>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12"
                    disabled={isCooldownActive}
                  />

                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </Field>

              <div className="flex items-center gap-3">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm">
                  Запомнить меня
                </label>
              </div>

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Забыли пароль?
                </Link>
              </div>

              {isCooldownActive ? (
                <div className="rounded-2xl border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <p className="font-medium text-amber-800 dark:text-amber-200">Воу-воу, сбавь скорость.</p>
                  <p className="mt-1 text-amber-700/90 dark:text-amber-100/80">
                    Слишком много попыток входа. Попробуй снова через {cooldownSeconds} сек. Если пароль забыт, его можно сбросить.
                  </p>
                  <Link href="/forgot-password" className="mt-3 inline-flex text-primary hover:underline">
                    Сбросить пароль
                  </Link>
                </div>
              ) : null}

              <Button type="submit" className="w-full h-12" disabled={isLoading || isCooldownActive}>
                {isCooldownActive ? `Подожди ${cooldownSeconds} сек` : isLoading ? "Вход..." : "Войти"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

            </FieldGroup>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Нет аккаунта?{" "}
            <Link href="/signup" className="text-primary">
              Зарегистрироваться
            </Link>
          </p>

        </div>
      </div>

      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-card/50 lg:flex">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: "url('/login-image.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/82 via-background/54 to-background/76" />
        <div className="relative z-10 text-center px-12">
          <h2 className="text-4xl font-bold">
            Найди подходящего стутьютора
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Общайся, договаривайся о занятиях и двигайся к результату быстрее.
          </p>
        </div>
      </div>
    </div>
  )
}
