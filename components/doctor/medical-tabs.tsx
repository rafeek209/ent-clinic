"use client"

import { useState, useEffect } from "react"
import {
  FlaskConical,
  FileClock,
  Pill,
  Camera,
  Printer,
  Save,
  Plus,
  Activity,
  Loader2,
  CheckCircle2,
  Pencil,
  Trash2,
  AlertTriangle,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/doctor/image-upload"
import type { MedicalRecord, ImageField } from "@/lib/medical-records"
import {
  scheduleSurgery,
  updateSurgery,
  deleteSurgery,
  subscribeSurgeriesForPatient,
  type Surgery,
} from "@/lib/surgeries"
import { formatDate } from "@/lib/patients"

type TabKey = "investigations" | "history" | "prescriptions" | "examinations" | "surgery"

const TABS: { key: TabKey; label: string; icon: typeof FlaskConical }[] = [
  { key: "investigations", label: "Investigations", icon: FlaskConical },
  { key: "history", label: "History", icon: FileClock },
  { key: "prescriptions", label: "Prescriptions", icon: Pill },
  { key: "examinations", label: "Examinations", icon: Camera },
  { key: "surgery", label: "Surgery", icon: Activity },
]

type MedicalTabsProps = {
  record: MedicalRecord
  patientName?: string
  onChange: (record: MedicalRecord) => void
  onSave: (record: MedicalRecord) => void
  onUploadImage: (field: ImageField, file: File) => void
  onUploadExamPhoto: (file: File) => void
  onPrintPrescription: (record: MedicalRecord) => void
}

export function MedicalTabs({
  record,
  patientName = "Patient",
  onChange,
  onSave,
  onUploadImage,
  onUploadExamPhoto,
  onPrintPrescription,
}: MedicalTabsProps) {
  const [active, setActive] = useState<TabKey>("investigations")

  // Surgery tab state
  const todayStr = new Date().toISOString().split("T")[0]
  const [patientSurgeries, setPatientSurgeries] = useState<Surgery[]>([])
  const [loadingSurgeries, setLoadingSurgeries] = useState(true)

  // Form state (both for creation and editing)
  const [editingSurgeryId, setEditingSurgeryId] = useState<string | null>(null)
  const [surgeryDesc, setSurgeryDesc] = useState("")
  const [surgeryDate, setSurgeryDate] = useState(todayStr)
  const [savingSurgery, setSavingSurgery] = useState(false)
  const [surgerySavedMsg, setSurgerySavedMsg] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Delete confirmation modal state
  const [deletingSurgery, setDeletingSurgery] = useState<Surgery | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Subscribe to surgeries for active patient
  useEffect(() => {
    if (!record.patientId) return

    setLoadingSurgeries(true)
    const unsubscribe = subscribeSurgeriesForPatient(record.patientId, (list) => {
      setPatientSurgeries(list)
      setLoadingSurgeries(false)
    })

    return () => unsubscribe()
  }, [record.patientId])

  function handleStartNewSurgery() {
    setEditingSurgeryId(null)
    setSurgeryDesc("")
    setSurgeryDate(todayStr)
    setShowForm(true)
  }

  function handleStartEditSurgery(s: Surgery) {
    setEditingSurgeryId(s.id)
    setSurgeryDesc(s.description)
    setSurgeryDate(s.dateStr || todayStr)
    setShowForm(true)
  }

  function handleCancelForm() {
    setEditingSurgeryId(null)
    setSurgeryDesc("")
    setSurgeryDate(todayStr)
    setShowForm(false)
  }

  async function handleSaveSurgery(e: React.FormEvent) {
    e.preventDefault()
    if (!surgeryDesc.trim() || !surgeryDate) return

    setSavingSurgery(true)
    setSurgerySavedMsg(false)
    try {
      if (editingSurgeryId) {
        // Update existing surgery
        await updateSurgery(editingSurgeryId, surgeryDesc, surgeryDate)
      } else {
        // Create new surgery
        await scheduleSurgery(record.patientId, patientName, surgeryDesc, surgeryDate)
      }
      setSurgerySavedMsg(true)
      handleCancelForm()
      setTimeout(() => setSurgerySavedMsg(false), 4000)
    } catch (err) {
      console.error("Error saving surgery:", err)
    } finally {
      setSavingSurgery(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deletingSurgery) return
    setIsDeleting(true)
    try {
      await deleteSurgery(deletingSurgery.id)
      setDeletingSurgery(null)
    } catch (err) {
      console.error("Error deleting surgery:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      {/* Tab triggers */}
      <div className="flex flex-wrap gap-1 border-b border-border" role="tablist" aria-label="Medical record sections">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.key)}
              className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-b-2 border-primary bg-primary/5 text-primary"
                  : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="py-6">
        {active === "investigations" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label htmlFor="lab-notes" className="mb-2 block text-sm font-medium text-foreground">
                Lab Notes
              </label>
              <textarea
                id="lab-notes"
                value={record.labNotes}
                onChange={(e) => onChange({ ...record, labNotes: e.target.value })}
                rows={10}
                placeholder="Enter lab results and investigation notes..."
                className="w-full resize-y rounded-lg border border-input bg-background p-3 text-sm leading-relaxed outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <ImageUpload
              label="Upload X-Ray / Test Image"
              imageUrl={record.xrayImageUrl}
              onUpload={(file) => onUploadImage("xrayImageUrl", file)}
              alt="Uploaded X-ray or test image"
            />
          </div>
        )}

        {active === "history" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label htmlFor="history" className="mb-2 block text-sm font-medium text-foreground">
                Medical History &amp; Previous Surgeries
              </label>
              <textarea
                id="history"
                value={record.history}
                onChange={(e) => onChange({ ...record, history: e.target.value })}
                rows={14}
                placeholder="Document the patient's medical history, chronic conditions, previous surgeries, allergies, and family history..."
                className="w-full resize-y rounded-lg border border-input bg-background p-3 text-sm leading-relaxed outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <ImageUpload
              label="Upload History Document / Image"
              imageUrl={record.historyImageUrl}
              onUpload={(file) => onUploadImage("historyImageUrl", file)}
              alt="Uploaded medical history document"
              height="h-72"
            />
          </div>
        )}

        {active === "prescriptions" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <ImageUpload
              label="Upload Old Prescription"
              imageUrl={record.oldPrescriptionUrl}
              onUpload={(file) => onUploadImage("oldPrescriptionUrl", file)}
              alt="Uploaded previous prescription"
            />
            <div>
              <label htmlFor="prescription" className="mb-2 block text-sm font-medium text-foreground">
                New Digital Prescription
              </label>
              <textarea
                id="prescription"
                value={record.newPrescription}
                onChange={(e) => onChange({ ...record, newPrescription: e.target.value })}
                rows={8}
                placeholder="Rx — write medication name, dosage, frequency, and duration..."
                className="w-full resize-y rounded-lg border border-input bg-background p-3 font-mono text-sm leading-relaxed outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              <Button type="button" variant="outline" className="mt-3 bg-transparent" onClick={() => onPrintPrescription(record)}>
                <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
                Print
              </Button>
            </div>
          </div>
        )}

        {active === "examinations" && (
          <div>
            <div className="mb-6">
              <label htmlFor="exam-notes" className="mb-2 block text-sm font-medium text-foreground">
                Examination Notes
              </label>
              <textarea
                id="exam-notes"
                value={record.examinationNotes}
                onChange={(e) => onChange({ ...record, examinationNotes: e.target.value })}
                rows={5}
                placeholder="Write down physical examination findings..."
                className="w-full resize-y rounded-lg border border-input bg-background p-3 text-sm leading-relaxed outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Examination photo gallery</p>
              <ExamUploadButton onUpload={onUploadExamPhoto} />
            </div>
            {record.examinations.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
                No examination photos yet
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {record.examinations.map((exam) => (
                  <div key={exam.id} className="rounded-lg border border-border bg-card p-2">
                    <div className="flex h-40 items-center justify-center overflow-hidden rounded-md bg-muted">
                      {exam.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={exam.url || "/placeholder.svg"} alt={exam.description || "Examination photo"} className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={exam.description}
                      placeholder="Add a description..."
                      onChange={(e) =>
                        onChange({
                          ...record,
                          examinations: record.examinations.map((x) =>
                            x.id === exam.id ? { ...x, description: e.target.value } : x,
                          ),
                        })
                      }
                      className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Surgery Tab */}
        {active === "surgery" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
              <div>
                <h3 className="text-base font-semibold text-foreground">Scheduled Surgeries for {patientName}</h3>
                <p className="text-xs text-muted-foreground">
                  All surgery records propagate in real-time to the Doctor Month Calendar
                </p>
              </div>
              {!showForm && (
                <Button onClick={handleStartNewSurgery} size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Schedule Surgery
                </Button>
              )}
            </div>

            {surgerySavedMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Surgery saved successfully! Updated on Doctor Calendar.</span>
              </div>
            )}

            {/* Form for Creating / Editing Surgery */}
            {showForm && (
              <form onSubmit={handleSaveSurgery} className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    {editingSurgeryId ? "Edit Surgery Entry" : "Schedule New Surgery"}
                  </h4>
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label htmlFor="surgery-date" className="mb-1.5 block text-sm font-medium text-foreground">
                    Surgery Date
                  </label>
                  <input
                    id="surgery-date"
                    type="date"
                    required
                    disabled={savingSurgery}
                    value={surgeryDate}
                    onChange={(e) => setSurgeryDate(e.target.value)}
                    className="w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </div>

                <div>
                  <label htmlFor="surgery-desc" className="mb-1.5 block text-sm font-medium text-foreground">
                    Surgery Description &amp; Surgical Notes
                  </label>
                  <textarea
                    id="surgery-desc"
                    required
                    value={surgeryDesc}
                    onChange={(e) => setSurgeryDesc(e.target.value)}
                    disabled={savingSurgery}
                    rows={5}
                    placeholder="Describe the procedure, preparation instructions, anesthesia type, or surgical goals..."
                    className="w-full resize-y rounded-lg border border-input bg-background p-3 text-sm leading-relaxed outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelForm}
                    disabled={savingSurgery}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingSurgery || !surgeryDesc.trim() || !surgeryDate}
                  >
                    {savingSurgery ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Surgery...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {editingSurgeryId ? "Update Surgery" : "Schedule Surgery"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* List of Previously Scheduled Surgeries */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Surgery History &amp; Upcoming Operations ({patientSurgeries.length})
              </h4>

              {loadingSurgeries ? (
                <div className="flex h-32 items-center justify-center rounded-xl border border-border bg-card">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : patientSurgeries.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-10 text-center text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm font-medium text-foreground">No surgeries recorded for this patient</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Schedule Surgery" above to add one.</p>
                </div>
              ) : (
                patientSurgeries.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(s.dateStr)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pt-1">
                        {s.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEditSurgery(s)}
                        className="bg-transparent"
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingSurgery(s)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Deletion Confirmation Modal */}
            {deletingSurgery && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
                  onClick={() => setDeletingSurgery(null)}
                />
                <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
                  <div className="flex items-center gap-3 text-destructive mb-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                      <AlertTriangle className="size-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Confirm Deletion</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Are you sure you want to delete this surgery scheduled for <strong className="text-foreground">{formatDate(deletingSurgery.dateStr)}</strong>? This cannot be undone.
                  </p>
                  <div className="flex items-center justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setDeletingSurgery(null)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Confirm Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save bar for other tabs */}
      {active !== "surgery" && (
        <div className="flex justify-end border-t border-border pt-4">
          <Button type="button" onClick={() => onSave(record)}>
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  )
}

function ExamUploadButton({ onUpload }: { onUpload: (file: File) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
      <Plus className="h-4 w-4" aria-hidden="true" />
      Upload Examination Photo
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ""
        }}
      />
    </label>
  )
}
