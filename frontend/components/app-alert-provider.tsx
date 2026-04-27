"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AlertState {
  title: string
  message: string
}

interface AppAlertContextValue {
  showAlert: (title: string, message: string) => void
}

const AppAlertContext = createContext<AppAlertContextValue | null>(null)

export function AppAlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState | null>(null)

  const value = useMemo(
    () => ({
      showAlert: (title: string, message: string) => {
        setAlertState({ title, message })
      },
    }),
    [],
  )

  return (
    <AppAlertContext.Provider value={value}>
      {children}

      <AlertDialog open={Boolean(alertState)}>
        <AlertDialogContent className="rounded-3xl border-border/70 bg-card shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{alertState?.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line text-base leading-7">
              {alertState?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertState(null)} className="rounded-xl px-6">
              Окей
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppAlertContext.Provider>
  )
}

export function useAppAlert() {
  const context = useContext(AppAlertContext)

  if (!context) {
    throw new Error("useAppAlert must be used inside AppAlertProvider")
  }

  return context
}
