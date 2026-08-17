"use client"

import { useAuth } from "@/lib/auth-context"
import { NurseDashboard } from "@/components/nurse-dashboard"
import { DoctorDashboard } from "@/components/doctor-dashboard"
import { LoginForm } from "@/components/login-form"
import { Loader2 } from "lucide-react"

export default function Page() {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  // Automatically land on Doctor View if Firestore role === "doctor", otherwise Nurse View
  if (role === "doctor") {
    return <DoctorDashboard />
  }

  return <NurseDashboard />
}
