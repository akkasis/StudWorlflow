"use client"

import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  role: "student" | "tutor" | "moderator" | "admin"
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string) => Promise<User | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => null,
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      setLoading(false)
      return
    }

    fetch("http://localhost:3001/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unauthorized")
        }

        return res.json()
      })
      .then((data) => {
        setUser(data)
        setLoading(false)
      })
      .catch(() => {
        localStorage.removeItem("token")
        setUser(null)
        setLoading(false)
      })
  }, [])

  const login = async (token: string) => {
    localStorage.setItem("token", token)
    setLoading(true)

    try {
      const res = await fetch("http://localhost:3001/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error("Unauthorized")
      }

      const data = await res.json()
      setUser(data)
      return data
    } catch {
      localStorage.removeItem("token")
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
