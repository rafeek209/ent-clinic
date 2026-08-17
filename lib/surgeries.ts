import {
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export type Surgery = {
  id: string
  patientId: string
  patientName: string
  description: string
  dateStr: string // "YYYY-MM-DD"
  createdAt: string
}

const SURGERIES_COLLECTION = "surgeries"

/**
 * Schedule a new surgery or add a surgery entry to the top-level 'surgeries' collection.
 */
export async function scheduleSurgery(
  patientId: string,
  patientName: string,
  description: string,
  dateStr: string
): Promise<string> {
  const [y, m, d] = dateStr.split("-").map(Number)
  const surgeryDate = y && m && d ? new Date(y, m - 1, d) : new Date()

  const colRef = collection(db, SURGERIES_COLLECTION)
  const docRef = await addDoc(colRef, {
    patientId,
    patientName,
    description: description.trim(),
    dateStr,
    date: Timestamp.fromDate(surgeryDate),
    createdAt: new Date().toISOString(),
  })

  return docRef.id
}

/**
 * Update an existing surgery document in the top-level 'surgeries' collection.
 */
export async function updateSurgery(
  id: string,
  description: string,
  dateStr: string
): Promise<void> {
  const [y, m, d] = dateStr.split("-").map(Number)
  const surgeryDate = y && m && d ? new Date(y, m - 1, d) : new Date()

  const docRef = doc(db, SURGERIES_COLLECTION, id)
  await setDoc(
    docRef,
    {
      description: description.trim(),
      dateStr,
      date: Timestamp.fromDate(surgeryDate),
    },
    { merge: true }
  )
}

/**
 * Delete a surgery document from the top-level 'surgeries' collection.
 */
export async function deleteSurgery(id: string): Promise<void> {
  const docRef = doc(db, SURGERIES_COLLECTION, id)
  await deleteDoc(docRef)
}

/**
 * Subscribe to real-time updates for surgeries for a specific patient.
 */
export function subscribeSurgeriesForPatient(
  patientId: string,
  callback: (surgeries: Surgery[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, SURGERIES_COLLECTION)
  const q = query(colRef, where("patientId", "==", patientId))

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Surgery[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          patientId: data.patientId || "",
          patientName: data.patientName || "Unknown Patient",
          description: data.description || "",
          dateStr: data.dateStr || "",
          createdAt: data.createdAt || new Date().toISOString(),
        }
      })

      // Sort by dateStr ascending
      list.sort((a, b) => a.dateStr.localeCompare(b.dateStr))
      callback(list)
    },
    (err) => {
      console.error("Error subscribing to patient surgeries:", err)
      if (onError) onError(err)
      callback([])
    }
  )
}

/**
 * Subscribe to real-time updates for surgeries within a given visible month (1-indexed month, 1-12).
 */
export function subscribeSurgeriesForMonth(
  year: number,
  month: number,
  callback: (surgeries: Surgery[]) => void,
  onError?: (error: Error) => void
) {
  const paddedMonth = String(month).padStart(2, "0")
  const startStr = `${year}-${paddedMonth}-01`
  const endStr = `${year}-${paddedMonth}-31`

  const colRef = collection(db, SURGERIES_COLLECTION)
  const q = query(
    colRef,
    where("dateStr", ">=", startStr),
    where("dateStr", "<=", endStr)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Surgery[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          patientId: data.patientId || "",
          patientName: data.patientName || "Unknown Patient",
          description: data.description || "",
          dateStr: data.dateStr || startStr,
          createdAt: data.createdAt || new Date().toISOString(),
        }
      })
      callback(list)
    },
    (err) => {
      console.error("Error subscribing to surgeries collection:", err)
      if (onError) onError(err)
      callback([])
    }
  )
}
