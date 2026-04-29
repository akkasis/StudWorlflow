import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

import { AuthProvider } from '@/context/auth-context' // 👈 добавили
import { ThemeProvider } from '@/components/theme-provider'
import { AppAlertProvider } from '@/components/app-alert-provider'
import { Toaster } from '@/components/ui/toaster'
import { SiteNotifications } from '@/components/site-notifications'

const _inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'Skillent',
  description: 'Skillent — поиск стутьюторов, отзывы, сообщения и личный кабинет для студентов.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon.png',
        type: 'image/png',
      },
    ],
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className="bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        <ThemeProvider>
          <AppAlertProvider>
            <AuthProvider>
              <SiteNotifications />
              {children}
              <Toaster />
            </AuthProvider>
          </AppAlertProvider>
        </ThemeProvider>

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
