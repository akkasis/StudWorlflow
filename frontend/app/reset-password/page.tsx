"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SiteLogo } from "@/components/site-logo"
import { apiUrl } from "@/lib/api"
import { useAppAlert } from "@/components/app-alert-provider"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showAlert } = useAppAlert()
  const [email, setEmail] = useState(searchParams.get("email") || "")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const token = searchParams.get("token") || ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token && (!email || code.length !== 6)) {
      showAlert("Нужны данные из письма", "Введи email и код из письма или открой ссылку для сброса.")
      return
    }

    if (password.length < 6) {
      showAlert("Слишком короткий пароль", "Пароль должен быть не короче 6 символов.")
      return
    }

    if (password !== confirmPassword) {
      showAlert("Пароли не совпадают", "Проверь оба поля и попробуй снова.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(apiUrl("/auth/reset-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(token ? { token, password } : { email, code, password }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        showAlert("Не удалось обновить пароль", data?.message || "Попробуй запросить новую ссылку.")
        return
      }

      showAlert("Пароль обновлен", data?.message || "Теперь можно войти с новым паролем.")
      router.push("/login")
    } catch (error) {
      console.error(error)
      showAlert("Ошибка сервера", "Сейчас не удалось обновить пароль. Попробуй позже.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex max-w-lg justify-center">
        <Card className="w-full border-border/70 bg-card/95 shadow-xl">
          <CardHeader className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <SiteLogo markClassName="h-11 w-11" textClassName="text-2xl" />
            </Link>
            <div>
              <CardTitle className="text-3xl">Новый пароль</CardTitle>
              <p className="mt-2 text-muted-foreground">
                Придумай новый пароль для своего аккаунта.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {!token ? (
                  <>
                    <Field>
                      <FieldLabel>Email</FieldLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@university.edu"
                        maxLength={120}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Код из письма</FieldLabel>
                      <Input
                        value={code}
                        onChange={(event) => setCode(event.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                        placeholder="6 цифр"
                        inputMode="numeric"
                        maxLength={6}
                        required
                      />
                    </Field>
                  </>
                ) : null}

                <Field>
                  <FieldLabel>Новый пароль</FieldLabel>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Минимум 6 символов"
                      maxLength={120}
                      required
                      className="pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Повтори пароль</FieldLabel>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Еще раз введи пароль"
                    maxLength={120}
                    required
                  />
                </Field>

                <Button type="submit" className="h-12 w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Сохраняем..." : "Сохранить пароль"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background px-4 py-12">
          <div className="mx-auto flex max-w-lg justify-center">
            <Card className="w-full border-border/70 bg-card/95 shadow-xl">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <SiteLogo markClassName="h-11 w-11" textClassName="text-2xl" />
                </div>
                <div>
                  <CardTitle className="text-3xl">Новый пароль</CardTitle>
                  <p className="mt-2 text-muted-foreground">Подготавливаем форму сброса пароля...</p>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
