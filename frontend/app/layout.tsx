import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

import { AuthProvider } from '@/context/auth-context' // 👈 добавили

const _inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'StudyBuddy - Find Student Tutors & Academic Help',
  description: 'Connect with student tutors for academic help, tutoring, and consultations. Find the right student to help you succeed.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased min-h-screen">
        
        {/* 👇 ВОТ ГЛАВНОЕ ИЗМЕНЕНИЕ */}
        <AuthProvider>
          {children}
        </AuthProvider>

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}