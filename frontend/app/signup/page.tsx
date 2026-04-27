"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, GraduationCap, BriefcaseBusiness, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/auth-context"
import { apiUrl } from "@/lib/api"
import { useAppAlert } from "@/components/app-alert-provider"

const UNIVERSITY_NAME = "РАНХиГС"

export default function SignupPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { showAlert } = useAppAlert()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState("student")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(apiUrl("/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role: userType,
          name: `${firstName} ${lastName}`.trim(),
          university: UNIVERSITY_NAME,
          course: 1,
          description: "",
          tags: [],
          pricePerHour: 0,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        showAlert("Не удалось создать аккаунт", data.message || "Проверь введенные данные и попробуй снова.")
        setIsLoading(false)
        return
      }

      await login(data.access_token)
      router.push(userType === "tutor" ? "/dashboard" : "/marketplace")
    } catch (error) {
      console.error(error)
      showAlert("Ошибка сервера", "Сейчас не удалось завершить регистрацию. Попробуй еще раз чуть позже.")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-noise pointer-events-none" />
      <div className="absolute top-0 left-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-10 lg:flex-row lg:items-center lg:gap-10">
        <div className="hidden lg:block lg:w-1/2">
          <Badge className="mb-6 bg-card/80 text-muted-foreground border-border/60">
            <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
            Только для студентов РАНХиГС
          </Badge>
          <h1 className="max-w-xl text-5xl font-bold leading-tight">
            Учись и зарабатывай внутри{" "}
            <span className="text-gradient">Skillent</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Найди тьютора по своему предмету или создай анкету и помогай другим студентам РАНХиГС.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Для студентов</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Выбирай тьюторов, общайся в чате и оставляй честные отзывы.
              </p>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12">
                <BriefcaseBusiness className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Для тьюторов</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Создавай анкету, показывай навыки и получай новых учеников внутри кампуса.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-xl lg:w-1/2">
          <Card className="border-border/70 bg-card/90 shadow-xl shadow-primary/5 backdrop-blur">
            <CardHeader className="space-y-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-2xl font-bold">Skillent</span>
              </Link>

              <div>
                <CardTitle className="text-3xl">Создать аккаунт</CardTitle>
                <p className="mt-2 text-muted-foreground">
                  Быстрый старт для студентов и тьюторов РАНХиГС.
                </p>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Кто ты</FieldLabel>
                    <RadioGroup
                      value={userType}
                      onValueChange={setUserType}
                      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                    >
                      <Label
                        htmlFor="student"
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all ${
                          userType === "student"
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <RadioGroupItem value="student" id="student" />
                        <GraduationCap className="h-4 w-4 text-primary" />
                        <span className="font-medium">Студент</span>
                      </Label>

                      <Label
                        htmlFor="tutor"
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all ${
                          userType === "tutor"
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <RadioGroupItem value="tutor" id="tutor" />
                        <BriefcaseBusiness className="h-4 w-4 text-primary" />
                        <span className="font-medium">Тьютор</span>
                      </Label>
                    </RadioGroup>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Имя</FieldLabel>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </Field>
                    <Field>
                      <FieldLabel>Фамилия</FieldLabel>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Университет</FieldLabel>
                    <Input value={UNIVERSITY_NAME} disabled className="opacity-100" />
                  </Field>

                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      type="email"
                      placeholder="you@universitу.ru"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Пароль</FieldLabel>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Придумай надежный пароль"
                        className="pr-12"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </Field>

                  <Button type="submit" disabled={isLoading} className="h-12 w-full">
                    {isLoading ? "Создание..." : "Продолжить"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </FieldGroup>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Уже есть аккаунт?{" "}
                <Link href="/login" className="text-primary">
                  Войти
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
