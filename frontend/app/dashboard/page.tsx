"use client"

import { useState, useEffect } from "react"
import { Plus, X, Save } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Header } from "@/components/header"
import { Protected } from "@/components/protected"

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [newTag, setNewTag] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")

    fetch("http://localhost:3001/profiles/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setProfile(data))
  }, [])

  if (!profile) {
    return <div className="p-10">Loading...</div>
  }

  const isTutor = profile.role === "tutor"

  const handleAddTag = () => {
    if (newTag && !profile.tags?.includes(newTag)) {
      setProfile({
        ...profile,
        tags: [...(profile.tags || []), newTag],
      })
      setNewTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setProfile({
      ...profile,
      tags: profile.tags.filter((t: string) => t !== tag),
    })
  }

  // 🔥 ГЛАВНЫЙ ФИКС
  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token")
    setIsSaving(true)

    try {
      // ✅ формируем payload ПРАВИЛЬНО
      const payload: any = {
        university: profile.university,
        course: Number(profile.course),
      }

      // 🔥 только для tutor
      if (isTutor) {
        payload.description = profile.description
        payload.tags = profile.tags
        payload.pricePerHour = profile.pricePerHour
      }

      const res = await fetch("http://localhost:3001/profiles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || "Error saving profile")
        return
      }

      alert("Profile saved successfully ✅")

    } catch (e) {
      console.error(e)
      alert("Something went wrong ❌")
    }

    setIsSaving(false)
  }

  const initials = profile.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Protected>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>

            <CardContent>
              <FieldGroup>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar || ""} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </div>

                {/* ❌ NAME УБРАЛИ (он с регистрации) */}

                {/* UNIVERSITY */}
                <Field>
                  <FieldLabel>University</FieldLabel>
                  <Input
                    value={profile.university || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, university: e.target.value })
                    }
                  />
                </Field>

                {/* COURSE */}
                <Field>
                  <FieldLabel>Course</FieldLabel>
                  <Input
                    value={profile.course || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, course: e.target.value })
                    }
                  />
                </Field>

                {/* 🔥 ONLY TUTOR */}
                {isTutor && (
                  <>
                    <Field>
                      <FieldLabel>Description</FieldLabel>
                      <Textarea
                        value={profile.description || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            description: e.target.value,
                          })
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Tags</FieldLabel>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {(profile.tags || []).map((tag: string) => (
                          <Badge key={tag}>
                            {tag}
                            <X
                              className="ml-2 h-3 w-3 cursor-pointer"
                              onClick={() => handleRemoveTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                        />
                        <Button onClick={handleAddTag}>
                          <Plus />
                        </Button>
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel>Price</FieldLabel>
                      <Input
                        type="number"
                        value={profile.pricePerHour || 0}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            pricePerHour: Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                  </>
                )}

                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>

              </FieldGroup>
            </CardContent>
          </Card>
        </main>
      </div>
    </Protected>
  )
}