"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert("Неверный email или пароль")
        setIsLoading(false)
        return
      }

      // 👉 сохраняем токен
      localStorage.setItem("token", data.access_token)

      setIsLoading(false)

      // 👉 редирект после логина
      router.push("/marketplace")

    } catch (err) {
      alert("Ошибка сервера")
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
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">
              Peer<span className="text-gradient">Hub</span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">
            Log in to continue your journey
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
                    placeholder="Enter your password"
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
                  Remember me
                </label>
              </div>

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Log in"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

            </FieldGroup>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary">
              Sign up
            </Link>
          </p>

        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center bg-card/50">
        <div className="text-center px-12">
          <h2 className="text-4xl font-bold">
            Connect with the best peer tutors
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of students helping each other succeed.
          </p>
        </div>
      </div>
    </div>
  )
}