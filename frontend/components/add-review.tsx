"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { apiUrl } from "@/lib/api"
import { useAppAlert } from "@/components/app-alert-provider"

export function AddReview({
  profileId,
  ownerUserId,
  reviews = [],
}: {
  profileId: string
  ownerUserId?: string
  reviews?: Array<{
    id: number
    userId: number
    rating: number
    text: string
  }>
}) {
  const { user } = useAuth()
  const { showAlert } = useAppAlert()
  const existingReview = reviews.find((review) => review.userId === Number(user?.id))
  const [text, setText] = useState(existingReview?.text ?? "")
  const [rating, setRating] = useState(existingReview?.rating ?? 5)
  const [loading, setLoading] = useState(false)

  if (user?.role === "tutor" || (ownerUserId && user?.id === ownerUserId)) {
    return null
  }

  const submit = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      showAlert("Нужен вход", "Сначала войди в аккаунт, чтобы оставить отзыв.")
      return
    }

    setLoading(true)

    try {
      const isEditing = Boolean(existingReview)
      const res = await fetch(
        apiUrl(isEditing ? `/reviews/${existingReview?.id}` : "/reviews"),
        {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profileId: Number(profileId),
          rating,
          text,
        }),
      },
      )

      const data = await res.json()

      if (!res.ok) {
        showAlert("Не удалось отправить отзыв", data.message || "Попробуй снова немного позже.")
        return
      }

      setText("")
      setRating(5)
      location.reload()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingReview ? "Редактировать отзыв" : "Оставить отзыв"}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Rating */}
        <div className="flex gap-1">
          {[1,2,3,4,5].map((r) => (
            <Star
              key={r}
              onClick={() => setRating(r)}
              className={`cursor-pointer ${
                r <= rating ? "fill-primary text-primary" : "text-muted"
              }`}
            />
          ))}
        </div>

        {/* Text */}
        <Textarea
          placeholder="Расскажи, как прошло занятие..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Button */}
        <Button onClick={submit} disabled={loading} className="w-full">
          {loading ? "Сохранение..." : existingReview ? "Сохранить изменения" : "Отправить отзыв"}
        </Button>

      </CardContent>
    </Card>
  )
}
