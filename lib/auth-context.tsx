"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import { doc, onSnapshot, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

export type UserRole = "doctor" | "nurse"

type AuthContextType = {
  user: User | null
  role: UserRole | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid)

        // Real-time listener for the user's Firestore document
        unsubscribeDoc = onSnapshot(
          userDocRef,
          async (docSnap) => {
            if (docSnap.exists() && docSnap.data()?.role) {
              // Driven strictly by the `role` field in `users/{uid}` Firestore document
              const firestoreRole = docSnap.data().role as UserRole
              setRole(firestoreRole)
              setLoading(false)
            } else {
              // If user document does not exist yet in Firestore, initialize it
              // default fady@clinic.com to doctor and nurse@clinic.com to nurse
              const assignedRole: UserRole =
                currentUser.email?.toLowerCase().includes("fady") ||
                currentUser.email?.toLowerCase().includes("doctor")
                  ? "doctor"
                  : "nurse"

              try {
                await setDoc(
                  userDocRef,
                  {
                    email: currentUser.email,
                    role: assignedRole,
                    createdAt: new Date().toISOString(),
                  },
                  { merge: true }
                )
                setRole(assignedRole)
              } catch (e) {
                console.error("Error creating initial user role document:", e)
                setRole(assignedRole)
              } finally {
                setLoading(false)
              }
            }
          },
          (error) => {
            console.error("Error listening to user role in Firestore:", error)
            setRole("nurse")
            setLoading(false)
          }
        )
      } else {
        if (unsubscribeDoc) {
          unsubscribeDoc()
          unsubscribeDoc = null
        }
        setRole(null)
        setLoading(false)
      }
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeDoc) unsubscribeDoc()
    }
  }, [])

  async function logout() {
    try {
      await firebaseSignOut(auth)
      setRole(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
