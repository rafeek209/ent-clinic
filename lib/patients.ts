import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { recordPatientVisit } from "@/lib/visits"

export type Patient = {
  id: string
  fullName: string
  age: number
  address: string
  phones: string[]
  job: string
  lastVisit?: string // Stored as "YYYY-MM-DD" for form inputs, derived from Firestore Timestamp
  freeReExam?: boolean
}

const todayIso = new Date().toISOString().split("T")[0]

// Mock seed data used to populate Firestore if collection is empty
export const initialPatients: Patient[] = [
  {
    id: "1",
    fullName: "Sarah Johnson",
    age: 34,
    address: "142 Maple Street, Springfield",
    phones: ["555-0142", "555-0143"],
    job: "Teacher",
    lastVisit: todayIso,
    freeReExam: true,
  },
  {
    id: "2",
    fullName: "Michael Chen",
    age: 58,
    address: "77 Oakwood Ave, Riverside",
    phones: ["555-0199"],
    job: "Accountant",
    lastVisit: todayIso,
    freeReExam: false,
  },
  {
    id: "3",
    fullName: "Amara Okafor",
    age: 27,
    address: "9 Birch Lane, Lakeview",
    phones: ["555-0110"],
    job: "Software Engineer",
    lastVisit: todayIso,
    freeReExam: false,
  },
  {
    id: "4",
    fullName: "David Martinez",
    age: 45,
    address: "301 Cedar Blvd, Hilltop",
    phones: ["555-0177", "555-0178"],
    job: "Electrician",
    lastVisit: todayIso,
    freeReExam: false,
  },
  {
    id: "5",
    fullName: "Fatima Al-Sayed",
    age: 62,
    address: "18 Willow Court, Downtown",
    phones: ["555-0165"],
    job: "Retired",
    lastVisit: todayIso,
    freeReExam: true,
  },
]

export const emptyPatient: Omit<Patient, "id"> = {
  fullName: "",
  age: 0,
  address: "",
  phones: [""],
  job: "",
  lastVisit: todayIso,
  freeReExam: false,
}

const PATIENTS_COLLECTION = "patients"

/**
 * Parses raw Firestore values (Timestamp, Date, string) for 'last visit' into "YYYY-MM-DD" string.
 */
export function parseLastVisit(raw: unknown): string {
  if (!raw) return todayIso

  if (
    typeof raw === "object" &&
    raw !== null &&
    "toDate" in raw &&
    typeof (raw as { toDate: () => Date }).toDate === "function"
  ) {
    const d = (raw as { toDate: () => Date }).toDate()
    return d.toISOString().split("T")[0]
  }

  if (raw instanceof Date) {
    return raw.toISOString().split("T")[0]
  }

  if (typeof raw === "string") {
    return raw.slice(0, 10)
  }

  return todayIso
}

/**
 * Formats a "YYYY-MM-DD" string or date into a readable format like "Aug 17, 2026".
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return "N/A"

  const parts = dateStr.split("-").map(Number)
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const [year, month, day] = parts
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return dateStr
}

/**
 * Seed initial patients to Firestore if the collection is empty.
 */
async function seedIfEmpty() {
  try {
    const batch = writeBatch(db)
    for (const p of initialPatients) {
      const docRef = doc(db, PATIENTS_COLLECTION, p.id)
      const { id, lastVisit, ...data } = p
      const [y, m, d] = (lastVisit || todayIso).split("-").map(Number)
      batch.set(docRef, {
        ...data,
        "last visit": Timestamp.fromDate(new Date(y, m - 1, d)),
      })
    }
    await batch.commit()

    // Record initial visit history entries for seeded patients
    for (const p of initialPatients) {
      if (p.lastVisit) {
        await recordPatientVisit(p.id, p.fullName, p.lastVisit)
      }
    }
  } catch (err) {
    console.error("Error seeding initial patients to Firestore:", err)
  }
}

/**
 * Subscribe to real-time updates from Firestore 'patients' collection.
 */
export function subscribePatients(
  callback: (patients: Patient[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, PATIENTS_COLLECTION)

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        seedIfEmpty()
        callback(initialPatients)
        return
      }

      const list: Patient[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        const rawLastVisit = data["last visit"] ?? data.lastVisit

        // Parse phones array (support legacy single string `phone` field)
        let parsedPhones: string[] = []
        if (Array.isArray(data.phones) && data.phones.length > 0) {
          parsedPhones = data.phones.map(String).filter((p) => p.trim() !== "")
        } else if (data.phone && typeof data.phone === "string") {
          parsedPhones = [data.phone]
        }
        if (parsedPhones.length === 0) {
          parsedPhones = ["N/A"]
        }

        return {
          id: docSnap.id,
          fullName: data.fullName || "",
          age: Number(data.age) || 0,
          address: data.address || "",
          phones: parsedPhones,
          job: data.job || "",
          lastVisit: parseLastVisit(rawLastVisit),
          freeReExam: Boolean(data.freeReExam),
        }
      })
      callback(list)
    },
    (err) => {
      console.error("Firestore patients subscription error:", err)
      if (onError) onError(err)
      callback(initialPatients)
    }
  )
}

/**
 * Save a patient to Firestore, writing 'last visit' as a Firestore Timestamp and logging a visit history entry.
 */
export async function savePatientToFirestore(
  values: Omit<Patient, "id">,
  id?: string
): Promise<string> {
  const cleanPhones = values.phones.map((p) => p.trim()).filter(Boolean)

  const payload: Record<string, unknown> = {
    fullName: values.fullName,
    age: values.age,
    address: values.address,
    phones: cleanPhones.length > 0 ? cleanPhones : ["N/A"],
    job: values.job,
    freeReExam: Boolean(values.freeReExam),
  }

  if (values.lastVisit) {
    const [y, m, d] = values.lastVisit.split("-").map(Number)
    if (y && m && d) {
      payload["last visit"] = Timestamp.fromDate(new Date(y, m - 1, d))
    }
  }

  let savedId = id
  if (savedId) {
    const docRef = doc(db, PATIENTS_COLLECTION, savedId)
    await setDoc(docRef, payload, { merge: true })
  } else {
    const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), payload)
    savedId = docRef.id
  }

  // Record permanent visit entry in subcollection
  if (values.lastVisit && savedId) {
    try {
      await recordPatientVisit(savedId, values.fullName, values.lastVisit)
    } catch (err) {
      console.error("Error logging visit history entry:", err)
    }
  }

  return savedId
}

/**
 * Delete a patient document from Firestore by ID.
 */
export async function deletePatientFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, PATIENTS_COLLECTION, id)
  await deleteDoc(docRef)
}
