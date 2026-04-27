"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export function AddReview({
  profileId,
  ownerUserId,
}: {
  profileId: string
  ownerUserId?: string
}) {
  const { user } = useAuth()
  const [text, setText] = useState("")
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(false)

  if (user?.role === "tutor" || (ownerUserId && user?.id === ownerUserId)) {
    return null
  }

  const submit = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      alert("Сначала войди в аккаунт")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("http://localhost:3001/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profileId: Number(profileId),
          rating,
          text,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || "Не удалось отправить отзыв")
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
        <CardTitle>Оставить отзыв</CardTitle>
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
          {loading ? "Отправка..." : "Отправить отзыв"}
        </Button>

      </CardContent>
    </Card>
  )
}
