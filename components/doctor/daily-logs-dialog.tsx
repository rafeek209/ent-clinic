"use client"

import { useEffect, useState } from "react"
import { X, Calendar, Users, Loader2, FileText, UserCheck, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchVisitsForDate, deletePatientVisit, type PatientVisit } from "@/lib/visits"
import { formatDate } from "@/lib/patients"

type DailyLogsDialogProps = {
  open: boolean
  onClose: () => void
}

export function DailyLogsDialog({ open, onClose }: DailyLogsDialogProps) {
  const todayStr = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [visits, setVisits] = useState<PatientVisit[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingVisit, setDeletingVisit] = useState<PatientVisit | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!open) return

    async function loadLogs() {
      setLoading(true)
      const data = await fetchVisitsForDate(selectedDate)
      setVisits(data)
      setLoading(false)
    }

    loadLogs()
  }, [open, selectedDate])

  if (!open) return null

  async function handleConfirmDelete() {
    if (!deletingVisit) return
    setIsDeleting(true)
    try {
      await deletePatientVisit(deletingVisit.patientId, deletingVisit.id)
      setVisits((prev) => prev.filter((v) => v.id !== deletingVisit.id))
      setDeletingVisit(null)
    } catch (err) {
      console.error("Error deleting visit:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logs-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl flex flex-col max-h-[85vh]">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h2 id="logs-dialog-title" className="text-lg font-semibold text-foreground">
                Daily Patient Visit Logs
              </h2>
              <p className="text-xs text-muted-foreground">
                Querying subcollections across all patients for the selected date
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Controls & Summary */}
        <div className="border-b border-border bg-muted/40 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <label htmlFor="log-date-picker" className="text-sm font-medium text-foreground">
              Select Date:
            </label>
            <input
              id="log-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3.5 py-1.5 text-primary">
            <Users className="h-4 w-4" />
            <span className="text-xs font-semibold">
              Total Visits: <span className="text-sm">{visits.length}</span>
            </span>
          </div>
        </div>

        {/* Logged Visits List */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Searching visit subcollections...</span>
            </div>
          ) : visits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                <Calendar className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">No visits recorded for {formatDate(selectedDate)}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Try picking another date or updating patient last visit dates.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-1">
                <span>Patient Name</span>
                <span>Logged Date / Time</span>
              </div>
              {visits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <UserCheck className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {visit.patientName}
                    </span>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <span className="block text-xs font-medium text-foreground">
                        {formatDate(visit.dateStr)}
                      </span>
                      <span className="block text-[11px] text-muted-foreground font-mono">
                        {new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeletingVisit(visit)}
                      className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
                      title="Delete log entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="border-t border-border px-6 py-3 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>

      {/* Deletion Confirmation Modal */}
      {deletingVisit && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setDeletingVisit(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3 text-destructive mb-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Delete this visit log entry? This cannot be undone. 
              <br/><br/>
              Note: This will only remove this specific log entry from the visits record.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingVisit(null)}
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
  )
}
