"use client"

import { useState } from "react"
import { Send, ArrowLeft, MoreVertical } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"
import { conversations, messages as initialMessages } from "@/lib/mock-data"

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: string
}

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [messagesList, setMessagesList] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [showConversations, setShowConversations] = useState(true)

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: String(Date.now()),
      senderId: "me",
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessagesList([...messagesList, message])
    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <aside
          className={cn(
            "w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col",
            "md:block",
            showConversations ? "block" : "hidden"
          )}
        >
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Messages</h2>
          </div>

          <ScrollArea className="flex-1">
            <div className="divide-y divide-border">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={cn(
                    "w-full flex items-start gap-3 p-4 text-left hover:bg-secondary/50 transition-colors",
                    selectedConversation.id === conversation.id && "bg-secondary"
                  )}
                  onClick={() => {
                    setSelectedConversation(conversation)
                    setShowConversations(false)
                  }}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.avatar} alt={conversation.name} />
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
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Chat Area */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-background",
            "md:block",
            showConversations ? "hidden md:flex" : "flex"
          )}
        >
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowConversations(true)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
              <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {selectedConversation.name}
              </p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-3xl mx-auto">
              {messagesList.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.senderId === "me" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5",
                      message.senderId === "me"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border rounded-bl-md"
                    )}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        message.senderId === "me"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex gap-3 max-w-3xl mx-auto">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
