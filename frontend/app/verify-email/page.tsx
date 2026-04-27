"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, GraduationCap, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { apiUrl } from "@/lib/api"
import { useAppAlert } from "@/components/app-alert-provider"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const { showAlert } = useAppAlert()
  const [email, setEmail] = useState(searchParams.get("email") || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(Boolean(searchParams.get("token")))
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) return

    const verify = async () => {
      try {
        const res = await fetch(apiUrl("/auth/verify-email"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          showAlert("Не удалось подтвердить почту", data?.message || "Попробуй запросить письмо еще раз.")
          return
        }

        setVerified(true)
      } catch (error) {
        console.error(error)
        showAlert("Ошибка сервера", "Сейчас не удалось подтвердить почту. Попробуй позже.")
      } finally {
        setIsVerifying(false)
      }
    }

    void verify()
  }, [searchParams, showAlert])

  const resendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch(apiUrl("/auth/resend-verification"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        showAlert("Не удалось отправить письмо", data?.message || "Проверь email и попробуй еще раз.")
        return
      }

      showAlert("Письмо отправлено", data?.message || "Проверь почту и открой письмо для подтверждения.")
    } catch (error) {
      console.error(error)
      showAlert("Ошибка сервера", "Не удалось отправить письмо. Попробуй позже.")
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
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">Skillent</span>
            </Link>
            <div>
              <CardTitle className="text-3xl">Подтверждение почты</CardTitle>
              <p className="mt-2 text-muted-foreground">
                {verified
                  ? "Почта подтверждена. Теперь можно войти в аккаунт."
                  : "Мы поможем завершить регистрацию и подтвердить email."}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {isVerifying ? (
              <div className="rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                Проверяем ссылку подтверждения...
              </div>
            ) : verified ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                  <div className="flex items-center gap-3">
                    <MailCheck className="h-5 w-5" />
                    <span className="font-medium">Почта успешно подтверждена</span>
                  </div>
                </div>
                <Button asChild className="h-12 w-full">
                  <Link href="/login">
                    Перейти ко входу
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={resendVerification}>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@university.edu"
                      required
                    />
                  </Field>

                  <Button type="submit" className="h-12 w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Отправляем..." : "Отправить письмо еще раз"}
                  </Button>
                </FieldGroup>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background px-4 py-12">
          <div className="mx-auto flex max-w-lg justify-center">
            <Card className="w-full border-border/70 bg-card/95 shadow-xl">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary">
                    <GraduationCap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-2xl font-bold">Skillent</span>
                </div>
                <div>
                  <CardTitle className="text-3xl">Подтверждение почты</CardTitle>
                  <p className="mt-2 text-muted-foreground">Проверяем ссылку подтверждения...</p>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
