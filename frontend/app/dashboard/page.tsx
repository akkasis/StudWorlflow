"use client"

import { useState } from "react"
import Link from "next/link"
import {
  User,
  Settings,
  MessageSquare,
  Star,
  DollarSign,
  TrendingUp,
  Calendar,
  Plus,
  X,
  Save,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Header } from "@/components/header"
import { StarRating } from "@/components/star-rating"
import { cn } from "@/lib/utils"
import { conversations } from "@/lib/mock-data"

const initialProfile = {
  name: "Alex Johnson",
  email: "alex.johnson@mit.edu",
  university: "MIT",
  course: "Computer Science",
  description:
    "Senior CS student specializing in algorithms and machine learning. I can help you understand complex concepts and ace your coding interviews.",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  tags: ["programming", "python", "algorithms", "machine-learning"],
  pricePerHour: 45,
}

const stats = [
  { label: "Total Sessions", value: "47", icon: Calendar, change: "+5 this month" },
  { label: "Total Earnings", value: "$2,115", icon: DollarSign, change: "+$320 this month" },
  { label: "Average Rating", value: "4.9", icon: Star, change: "from 47 reviews" },
  { label: "Profile Views", value: "234", icon: TrendingUp, change: "+12% this week" },
]

export default function DashboardPage() {
  const [profile, setProfile] = useState(initialProfile)
  const [newTag, setNewTag] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleAddTag = () => {
    if (newTag.trim() && !profile.tags.includes(newTag.trim().toLowerCase())) {
      setProfile({
        ...profile,
        tags: [...profile.tags, newTag.trim().toLowerCase()],
      })
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setProfile({
      ...profile,
      tags: profile.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="mt-1 text-muted-foreground">
                Manage your profile and track your progress
              </p>
            </div>
            <Link href={`/profile/1`}>
              <Button variant="outline">View Public Profile</Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.change}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Profile Form */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                    <CardDescription>
                      Update your profile information visible to students
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      {/* Avatar */}
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={profile.avatar} alt={profile.name} />
                          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Button variant="outline" size="sm">
                            Change Photo
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG or GIF. Max 2MB.
                          </p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="name">Full Name</FieldLabel>
                          <Input
                            id="name"
                            value={profile.name}
                            onChange={(e) =>
                              setProfile({ ...profile, name: e.target.value })
                            }
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="email">Email</FieldLabel>
                          <Input
                            id="email"
                            type="email"
                            value={profile.email}
                            onChange={(e) =>
                              setProfile({ ...profile, email: e.target.value })
                            }
                          />
                        </Field>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="university">University</FieldLabel>
                          <Input
                            id="university"
                            value={profile.university}
                            onChange={(e) =>
                              setProfile({ ...profile, university: e.target.value })
                            }
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="course">Course / Major</FieldLabel>
                          <Input
                            id="course"
                            value={profile.course}
                            onChange={(e) =>
                              setProfile({ ...profile, course: e.target.value })
                            }
                          />
                        </Field>
                      </div>

                      <Field>
                        <FieldLabel htmlFor="description">About Me</FieldLabel>
                        <Textarea
                          id="description"
                          rows={4}
                          value={profile.description}
                          onChange={(e) =>
                            setProfile({ ...profile, description: e.target.value })
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Skills & Tags</FieldLabel>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {profile.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="cursor-pointer"
                            >
                              #{tag}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1.5 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a tag..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleAddTag()
                              }
                            }}
                          />
                          <Button variant="outline" onClick={handleAddTag}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </Field>

                      <Button onClick={handleSaveProfile} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </FieldGroup>
                  </CardContent>
                </Card>

                {/* Pricing Card */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pricing</CardTitle>
                      <CardDescription>
                        Set your hourly rate for tutoring sessions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Field>
                        <FieldLabel htmlFor="price">Hourly Rate ($)</FieldLabel>
                        <Input
                          id="price"
                          type="number"
                          min="1"
                          value={profile.pricePerHour}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              pricePerHour: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </Field>
                      <div className="mt-4 p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Package pricing (5 hours) with 10% discount:
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          ${Math.round(profile.pricePerHour * 5 * 0.9)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Your Ratings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold text-foreground">4.9</div>
                        <div>
                          <StarRating rating={4.9} size="lg" />
                          <p className="text-sm text-muted-foreground mt-1">
                            Based on 47 reviews
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Star className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Pro Status</p>
                          <p className="text-sm text-muted-foreground">Active</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your profile is featured in search results and you have access to premium features.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Messages</CardTitle>
                      <CardDescription>
                        Your conversations with students
                      </CardDescription>
                    </div>
                    <Link href="/messages">
                      <Button>View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border">
                    {conversations.map((conversation) => (
                      <Link
                        key={conversation.id}
                        href="/messages"
                        className="flex items-center gap-4 py-4 hover:bg-secondary/50 -mx-6 px-6 transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={conversation.avatar}
                              alt={conversation.name}
                            />
                            <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                          </Avatar>
                          {conversation.unread && (
                            <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-primary rounded-full border-2 border-card" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p
                              className={cn(
                                "font-medium text-foreground truncate",
                                conversation.unread && "font-semibold"
                              )}
                            >
                              {conversation.name}
                            </p>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {conversation.timestamp}
                            </span>
                          </div>
                          <p
                            className={cn(
                              "text-sm truncate mt-0.5",
                              conversation.unread
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                      Configure how you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: "New messages", description: "Get notified when you receive a new message" },
                        { label: "New bookings", description: "Get notified when someone books a session" },
                        { label: "Reviews", description: "Get notified when you receive a new review" },
                        { label: "Marketing emails", description: "Receive tips and updates from StudyBuddy" },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{item.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            On
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>
                      Manage your account settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        Change Password
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Connected Accounts
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Download My Data
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-destructive hover:text-destructive"
                      >
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
