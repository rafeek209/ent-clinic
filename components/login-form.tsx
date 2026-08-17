"use client"

import { useState } from "react"
import Image from "next/image"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { Lock, Mail, UserCheck, AlertCircle, Loader2 } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!email || !password) {
      setError("Please fill in all fields.")
      return
    }

    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Initialize Firestore user profile doc if email indicates doctor/nurse role
      if (email.toLowerCase().includes("fady") || email.toLowerCase().includes("doctor")) {
        await setDoc(
          doc(db, "users", user.uid),
          {
            email: user.email,
            role: "doctor",
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      } else if (email.toLowerCase().includes("nurse")) {
        await setDoc(
          doc(db, "users", user.uid),
          {
            email: user.email,
            role: "nurse",
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      }

      setSuccessMsg("Logged in successfully!")
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      console.error("Auth error:", firebaseError)

      switch (firebaseError.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Invalid email or password.")
          break
        case "auth/invalid-email":
          setError("Please provide a valid email address.")
          break
        default:
          setError(firebaseError.message || "Authentication failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute right-4 top-4 sm:right-8 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center flex flex-col items-center">
          <div className="flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="ENT Clinic Logo"
              width={160}
              height={80}
              priority
              className="h-20 w-auto object-contain mix-blend-multiply dark:bg-white/90 dark:p-2 dark:rounded-xl dark:mix-blend-normal"
            />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            ENT Clinic
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to access your clinic dashboard
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <UserCheck className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@clinic.com"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full py-2.5 font-semibold mt-2">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
