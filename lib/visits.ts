import {
  collection,
  addDoc,
  collectionGroup,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export type PatientVisit = {
  id: string
  patientId: string
  patientName: string
  dateStr: string // "YYYY-MM-DD"
  createdAt: string
}

/**
 * Record a permanent visit entry in the patient's 'visits' subcollection (patients/{patientId}/visits).
 */
export async function recordPatientVisit(
  patientId: string,
  patientName: string,
  dateStr: string
): Promise<string> {
  const [y, m, d] = dateStr.split("-").map(Number)
  const visitDate = y && m && d ? new Date(y, m - 1, d) : new Date()

  const subColRef = collection(db, "patients", patientId, "visits")
  const docRef = await addDoc(subColRef, {
    patientId,
    patientName,
    dateStr,
    date: Timestamp.fromDate(visitDate),
    createdAt: new Date().toISOString(),
  })

  return docRef.id
}

/**
 * Fetch all visits across ALL patients for a specific date ("YYYY-MM-DD")
 * using a Firestore collectionGroup query.
 */
export async function fetchVisitsForDate(dateStr: string): Promise<PatientVisit[]> {
  try {
    const visitsRef = collectionGroup(db, "visits")
    const q = query(visitsRef, where("dateStr", "==", dateStr))
    const querySnapshot = await getDocs(q)

    const visits: PatientVisit[] = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        patientId: data.patientId || "",
        patientName: data.patientName || "Unknown Patient",
        dateStr: data.dateStr || dateStr,
        createdAt: data.createdAt || new Date().toISOString(),
      }
    })

    return visits
  } catch (err) {
    console.error("Error querying collectionGroup 'visits':", err)
    return []
  }
}

/**
 * Delete a visit entry from a patient's 'visits' subcollection.
 */
export async function deletePatientVisit(patientId: string, visitId: string): Promise<void> {
  const docRef = doc(db, "patients", patientId, "visits", visitId)
  await deleteDoc(docRef)
}
