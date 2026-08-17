"use client"

import { useEffect, useState, useMemo } from "react"
import {
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Activity,
  Loader2,
  User,
  Search,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { subscribeSurgeriesForMonth, scheduleSurgery, type Surgery } from "@/lib/surgeries"
import { type Patient, formatDate } from "@/lib/patients"

type SurgeryCalendarDialogProps = {
  open: boolean
  onClose: () => void
  patients: Patient[]
}

export function SurgeryCalendarDialog({ open, onClose, patients }: SurgeryCalendarDialogProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1) // 1-indexed (1-12)
  const [surgeries, setSurgeries] = useState<Surgery[]>([])
  const [loading, setLoading] = useState(true)

  const todayStr = today.toISOString().split("T")[0]
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr)

  // Quick schedule form state
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [patientSearch, setPatientSearch] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [surgeryDesc, setSurgeryDesc] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Subscribe to Firestore surgeries for the active month
  useEffect(() => {
    if (!open) return

    setLoading(true)
    const unsubscribe = subscribeSurgeriesForMonth(currentYear, currentMonth, (list) => {
      setSurgeries(list)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [open, currentYear, currentMonth])

  // Calendar calculations
  const monthName = new Date(currentYear, currentMonth - 1, 1).toLocaleString("en-US", {
    month: "long",
  })

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay() // 0 = Sun

  // Map dateStr ("YYYY-MM-DD") -> array of surgeries
  const surgeriesByDate = useMemo(() => {
    const map: Record<string, Surgery[]> = {}
    for (const s of surgeries) {
      if (!map[s.dateStr]) map[s.dateStr] = []
      map[s.dateStr].push(s)
    }
    return map
  }, [surgeries])

  const daySurgeries = surgeriesByDate[selectedDateStr] || []

  // Filtered patients for dropdown
  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((p) => p.fullName.toLowerCase().includes(q))
  }, [patients, patientSearch])

  const selectedPatientObj = patients.find((p) => p.id === selectedPatientId) || null

  if (!open) return null

  function handlePrevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function handleNextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  function handleGoToday() {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth() + 1)
    setSelectedDateStr(todayStr)
  }

  async function handleScheduleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPatientId || !selectedPatientObj || !surgeryDesc.trim()) return

    setSubmitting(true)
    try {
      await scheduleSurgery(
        selectedPatientObj.id,
        selectedPatientObj.fullName,
        surgeryDesc,
        selectedDateStr
      )
      setShowScheduleForm(false)
      setSurgeryDesc("")
      setSelectedPatientId("")
      setPatientSearch("")
    } catch (err) {
      console.error("Error scheduling surgery from calendar:", err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-dialog-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      {/* Main Container */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col rounded-xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 id="calendar-dialog-title" className="text-lg font-semibold text-foreground">
                Surgery Calendar
              </h2>
              <p className="text-xs text-muted-foreground">
                View &amp; schedule surgeries across all patients
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

        {/* Calendar Body */}
        <div className="flex flex-1 flex-col lg:flex-row min-h-0 overflow-y-auto">
          {/* Left Grid: Month View */}
          <div className="flex flex-1 flex-col border-r border-border p-6 min-w-0">
            {/* Month Navigator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-foreground">
                  {monthName} {currentYear}
                </h3>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-primary ml-1" />}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleGoToday} className="text-xs">
                  Today
                </Button>
                <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 flex-1">
              {/* Empty padding cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-16 rounded-lg bg-muted/20 border border-transparent" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1
                const paddedDay = String(dayNum).padStart(2, "0")
                const paddedMonth = String(currentMonth).padStart(2, "0")
                const dateKey = `${currentYear}-${paddedMonth}-${paddedDay}`

                const isToday = dateKey === todayStr
                const isSelected = dateKey === selectedDateStr
                const list = surgeriesByDate[dateKey] || []

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      setSelectedDateStr(dateKey)
                      setShowScheduleForm(false)
                    }}
                    className={`flex flex-col items-start justify-between min-h-16 p-2 rounded-lg border transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : isToday
                        ? "border-primary/40 bg-accent/30"
                        : "border-border hover:bg-accent/40"
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center ${
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-foreground"
                      }`}
                    >
                      {dayNum}
                    </span>

                    {list.length > 0 && (
                      <div className="mt-1 w-full">
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary truncate max-w-full">
                          <Activity className="h-2.5 w-2.5 shrink-0" />
                          {list.length} Surgery{list.length > 1 ? "ies" : ""}
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Sidebar: Selected Day Details & Scheduling */}
          <div className="w-full lg:w-80 flex flex-col bg-card p-6 border-t lg:border-t-0 border-border">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {formatDate(selectedDateStr)}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {daySurgeries.length} scheduled procedure{daySurgeries.length === 1 ? "" : "s"}
                </p>
              </div>

              {!showScheduleForm && (
                <Button
                  size="sm"
                  onClick={() => setShowScheduleForm(true)}
                  className="text-xs"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
              )}
            </div>

            {/* Direct Calendar Schedule Form */}
            {showScheduleForm ? (
              <form onSubmit={handleScheduleSubmit} className="space-y-4 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Schedule Surgery
                  </h5>
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>

                {/* Patient Searchable Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Select Patient
                  </label>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="w-full flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none"
                  >
                    <span className="truncate">
                      {selectedPatientObj ? selectedPatientObj.fullName : "Choose a patient..."}
                    </span>
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg p-2 space-y-1">
                      <div className="relative mb-1">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="search"
                          placeholder="Search patient name..."
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          className="w-full rounded-md border border-input bg-background py-1 pl-8 pr-2 text-xs outline-none"
                        />
                      </div>
                      {filteredPatients.length === 0 ? (
                        <p className="p-2 text-center text-xs text-muted-foreground">No patients found</p>
                      ) : (
                        filteredPatients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatientId(p.id)
                              setDropdownOpen(false)
                            }}
                            className="w-full flex items-center justify-between rounded-md p-2 text-left text-xs hover:bg-accent transition-colors"
                          >
                            <span className="font-medium text-foreground">{p.fullName}</span>
                            {selectedPatientId === p.id && (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Surgery Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={surgeryDesc}
                    onChange={(e) => setSurgeryDesc(e.target.value)}
                    placeholder="Surgical notes, procedure details, anesthesia..."
                    className="w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScheduleForm(false)}
                    disabled={submitting}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submitting || !selectedPatientId || !surgeryDesc.trim()}
                    className="text-xs"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm Surgery"}
                  </Button>
                </div>
              </form>
            ) : (
              /* Surgery List for Selected Day */
              <div className="flex-1 overflow-y-auto space-y-3">
                {daySurgeries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                    <Activity className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-xs font-medium">No surgeries scheduled for this day</p>
                  </div>
                ) : (
                  daySurgeries.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-border bg-card p-3 shadow-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground">
                          {s.patientName}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Scheduled
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {s.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-3 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </div>
  )
}
