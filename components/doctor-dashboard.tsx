"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Search, LogOut, UserRound, Pencil, Loader2, ShieldAlert, Calendar as CalendarIcon, CheckCircle2, FileText, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MedicalTabs } from "@/components/doctor/medical-tabs"
import { PatientFormDialog } from "@/components/patient-form-dialog"
import { DailyLogsDialog } from "@/components/doctor/daily-logs-dialog"
import { SurgeryCalendarDialog } from "@/components/doctor/surgery-calendar-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  type Patient,
  subscribePatients,
  savePatientToFirestore,
  deletePatientFromFirestore,
  formatDate,
} from "@/lib/patients"
import {
  getDefaultMedicalRecord,
  subscribeMedicalRecord,
  saveMedicalRecordToFirestore,
  uploadMedicalImageToStorage,
  type MedicalRecord,
  type ImageField,
} from "@/lib/medical-records"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"

export function DoctorDashboard() {
  // 1. Call all React Hooks at the very top level before any conditional returns
  const { user, role, loading: authLoading, logout } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [records, setRecords] = useState<Record<string, MedicalRecord>>({})
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false)
  const [updatingFreeExam, setUpdatingFreeExam] = useState(false)

  // Medical Record Save & Upload States
  const [isSavingRecord, setIsSavingRecord] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  // Subscribe to real-time Firestore patient updates
  useEffect(() => {
    if (!user || role !== "doctor") return

    setLoadingPatients(true)
    const unsubscribe = subscribePatients((updatedPatients) => {
      setPatients(updatedPatients)
      setLoadingPatients(false)
    })

    return () => unsubscribe()
  }, [user, role])

  // Subscribe to real-time Firestore medical record updates for the selected patient
  useEffect(() => {
    if (!selectedId) return

    setUploadError(null)
    setSaveSuccessMsg(false)
    const unsubscribe = subscribeMedicalRecord(selectedId, (updatedRecord) => {
      setRecords((prev) => ({ ...prev, [selectedId]: updatedRecord }))
    })

    return () => unsubscribe()
  }, [selectedId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((p) => p.fullName.toLowerCase().includes(q))
  }, [patients, query])

  const selectedPatient = patients.find((p) => p.id === selectedId) ?? null
  const activeRecord: MedicalRecord | null = selectedPatient
    ? (records[selectedPatient.id] ?? getDefaultMedicalRecord(selectedPatient.id))
    : null

  // 2. Early returns AFTER all hooks have been executed
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

  // Role Guard: Restrict Doctor View to users with the "doctor" role
  if (role !== "doctor") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Access Denied</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Doctor View is restricted to accounts with the <span className="font-semibold text-foreground">Doctor</span> role. Your current account (<span className="font-medium text-foreground">{user.email}</span>) is assigned the <span className="font-semibold text-foreground">{role || "nurse"}</span> role.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Button variant="outline" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </div>
    )
  }

  // 3. Event handlers & main render logic
  function handleSearch(value: string) {
    setQuery(value)
  }

  function handleSelectPatient(id: string) {
    setSelectedId(id)
  }

  function handleRecordChange(record: MedicalRecord) {
    setRecords((prev) => ({ ...prev, [record.patientId]: record }))
  }

  async function handleSaveRecord(record: MedicalRecord) {
    setIsSavingRecord(true)
    setSaveSuccessMsg(false)
    setUploadError(null)
    try {
      await saveMedicalRecordToFirestore(record)
      handleRecordChange(record)
      setSaveSuccessMsg(true)
      setTimeout(() => setSaveSuccessMsg(false), 4000)
    } catch (err) {
      console.error("Failed to save medical record to Firestore:", err)
      setUploadError("Failed to save medical record to Firestore. Please check your connection or Firestore Security Rules.")
    } finally {
      setIsSavingRecord(false)
    }
  }

  async function handleEditPatient(values: Omit<Patient, "id">, id?: string) {
    if (!id) return
    await savePatientToFirestore(values, id)
    setEditDialogOpen(false)
  }

  async function handleToggleFreeReExam(checked: boolean) {
    if (!selectedPatient) return
    setUpdatingFreeExam(true)
    try {
      const { id, ...patientData } = selectedPatient
      await savePatientToFirestore({ ...patientData, freeReExam: checked }, id)
    } catch (err) {
      console.error("Failed to update free re-exam status:", err)
    } finally {
      setUpdatingFreeExam(false)
    }
  }

  async function handleDeletePatient(idToDelete: string) {
    if (selectedId === idToDelete) {
      setSelectedId(null)
    }
    await deletePatientFromFirestore(idToDelete)
  }

  async function handleUploadImage(field: ImageField, file: File) {
    if (!activeRecord || !selectedId) return
    setUploadingField(field)
    setUploadError(null)

    // Local preview immediately
    const localUrl = URL.createObjectURL(file)
    const previewRecord = { ...activeRecord, [field]: localUrl }
    handleRecordChange(previewRecord)

    try {
      const storageUrl = await uploadMedicalImageToStorage(selectedId, file, field)
      const updatedRecord = { ...activeRecord, [field]: storageUrl }
      handleRecordChange(updatedRecord)
      await saveMedicalRecordToFirestore(updatedRecord)
    } catch (err) {
      console.error("Firebase Storage Upload Error:", err)
      setUploadError(
        "Image upload failed — Firebase Storage may not be enabled or configured in Firebase Console. (Text notes can still be saved successfully)."
      )
    } finally {
      setUploadingField(null)
    }
  }

  async function handleUploadExamPhoto(file: File) {
    if (!activeRecord || !selectedId) return
    setUploadingField("examinations")
    setUploadError(null)

    const tempId = `e-${Date.now()}`
    const localUrl = URL.createObjectURL(file)
    const previewExam = { id: tempId, url: localUrl, description: "" }
    const previewRecord = {
      ...activeRecord,
      examinations: [...activeRecord.examinations, previewExam],
    }
    handleRecordChange(previewRecord)

    try {
      const storageUrl = await uploadMedicalImageToStorage(selectedId, file, "examinations")
      const updatedExam = { id: tempId, url: storageUrl, description: "" }
      const updatedRecord = {
        ...activeRecord,
        examinations: [...activeRecord.examinations.filter((e) => e.id !== tempId), updatedExam],
      }
      handleRecordChange(updatedRecord)
      await saveMedicalRecordToFirestore(updatedRecord)
    } catch (err) {
      console.error("Firebase Storage Upload Error:", err)
      setUploadError(
        "Examination photo upload failed — Firebase Storage may not be enabled or configured in Firebase Console. (Text notes can still be saved successfully)."
      )
    } finally {
      setUploadingField(null)
    }
  }

  function handlePrintPrescription(record: MedicalRecord) {
    window.print()
  }

  async function handleLogout() {
    await logout()
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex flex-col gap-3 border-b border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        {/* Top-Left: Logo, title, and ThemeToggle */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/logo.png"
              alt="ENT Clinic Logo"
              width={90}
              height={36}
              priority
              className="h-8 w-auto shrink-0 object-contain mix-blend-multiply dark:bg-white/90 dark:p-1 dark:rounded-lg dark:mix-blend-normal sm:h-9"
            />
            <div className="min-w-0">
              <h1 className="text-sm font-semibold leading-tight text-foreground sm:text-base">ENT Clinic</h1>
              <p className="truncate text-xs text-muted-foreground">Doctor View • {user.email}</p>
            </div>
          </div>
          <div className="hidden border-l border-border pl-3 sm:block">
            <ThemeToggle />
          </div>
        </div>

        {/* Top-Right: Doctor Controls (Logs, Calendar, Logout) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="sm:hidden">
            <ThemeToggle />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLogsDialogOpen(true)}
            className="font-medium bg-transparent"
          >
            <FileText className="mr-2 h-4 w-4" />
            Logs
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setCalendarDialogOpen(true)}
            className="font-medium shadow-xs"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Calendar
          </Button>

          <Button variant="outline" size="sm" onClick={handleLogout} className="bg-transparent">
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            Logout
          </Button>
        </div>
      </header>

      {/* Split screen */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left sidebar — full width on mobile when no patient selected, fixed width on desktop */}
        <aside
          className={`${
            selectedId ? "hidden md:flex" : "flex"
          } w-full flex-col border-r border-border bg-card md:w-72 md:flex`}
        >
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search patients..."
                aria-label="Search patients"
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto p-3" aria-label="Patient list">
            {loadingPatients ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">No patients found</p>
            ) : (
              filtered.map((patient) => {
                const isActive = patient.id === selectedId
                return (
                  <div
                    key={patient.id}
                    className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 transition-colors ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:border-border hover:bg-accent/50"
                    }`}
                  >
                    <button
                      onClick={() => handleSelectPatient(patient.id)}
                      aria-current={isActive ? "true" : undefined}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <UserRound className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 font-medium text-foreground text-sm truncate">
                          <span>{patient.fullName}</span>
                          {patient.freeReExam && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" title="Free Re-Exam Approved" />
                          )}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate">
                          Age {patient.age} · {formatDate(patient.lastVisit)}
                        </span>
                      </span>
                    </button>
                  </div>
                )
              })
            )}
          </nav>
        </aside>

        {/* Right main area — full width on mobile when a patient IS selected, always visible on desktop */}
        <main
          className={`${
            selectedPatient ? "flex" : "hidden md:flex"
          } min-w-0 flex-1 flex-col overflow-y-auto`}
        >
          {selectedPatient && activeRecord ? (
            <div className="mx-auto w-full max-w-4xl p-4 sm:p-6">
              {/* Mobile-only back button */}
              <button
                onClick={() => setSelectedId(null)}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground md:hidden"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to patient list
              </button>

              <div className="mb-6 rounded-xl border border-border bg-card p-4 space-y-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                      <UserRound className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 dir="auto" className="text-xl font-semibold text-foreground break-words">
                        {selectedPatient.fullName}
                      </h2>
                      <p dir="auto" className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                        <span>Age {selectedPatient.age}</span>
                        <span aria-hidden="true">·</span>
                        <span className="min-w-0 truncate">{selectedPatient.job}</span>
                      </p>
                      <p className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                        <CalendarIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        Last Visit: {formatDate(selectedPatient.lastVisit)}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Phone(s): <span className="font-mono text-foreground">{selectedPatient.phones.join(", ")}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                    <Button variant="outline" onClick={() => setEditDialogOpen(true)} className="bg-transparent">
                      <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                      Edit Details
                    </Button>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      Medical Dashboard
                    </span>
                  </div>
                </div>

                {/* Doctor Free Re-Exam Control Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={updatingFreeExam}
                      checked={Boolean(selectedPatient.freeReExam)}
                      onChange={(e) => handleToggleFreeReExam(e.target.checked)}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-sm font-medium text-foreground">
                      Free re-examination approved
                    </span>
                  </label>
                  {selectedPatient.freeReExam && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approved
                    </span>
                  )}
                </div>
              </div>

              <MedicalTabs
                record={activeRecord}
                patientName={selectedPatient.fullName}
                onChange={handleRecordChange}
                onSave={handleSaveRecord}
                onUploadImage={handleUploadImage}
                onUploadExamPhoto={handleUploadExamPhoto}
                onPrintPrescription={handlePrintPrescription}
                isSaving={isSavingRecord}
                saveSuccessMsg={saveSuccessMsg}
                uploadError={uploadError}
                uploadingField={uploadingField}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Image
                  src="/logo.png"
                  alt="ENT Clinic Logo"
                  width={64}
                  height={64}
                  className="h-12 w-auto object-contain mix-blend-multiply dark:bg-white/90 dark:p-1 dark:rounded-lg dark:mix-blend-normal"
                />
              </span>
              <h2 className="text-lg font-medium text-foreground">Select a patient</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Choose a patient from the list on the left to view and edit their medical dashboard.
              </p>
            </div>
          )}
        </main>
      </div>

      <PatientFormDialog
        open={editDialogOpen}
        patient={selectedPatient}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleEditPatient}
      />

      <DailyLogsDialog
        open={logsDialogOpen}
        onClose={() => setLogsDialogOpen(false)}
      />

      <SurgeryCalendarDialog
        open={calendarDialogOpen}
        onClose={() => setCalendarDialogOpen(false)}
        patients={patients}
      />
    </div>
  )
}
