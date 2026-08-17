"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { LogOut, Plus, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PatientTable } from "@/components/patient-table"
import { PatientFormDialog } from "@/components/patient-form-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  type Patient,
  subscribePatients,
  savePatientToFirestore,
  deletePatientFromFirestore,
} from "@/lib/patients"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import Link from "next/link"

export function NurseDashboard() {
  // 1. Call all React Hooks at the very top level before any conditional returns
  const { user, role, loading: authLoading, logout } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)

  // Subscribe to real-time Firestore patient updates
  useEffect(() => {
    if (!user) return

    setLoadingPatients(true)
    const unsubscribe = subscribePatients((updatedPatients) => {
      setPatients(updatedPatients)
      setLoadingPatients(false)
    })

    return () => unsubscribe()
  }, [user])

  const filteredPatients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return patients
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(term) ||
        p.phones.some((ph) => ph.toLowerCase().includes(term)),
    )
  }, [patients, searchTerm])

  // 2. Early returns AFTER all hooks have been invoked
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  // 3. Event handlers and main render logic
  async function handleSavePatient(values: Omit<Patient, "id">, id?: string) {
    await savePatientToFirestore(values, id)
    closeDialog()
  }

  async function handleDeletePatient(patient: Patient) {
    await deletePatientFromFirestore(patient.id)
  }

  function handleEditPatient(patient: Patient) {
    setEditingPatient(patient)
    setDialogOpen(true)
  }

  function handleSearch(term: string) {
    setSearchTerm(term)
  }

  function openAddDialog() {
    setEditingPatient(null)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingPatient(null)
  }

  async function handleLogout() {
    await logout()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          {/* Top-Left: Logo, title, and ThemeToggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="ENT Clinic Logo"
                width={90}
                height={36}
                priority
                className="h-9 w-auto object-contain mix-blend-multiply dark:bg-white/90 dark:p-1 dark:rounded-lg dark:mix-blend-normal"
              />
              <div>
                <h1 className="text-base font-semibold leading-tight text-foreground sm:text-lg">
                  ENT Clinic
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground capitalize">
                    {role ? `${role} View` : "Nurse View"}
                  </span>
                  <span>•</span>
                  <span className="truncate max-w-[150px] sm:max-w-[250px]">{user.email}</span>
                </div>
              </div>
            </div>
            <div className="border-l border-border pl-3 hidden sm:block">
              <ThemeToggle />
            </div>
          </div>

          {/* Top-Right: Role-specific controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="sm:hidden">
              <ThemeToggle />
            </div>
            {role === "doctor" && (
              <Link href="/doctor">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  Doctor View
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Toolbar: search + add */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search patients by name or phone..."
              aria-label="Search patients by name or phone"
              className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <Button onClick={openAddDialog} className="shrink-0">
            <Plus className="size-4" />
            Add New Patient
          </Button>
        </div>

        {/* Count */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredPatients.length} patient{filteredPatients.length === 1 ? "" : "s"}
            {searchTerm ? " found" : ""}
          </p>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Firestore Connected
          </span>
        </div>

        {/* Patient list */}
        {loadingPatients ? (
          <div className="flex h-64 w-full items-center justify-center rounded-xl border border-border bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading patients from Firestore...</span>
          </div>
        ) : (
          <PatientTable
            patients={filteredPatients}
            onEdit={handleEditPatient}
            onDelete={handleDeletePatient}
          />
        )}
      </main>

      <PatientFormDialog
        open={dialogOpen}
        patient={editingPatient}
        onClose={closeDialog}
        onSubmit={handleSavePatient}
      />
    </div>
  )
}
