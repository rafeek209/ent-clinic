"use client"

import { useEffect, useState } from "react"
import { X, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { emptyPatient, type Patient } from "@/lib/patients"

type PatientFormDialogProps = {
  open: boolean
  /** When provided, the dialog is in "edit" mode and pre-fills the form. */
  patient: Patient | null
  onClose: () => void
  onSubmit: (values: Omit<Patient, "id">, id?: string) => Promise<void> | void
}

export function PatientFormDialog({ open, patient, onClose, onSubmit }: PatientFormDialogProps) {
  const [values, setValues] = useState<Omit<Patient, "id">>(emptyPatient)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync form values whenever the dialog opens for a new/edited patient.
  useEffect(() => {
    if (open) {
      setError(null)
      setIsSaving(false)
      const today = new Date().toISOString().split("T")[0]
      if (patient) {
        setValues({
          fullName: patient.fullName,
          age: patient.age,
          address: patient.address,
          phones: patient.phones && patient.phones.length > 0 ? [...patient.phones] : [""],
          job: patient.job,
          lastVisit: patient.lastVisit || today,
          freeReExam: Boolean(patient.freeReExam),
        })
      } else {
        setValues({
          ...emptyPatient,
          phones: [""],
          lastVisit: today,
          freeReExam: false,
        })
      }
    }
  }, [open, patient])

  if (!open) return null

  const isEditing = Boolean(patient)

  function handleChange(key: keyof Omit<Patient, "id" | "phones">, raw: unknown) {
    setValues((prev) => ({
      ...prev,
      [key]: key === "age" ? Number(raw) || 0 : raw,
    }))
  }

  function handlePhoneChange(index: number, val: string) {
    setValues((prev) => {
      const nextPhones = [...prev.phones]
      nextPhones[index] = val
      return { ...prev, phones: nextPhones }
    })
  }

  function handleAddPhone() {
    setValues((prev) => ({
      ...prev,
      phones: [...prev.phones, ""],
    }))
  }

  function handleRemovePhone(index: number) {
    setValues((prev) => {
      if (prev.phones.length <= 1) return prev
      return {
        ...prev,
        phones: prev.phones.filter((_, i) => i !== index),
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      await onSubmit(values, patient?.id)
    } catch (err: unknown) {
      console.error("Save patient error:", err)
      setError("Failed to save patient to Firestore. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-form-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        disabled={isSaving}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card shadow-xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="patient-form-title" className="text-lg font-semibold text-card-foreground text-balance">
            {isEditing ? "Edit Patient Details" : "Add New Patient"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="px-6 py-5 overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-foreground">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                disabled={isSaving}
                value={values.fullName}
                placeholder="e.g. Jane Doe"
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
              />
            </div>

            {/* Age */}
            <div>
              <label htmlFor="age" className="mb-1.5 block text-sm font-medium text-foreground">
                Age
              </label>
              <input
                id="age"
                type="number"
                required
                min={0}
                disabled={isSaving}
                value={values.age === 0 ? "" : values.age}
                placeholder="e.g. 42"
                onChange={(e) => handleChange("age", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
              />
            </div>

            {/* Job */}
            <div>
              <label htmlFor="job" className="mb-1.5 block text-sm font-medium text-foreground">
                Job
              </label>
              <input
                id="job"
                type="text"
                required
                disabled={isSaving}
                value={values.job}
                placeholder="e.g. Teacher"
                onChange={(e) => handleChange("job", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-foreground">
                Address
              </label>
              <input
                id="address"
                type="text"
                required
                disabled={isSaving}
                value={values.address}
                placeholder="Street, City"
                onChange={(e) => handleChange("address", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
              />
            </div>

            {/* Last Visit Date */}
            <div className="sm:col-span-2">
              <label htmlFor="lastVisit" className="mb-1.5 block text-sm font-medium text-foreground">
                Last Visit Date
              </label>
              <input
                id="lastVisit"
                type="date"
                required
                disabled={isSaving}
                value={values.lastVisit || ""}
                onChange={(e) => handleChange("lastVisit", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
              />
            </div>

            {/* Multiple Phone Numbers */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Phone Numbers
              </label>
              {values.phones.map((phone, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="tel"
                    required={idx === 0}
                    disabled={isSaving}
                    value={phone}
                    placeholder={`Phone #${idx + 1}`}
                    onChange={(e) => handlePhoneChange(idx, e.target.value)}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                  />
                  {values.phones.length > 1 && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleRemovePhone(idx)}
                      title="Remove phone number"
                      className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={handleAddPhone}
                className="mt-1 bg-transparent text-xs"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Phone Number
              </Button>
            </div>

            {/* Free Re-Exam Checkbox */}
            <div className="sm:col-span-2 pt-2 border-t border-border">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isSaving}
                  checked={Boolean(values.freeReExam)}
                  onChange={(e) => handleChange("freeReExam", e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">
                  Free re-examination approved
                </span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving to Firestore...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Save Patient"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
