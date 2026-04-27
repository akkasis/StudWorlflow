"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"

export function AddReview({ profileId }: { profileId: string }) {
  const [text, setText] = useState("")
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      alert("Сначала войди в аккаунт")
      return
    }

    setLoading(true)

    await fetch("http://localhost:3001/reviews", {
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

    setLoading(false)
    setText("")
    setRating(5)

    location.reload()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave a review</CardTitle>
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
          placeholder="Write your experience..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Button */}
        <Button onClick={submit} disabled={loading} className="w-full">
          {loading ? "Sending..." : "Submit review"}
        </Button>

      </CardContent>
    </Card>
  )
}