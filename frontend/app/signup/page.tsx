"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const router = useRouter()

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
      // 🔥 1. регистрация
      const res = await fetch("http://localhost:3001/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role: userType,
          name: `${firstName} ${lastName}`, // 🔥 ВАЖНО
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || "Error")
        setIsLoading(false)
        return
      }

      const token = data.access_token
      localStorage.setItem("token", token)

      // 🔥 2. СОЗДАЕМ ПРОФИЛЬ СРАЗУ
      await fetch("http://localhost:3001/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`,
          university: "",
          course: 1,
          tags: [],
          description: "",
          pricePerHour: 0,
        }),
      })

      // 🔥 3. редирект
      if (userType === "tutor") {
        router.push("/dashboard")
      } else {
        router.push("/marketplace")
      }

    } catch (e) {
      console.error(e)
      alert("Something went wrong")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">

        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl font-bold">StudyBuddy</span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>

                {/* ROLE */}
                <Field>
                  <FieldLabel>I want to</FieldLabel>
                  <RadioGroup value={userType} onValueChange={setUserType}>
                    <div>
                      <RadioGroupItem value="student" id="student" />
                      <Label htmlFor="student">Find Tutor</Label>
                    </div>
                    <div>
                      <RadioGroupItem value="tutor" id="tutor" />
                      <Label htmlFor="tutor">Become Tutor</Label>
                    </div>
                  </RadioGroup>
                </Field>

                {/* NAME */}
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>First name</FieldLabel>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel>Last name</FieldLabel>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </Field>
                </div>

                {/* EMAIL */}
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>

                {/* PASSWORD */}
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </Field>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create account"}
                </Button>

              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}