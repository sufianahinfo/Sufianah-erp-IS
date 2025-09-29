"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export function DevNotice() {
  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
      <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        <strong>Development Mode:</strong> Authentication is currently disabled for easier development. 
        You can access all features without logging in. This will be re-enabled when the project setup is complete.
      </AlertDescription>
    </Alert>
  )
}
