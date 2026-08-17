"use client"

import { useState } from "react"
import { Pencil, Trash2, UserRound, AlertTriangle, Calendar, Phone, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate, type Patient } from "@/lib/patients"

type PatientTableProps = {
  patients: Patient[]
  onEdit: (patient: Patient) => void
  onDelete?: (patient: Patient) => void
}

export function PatientTable({ patients, onEdit, onDelete }: PatientTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)

  function confirmDelete() {
    if (deleteTarget && onDelete) {
      onDelete(deleteTarget)
    }
    setDeleteTarget(null)
  }

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
          <UserRound className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No patients found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different search, or add a new patient.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Desktop table */}
        <table className="hidden w-full text-left text-sm md:table">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-6 py-3 font-medium">Name</th>
              <th scope="col" className="px-6 py-3 font-medium">Age</th>
              <th scope="col" className="px-6 py-3 font-medium">Phone(s)</th>
              <th scope="col" className="px-6 py-3 font-medium">Address</th>
              <th scope="col" className="px-6 py-3 font-medium">Job</th>
              <th scope="col" className="px-6 py-3 font-medium">Last Visit</th>
              <th scope="col" className="px-6 py-3 font-medium">Status</th>
              <th scope="col" className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr
                key={patient.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
              >
                <td className="px-6 py-4 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <span>{patient.fullName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{patient.age}</td>
                <td className="px-6 py-4 text-muted-foreground">
                  <div className="flex flex-col gap-0.5">
                    {patient.phones.map((ph, i) => (
                      <span key={i} className="text-xs font-mono">{ph}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{patient.address}</td>
                <td className="px-6 py-4 text-muted-foreground">{patient.job}</td>
                <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
                    <Calendar className="size-3.5 text-primary" />
                    <span>{formatDate(patient.lastVisit)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                  {patient.freeReExam ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="size-3.5" />
                      Free Re-Exam
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(patient)}
                      aria-label={`Edit ${patient.fullName}`}
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(patient)}
                        aria-label={`Delete ${patient.fullName}`}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile cards */}
        <ul className="divide-y divide-border md:hidden">
          {patients.map((patient) => (
            <li key={patient.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground">{patient.fullName}</p>
                  {patient.freeReExam && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="size-3" />
                      Free Re-Exam
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {patient.age} yrs &middot; {patient.job}
                </p>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="size-3 shrink-0" />
                  <span>{patient.phones.join(", ")}</span>
                </div>
                <p className="truncate text-sm text-muted-foreground">{patient.address}</p>
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                  <Calendar className="size-3" />
                  <span>Last Visit: {formatDate(patient.lastVisit)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(patient)}
                  aria-label={`Edit ${patient.fullName}`}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(patient)}
                    aria-label={`Delete ${patient.fullName}`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3 text-destructive mb-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete patient <strong className="text-foreground">{deleteTarget.fullName}</strong>? This action cannot be undone and will permanently remove their document from Firestore.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
