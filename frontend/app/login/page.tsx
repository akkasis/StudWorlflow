"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, GraduationCap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/context/auth-context"
import { apiUrl } from "@/lib/api"
import { useAppAlert } from "@/components/app-alert-provider"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { showAlert } = useAppAlert()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        showAlert("Не удалось войти", data?.message || "Проверь email и пароль, а затем попробуй снова.")
        setIsLoading(false)
        return
      }

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">
              Skill<span className="text-gradient">ent</span>
            </span>
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

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? "Вход..." : "Войти"}
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

      <div className="hidden lg:flex flex-1 items-center justify-center bg-card/50">
        <div className="text-center px-12">
          <h2 className="text-4xl font-bold">
            Найди подходящего тьютора
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Общайся, договаривайся о занятиях и двигайся к результату быстрее.
          </p>
        </div>
      </div>
    </div>
  )
}
