"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SiteLogo } from "@/components/site-logo"
import { apiUrl } from "@/lib/api"
import { useAppAlert } from "@/components/app-alert-provider"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { showAlert } = useAppAlert()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cooldown > 0) {
      showAlert("Подожди немного", `Повторно отправить письмо можно через ${cooldown} сек.`)
      return
    }
    setIsSubmitting(true)

    try {
      const res = await fetch(apiUrl("/auth/forgot-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (data?.retryAfterSeconds) {
          setCooldown(Number(data.retryAfterSeconds))
        }
        showAlert("Не удалось отправить письмо", data?.message || "Проверь email и попробуй снова.")
        return
      }

      setCooldown(60)
      showAlert("Письмо отправлено", data?.message || "Если аккаунт существует, мы уже отправили письмо для сброса пароля.")
      router.push(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch (error) {
      console.error(error)
      showAlert("Ошибка сервера", "Сейчас не удалось отправить письмо. Попробуй позже.")
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
              <CardTitle className="text-3xl">Восстановление пароля</CardTitle>
              <p className="mt-2 text-muted-foreground">
                Укажи email, и мы отправим ссылку для сброса пароля.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
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

                <Button type="submit" className="h-12 w-full" disabled={isSubmitting || cooldown > 0}>
                  {isSubmitting ? "Отправляем..." : cooldown > 0 ? `Повтор через ${cooldown} сек` : "Отправить ссылку и код"}
                  <KeyRound className="ml-2 h-4 w-4" />
                </Button>
              </FieldGroup>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Вспомнил пароль?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Вернуться ко входу
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
