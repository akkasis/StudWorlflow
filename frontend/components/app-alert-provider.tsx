"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface BaseDialogState {
  title: string
  message: string
}

interface AlertState extends BaseDialogState {
  type: "alert"
}

interface ConfirmState extends BaseDialogState {
  type: "confirm"
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  resolve: (value: boolean) => void
}

type DialogState = AlertState | ConfirmState

interface AppAlertContextValue {
  showAlert: (title: string, message: string) => void
  showConfirm: (
    title: string,
    message: string,
    options?: {
      confirmLabel?: string
      cancelLabel?: string
      destructive?: boolean
    },
  ) => Promise<boolean>
}

const AppAlertContext = createContext<AppAlertContextValue | null>(null)

export function AppAlertProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState | null>(null)

  const showAlert = (title: string, message: string) => {
    setDialogState({ type: "alert", title, message })
  }

  const showConfirm: AppAlertContextValue["showConfirm"] = (
    title,
    message,
    options,
  ) =>
    new Promise<boolean>((resolve) => {
      setDialogState({
        type: "confirm",
        title,
        message,
        confirmLabel: options?.confirmLabel,
        cancelLabel: options?.cancelLabel,
        destructive: options?.destructive,
        resolve,
      })
    })

  const closeDialog = () => {
    setDialogState((current) => {
      if (current?.type === "confirm") {
        current.resolve(false)
      }
      return null
    })
  }

  const confirmDialog = () => {
    setDialogState((current) => {
      if (current?.type === "confirm") {
        current.resolve(true)
      }
      return null
    })
  }

  const value = useMemo(
    () => ({
      showAlert,
      showConfirm,
    }),
    [],
  )

  return (
    <AppAlertContext.Provider value={value}>
      {children}

      <AlertDialog open={Boolean(dialogState)}>
        <AlertDialogContent className="rounded-3xl border-border/70 bg-card shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogState?.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line text-base leading-7">
              {dialogState?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {dialogState?.type === "confirm" ? (
              <>
                <AlertDialogCancel onClick={closeDialog} className="rounded-xl px-6">
                  {dialogState.cancelLabel || "Отмена"}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDialog}
                  className={`rounded-xl px-6 ${
                    dialogState.destructive ? "bg-destructive text-white hover:bg-destructive/90" : ""
                  }`}
                >
                  {dialogState.confirmLabel || "Подтвердить"}
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={() => setDialogState(null)} className="rounded-xl px-6">
                Окей
              </AlertDialogAction>
            )}
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
