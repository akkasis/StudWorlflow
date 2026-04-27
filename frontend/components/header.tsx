"use client"

import Link from "next/link"
import { Menu, X, Sparkles, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useAuth } from "@/context/auth-context"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { user, logout, loading } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">
              Peer<span className="text-gradient">Hub</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/marketplace" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Explore
            </Link>
            <Link href="/dashboard" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/messages" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Messages
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">

            {loading ? null : user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>

                <Link href="/signup">
                  <Button size="sm" className="glow-primary">
                    Get Started
                  </Button>
                </Link>
              </>
            )}

          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 glass">
          <nav className="flex flex-col p-4 gap-2">

            <Link href="/marketplace">Explore</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/messages">Messages</Link>

            <div className="h-px bg-border my-2" />

            {user ? (
              <Button onClick={logout}>Logout</Button>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button className="glow-primary">Get Started</Button>
                </Link>
              </>
            )}

          </nav>
        </div>
      )}
    </header>
  )
}